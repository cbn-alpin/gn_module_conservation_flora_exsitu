import logging

from flask import Blueprint, request, g, Response
from geonature.core.gn_permissions import decorators as permissions
from utils_flask_sqla.response import json_resp
from .repositories import HarvestRepository, HarvestMaterialRepository, TMaterielSeedRepository, StorageRepository
from .models import TMaterial, THarvest, CorMaterialTaxon, CorHarvestObserver, TMaterielSeed, TStorage
from gn_module_conservation_flora_exsitu import MODULE_CODE
from ref_geo.models import LAreas, BibAreasTypes
from geonature.utils.env import db
from sqlalchemy.sql.expression import func, select
from sqlalchemy.orm import aliased
from apptax.taxonomie.models import Taxref
from pypnusershub.db.models import User, Organisme
from geojson import Feature, FeatureCollection
from sqlalchemy import exists
from flask import request, jsonify
from pypn_habref_api.models import Habref
from geoalchemy2.functions import ST_AsGeoJSON
import json
from pypnnomenclature.models import TNomenclatures
from collections import defaultdict
from io import StringIO
import csv
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload
from sqlalchemy.sql import text
import sqlalchemy as sa
from sqlalchemy import case, cast, String


blueprint = Blueprint("conservation_flora_exsitu", __name__)
log = logging.getLogger(__name__)


def group_geometries(results):
    geom_dict = defaultdict(list)
    # Groupement des récoltes par géométrie
    for id_harvest, geom in results:
        geom_dict[geom].append(id_harvest)
        
    # On supprime les doublons dans les listes d'IDs
    grouped_results = [
        {"geom": geom, "harvest_ids": list(set(harvest_ids))}  # Enlève les doublons dans les IDs
        for geom, harvest_ids in geom_dict.items()
    ]

    return grouped_results



@blueprint.route("/harvests", methods=["POST"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def create_harvest():
    """Ajout d'une récolte"""
    data = request.get_json()
    data["meta_create_by"] = g.current_user.id_role
    harvest_repo = HarvestRepository()
    harvest = harvest_repo.create(data)
    return {"message": "Harvest created successfully", "harvest": harvest.to_dic()}, 201

@blueprint.route("/harvests/<int:harvest_id>", methods=["DELETE"])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_harvest(harvest_id):
    """Suppression d'une récolte avec ses associations d'observateurs"""
    harvest_repo = HarvestRepository()
    harvest = THarvest.query.get(harvest_id)

    if not harvest:
        return {"message": "Harvest not found"}, 404

    try:
        CorHarvestObserver.query.filter_by(id_harvest=harvest.id_harvest).delete()

        harvest_repo.delete(harvest)
        
        return {"message": "Harvest and its observer associations deleted successfully"}, 200 
    except Exception as e:
        return {"message": "Error deleting harvest", "error": str(e)}, 500


@blueprint.route("/harvests/<int:id_harvest>", methods=["PUT"])
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
@json_resp
def update_harvest(id_harvest):
    """Mise à jour d'une récolte"""
    data = request.get_json()
    data["meta_update_by"] = g.current_user.id_role
    harvest_repo = HarvestRepository()
    try:
        harvest = harvest_repo.update(id_harvest, data)
        return {"message": "Harvest updated successfully", "harvest": harvest.to_dic()}, 200
    except Exception as e:
        return {"message": str(e)}, 400
    


@blueprint.route("/harvests", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_harvests():
    """Récupère toutes les récoltes avec pagination et filtres (taxons, département, commune, observateurs)"""

    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=10, type=int)
    offset = (page - 1) * limit

    selected_ids = request.args.getlist('selected_ids', type=int)
    cd_nom_list = request.args.getlist('cd_nom', type=int)  
    cd_hab = request.args.get('cd_hab', type=int)  
    date_start = request.args.get('date_start', type=str) 
    date_end = request.args.get('date_end', type=str) 
    observers = request.args.getlist('observers')  
    municipalites = request.args.getlist('municipalites')  
    departements = request.args.getlist('departements')  
    id_harvest_type = request.args.get('id_harvest_type', type=int)  
    code_material = request.args.get('code_material', type=str)  

    harvest_repo = HarvestRepository()

    query = harvest_repo.build_harvest_query(
        cd_nom_list, 
        cd_hab, 
        date_start, 
        date_end, 
        observers, 
        municipalites, 
        departements, 
        id_harvest_type, 
        code_material
    )

    total = db.session.query(db.func.count()).select_from(query.subquery()).scalar()

    if selected_ids:
        selected_query = query.filter(THarvest.id_harvest.in_(selected_ids))
        selected_query = selected_query.order_by(
            TMaterial.code_material.isnot(None),
            THarvest.date_start.desc(),
            THarvest.id_harvest.desc(),
            TMaterial.code_material.desc()
        )

        # Récupérer les résultats surlignés
        selected_results = selected_query.all()

        # Calculer combien d'éléments il nous faut encore pour compléter la page
        remaining_limit = limit - len(selected_results)

        # Si le nombre restant est supérieur à 0, récupérer les autres résultats pour compléter la page
        if remaining_limit > 0:
            # Appliquer la pagination sur les résultats non sélectionnés
            normal_query = query.filter(~THarvest.id_harvest.in_(selected_ids))
            normal_query = normal_query.order_by(
                TMaterial.code_material.isnot(None),
                THarvest.date_start.desc(),
                THarvest.id_harvest.desc(),
                TMaterial.code_material.desc()
            )

            normal_results = normal_query.offset(offset).limit(remaining_limit).all()
        else:
            normal_results = []

        # Combiner les résultats sélectionnés et ceux récupérés pour compléter la page
        all_results = selected_results + normal_results

        # Calculer le nombre total de résultats
        total_results = total
    else:
        # Si aucun selected_id, appliquer la pagination de manière classique
        all_results = query.order_by(
            TMaterial.code_material.isnot(None),
            THarvest.date_start.desc(),
            THarvest.id_harvest.desc(),
            TMaterial.code_material.desc()
        ).offset(offset).limit(limit).all()

        # Calculer le nombre total de résultats
        total_results = total

    items = [
        {
            "id_harvest": result.id_harvest,
            "date_start": result.date_start,
            "code_material": result.code_material,
            "taxons": result.taxons,
            "departement_name": result.departement_name,
            "departement_code": result.departement_code,
            "commune": result.commune,
            "observateurs": result.observateurs,
        }
        for result in all_results
    ]

    total_pages = (total_results + limit - 1) // limit  # Calcul du total de pages

    return {
        'page': page,
        'limit': limit,
        'total': total_results,
        'total_pages': total_pages,
        'items': items
    }, 200



@blueprint.route("/harvests/geometries", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_harvest_geometries():
    """Récupère uniquement les géométries des récoltes avec filtrage et pagination"""

    cd_nom_list = request.args.getlist('cd_nom', type=int)  
    cd_hab = request.args.get('cd_hab', type=int)  
    date_start = request.args.get('date_start', type=str) 
    date_end = request.args.get('date_end', type=str) 
    observers = request.args.getlist('observers')  
    municipalites = request.args.getlist('municipalites')  
    departements = request.args.getlist('departements')  
    id_harvest_type = request.args.get('id_harvest_type', type=int)  
    code_material = request.args.get('code_material', type=str)  

    harvest_repo = HarvestRepository()

    query = harvest_repo.build_harvest_geometry_query(
        cd_nom_list, 
        cd_hab, 
        date_start, 
        date_end, 
        observers, 
        municipalites, 
        departements, 
        id_harvest_type, 
        code_material,
    )

    results = query.all()

    if not results:
        return {
            'items': []
        }, 200

    # Appel du post-traitement pour regrouper les géométries identiques
    grouped_results = group_geometries(results)

    features = [
        Feature(
            id=None,  # ID non nécessaire puisque ce sont des groupes
            geometry=json.loads(result["geom"]) if result["geom"] else None,
            properties={
                "harvest_ids": result["harvest_ids"]  # Liste des IDs des récoltes ayant cette géométrie
            }
        )
        for result in grouped_results
    ]

    return {
        'items': FeatureCollection(features)
    }, 200


@blueprint.route("/harvests/<int:harvest_id>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_harvest_by_id(harvest_id):

    harvest = db.session.query(THarvest).get(harvest_id)
    
    if not harvest:
        return {"error": "Harvest not found"}, 404

    observers = [
        {
            "id_observer": observer.id_role,
        }
        for observer in harvest.observers
    ]

    cd_bah_obj = None
    if harvest.cd_hab:
        cd_bah_obj = db.session.query(Habref).filter(Habref.cd_hab == harvest.cd_hab).first()
        if cd_bah_obj:
            cd_bah_obj = {
                "cd_hab": cd_bah_obj.cd_hab,
                "lb_hab_fr": cd_bah_obj.lb_hab_fr,
                "lb_code": cd_bah_obj.lb_code,
            }
    
    geographical_location = db.session.query(TNomenclatures).filter(TNomenclatures.id_nomenclature == harvest.id_geographical_precision).first()
    geographical_location = {
        "id_nomenclature": geographical_location.id_nomenclature,
        "label_fr": geographical_location.label_fr
    }
    
    materials_exist = db.session.query(TMaterial).filter(TMaterial.id_harvest == harvest.id_harvest).count() > 0
    geom_geojson = None
    if harvest.geom:
        geom_wgs84 = db.session.query(func.ST_AsGeoJSON(func.ST_Transform(THarvest.geom, 4326))).filter(THarvest.id_harvest == harvest.id_harvest).first()
        if geom_wgs84:
            geom_geojson = json.loads(geom_wgs84[0]) 
    
    additional_data = harvest.additional_data if harvest.additional_data else {}

    harvest_data = {
        "id_harvest": harvest.id_harvest,
        "id_harvest_type": harvest.id_harvest_type,
        "id_dataset": harvest.id_dataset,
        "date_start": harvest.date_start,
        "date_end": harvest.date_end,
        "id_area_type": harvest.id_area_type,
        "id_area": harvest.id_area,
        "cd_hab": cd_bah_obj,
        "geom": geom_geojson,
        "slope": harvest.slope,
        "precision": harvest.precision,
        "id_geographical_precision": geographical_location,
        "id_exposition": harvest.id_exposition,
        "observers": observers, 
        "harvest_materials": materials_exist,
        "additional_data": additional_data
    }

    return harvest_data, 200


@blueprint.route("/harvests/infos/<int:harvest_id>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
def get_harvest_details(harvest_id):
    try:
        harvest = (
            db.session.query(THarvest)
            .options(
                joinedload(THarvest.materials),
                joinedload(THarvest.observers),
            )
            .filter(THarvest.id_harvest == harvest_id)
            .first()
        )

        if not harvest:
            return jsonify({"error": "Récolte non trouvée"}), 404

        # Récupération du type de récolte
        harvest_type = (
            db.session.query(TNomenclatures.label_default)
            .filter(TNomenclatures.id_nomenclature == harvest.id_harvest_type)
            .scalar()
        )

        commune_id = db.session.execute(text("SELECT ref_geo.get_id_area_type('COM')")).scalar()
        departement_id = db.session.execute(text("SELECT ref_geo.get_id_area_type('DEP')")).scalar()

        location_name = "Localisation inconnue"
        id_area_type = None

        # Vérification si on a une localisation
        if harvest.id_area:
            area = db.session.query(LAreas.area_name, LAreas.id_type).filter(LAreas.id_area == harvest.id_area).first()

            if area:
                if area.id_type == commune_id:
                    location_name = area.area_name
                    id_area_type = "Commune"
                elif area.id_type == departement_id:
                    location_name = area.area_name
                    id_area_type = "Département"

        # Vérification si une géométrie existe (et qu'on n'a pas déjà une commune ou département)
        if not harvest.id_area and harvest.geom:
            location_name = "Précise"
            id_area_type = "Localisation"

        if not harvest.geom:
            location_name = "Inconnue"
            id_area_type = "Localisation"

        # Récupération de l'observateur principal
        main_observer = (
            db.session.query(User.nom_role, User.prenom_role)
            .join(CorHarvestObserver, User.id_role == CorHarvestObserver.id_observer)
            .filter(CorHarvestObserver.id_harvest == harvest.id_harvest)
            .filter(CorHarvestObserver.is_main_observer == True)
            .first()
        )

        observer_name = (
            f"{main_observer.nom_role} {main_observer.prenom_role}"
            if main_observer
            else "N/A"
        )

        return jsonify(
            {
                "harvest_type": harvest_type,
                "location_name": location_name,
                "id_area_type": id_area_type,
                "date_start": harvest.date_start.isoformat(),
                "observateur": observer_name,
            }
        )

    except SQLAlchemyError as e:
        return jsonify({"error": str(e)}), 500


@blueprint.route("/harvests/<int:id_harvest>/materials", methods=["POST"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def create_material(id_harvest):
    """Ajout d'un matériel végétal à une récolte"""
    data = request.get_json()
    data['id_harvest'] = id_harvest
    data["meta_create_by"] = g.current_user.id_role
    taxons = data.pop('taxons', [])
    material_repo = HarvestMaterialRepository()
    
    created, result = material_repo.create(data)

    if not created:
        return {"error": result}, 400

    material = result

    if taxons:
        for cd_nom in taxons:
            existing_entry = CorMaterialTaxon.query.filter_by(
                id_material=material.id_material,
                cd_nom=cd_nom
            ).first()
            if not existing_entry:
                new_link = CorMaterialTaxon(
                    id_material=material.id_material,
                    cd_nom=cd_nom
                )
                db.session.add(new_link)
        db.session.commit()

    return {
        "message": "Matériel ajouté",
        "material": material.to_dic()
    }, 201


@blueprint.route("/harvests/<int:id_harvest>/materials/<int:id_material>", methods=["PUT"]) 
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def update_material(id_harvest, id_material):
    """Mise à jour d'un matériel végétal d'une récolte"""
    data = request.get_json()
    data["meta_update_by"] = g.current_user.id_role

    material_repo = HarvestMaterialRepository()
    result = material_repo.update(id_material, data)

    if result is None:
        return {"error": "Ce matériel n'existe pas"}, 404
    if result is False:
        return {"error": "Ce code matériel existe déjà."}, 400

    material = result

    taxons = data.pop('taxons', [])
    if taxons:
        CorMaterialTaxon.query.filter_by(id_material=id_material).delete()
        for cd_nom in taxons:
            new_link = CorMaterialTaxon(id_material=material.id_material, cd_nom=cd_nom)
            db.session.add(new_link)

    db.session.commit()

    return {"message": "Matériel modifié", "material": material.to_dic()}, 200




@blueprint.route("/materials/<int:id_material>", methods=["DELETE"])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_material(id_material):
    """Suppression d'un matériel végétal d'une récolte"""
    material_repo = HarvestMaterialRepository()
    deleted = material_repo.delete(id_material)
    
    if not deleted:
        return {"error": "Matériel non trouvé."}, 404

    return {"message": "Matériel supprimé"}, 200


@blueprint.route("/harvests/<int:id_harvest>/materials/code-autocomplete", methods=["GET"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
def get_materials_by_harvest(id_harvest):
    materials = db.session.query(TMaterial).filter_by(id_harvest=id_harvest).all()
    return jsonify([
        {"id_material": m.id_material, "code_material": m.code_material}
        for m in materials
    ])



@blueprint.route("/harvests/<int:id_harvest>/materials", methods=["GET"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def get_materials(id_harvest):
    try:
        limit = request.args.get('limit', default=10, type=int) 
        page = request.args.get('page', default=1, type=int)
        offset = (page - 1) * limit

        materials = TMaterial.query.filter_by(id_harvest=id_harvest)\
                                          .order_by(TMaterial.code_material.desc())\
                                          .limit(limit)\
                                          .offset(offset)\
                                          .all()
        
        materials_list = []
        for material in materials:
            taxons = CorMaterialTaxon.query.filter_by(id_material=material.id_material).all()
            taxon_list = []

            for taxon in taxons:
                # Récupérer l'objet correspondant au cd_nom dans la table Taxref
                taxon_data = db.session.query(Taxref).filter_by(cd_nom=taxon.cd_nom).first()
                
                if taxon_data:
                    taxon_list.append({
                        "cd_nom": taxon.cd_nom,
                        "search_name": taxon_data.lb_nom
                    })

            nomenclature_material = db.session.query(
                TNomenclatures.label_default,
                TNomenclatures.cd_nomenclature
            ).filter_by(id_nomenclature=material.id_material_type).first()
            harvest_material_label = nomenclature_material.label_default if nomenclature_material else None
            harvest_material_code = nomenclature_material.cd_nomenclature if nomenclature_material else None

            code_parent_material = None
            code_cultural_bank_material = None

            if material.id_material_parent:
                parent_material = TMaterial.query.get(material.id_material_parent)
                code_parent_material = parent_material.code_material if parent_material else None

            if material.code_cultural_bank:
                cultural_bank_material = TMaterial.query.get(material.code_cultural_bank)
                code_cultural_bank_material = cultural_bank_material.code_material if cultural_bank_material else None

            material_dict = material.to_dic()
            material_dict["taxons"] = taxon_list
            material_dict["harvest_material_label"] = harvest_material_label
            material_dict["harvest_material_code"] = harvest_material_code
            material_dict["code_parent"] = code_parent_material
            material_dict["code_cultural_bank"] = code_cultural_bank_material

            material_dict["has_seed_description"] = material.seeds is not None

            materials_list.append(material_dict)

        return {
            'materials': materials_list,
            'total': TMaterial.query.filter_by(id_harvest=id_harvest).count(),
            'limit': limit,
            'offset': offset
        }, 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    


@blueprint.route("/check-code-material", methods=["GET"])
def check_code_material():
    code_material = request.args.get('code_material')

    if not code_material:
        return jsonify({"error": "Code material is required"}), 400
    
    # Utilisation de EXISTS pour vérifier l'existence sans retourner de données
    query = db.session.query(exists().where(TMaterial.code_material == code_material)).scalar()
    #material = TMaterial.query.filter_by(code_material=code_material).first()

    if query:
        return jsonify({"exists": True}), 200
    else:
        return jsonify({"exists": False}), 200

@blueprint.route("/materials/<int:id_material>/add-taxon", methods=["POST"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
def add_taxon_to_material(id_material):
    try:
        data = request.get_json()
        cd_nom = data.get("cd_nom")

        if not cd_nom:
            return jsonify({"error": "Le taxon est requis"}), 400

        # Vérifier si la liaison existe déjà
        existing_entry = CorMaterialTaxon.query.filter_by(id_material=id_material, cd_nom=cd_nom).first()
        if existing_entry:
            return jsonify({"message": "Cette liaison existe déjà"}), 409

        new_link = CorMaterialTaxon(id_material=id_material, cd_nom=cd_nom)
        db.session.add(new_link)
        db.session.commit()

        return jsonify({"message": "Taxon ajouté avec succès au matériel"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@blueprint.route("/materials/<int:id_material>/taxons/<int:cd_nom>", methods=["DELETE"])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
def delete_material_taxon(id_material, cd_nom):
    try:
        assoc = CorMaterialTaxon.query.filter_by(id_material=id_material, cd_nom=cd_nom).first()

        if not assoc:
            return jsonify({"message": "Association non trouvée"}), 404

        db.session.delete(assoc)
        db.session.commit()

        return jsonify({"message": "Taxon supprimé avec succès"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



@blueprint.route("/search_code_material", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
def search_code_material():
    search_term = request.args.get('q', '', type=str)
    
    if not search_term:
        return jsonify([])
    
    results = db.session.query(TMaterial.code_material).filter(
        TMaterial.code_material.ilike(f"%{search_term}%")
    ).limit(10).all()

    code_list = [result[0] for result in results]

    return jsonify(code_list) 

@blueprint.route("/codes_nomenclature", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
def get_code_nomenclature_by_id():
    id_nomenclature = request.args.get('id_nomenclature', type=int)
    if not id_nomenclature:
        return jsonify({"error": "id_nomenclature parameter is required"}), 400

    result = db.session.query(TNomenclatures.cd_nomenclature).filter(
        TNomenclatures.id_nomenclature == id_nomenclature
    ).first()
    
    return jsonify({"code_nomenclature": result[0]})

@blueprint.route("/harvest/export", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
def export_harvests():

    cd_nom_list = request.args.getlist('cd_nom', type=int)
    cd_hab = request.args.get('cd_hab', type=int)
    date_start = request.args.get('date_start', type=str)
    date_end = request.args.get('date_end', type=str)
    observers = request.args.getlist('observers')
    municipalites = request.args.getlist('municipalites')
    departements = request.args.getlist('departements')
    id_harvest_type = request.args.get('id_harvest_type', type=int)
    code_material = request.args.get('code_material', type=str)

    harvest_repo = HarvestRepository()
    base_query = harvest_repo.build_harvest_query(
        cd_nom_list,
        cd_hab,
        date_start,
        date_end,
        observers,
        municipalites,
        departements,
        id_harvest_type,
        code_material
    )
    harvest_ids = [row.id_harvest for row in base_query.all()]
    if not harvest_ids:
        return Response("Aucune donnée à exporter selon les filtres.", status=204)

    # Préparer les alias
    HarvestType = aliased(TNomenclatures)
    HarvestMaterial = aliased(TNomenclatures)
    Exposition = aliased(TNomenclatures)
    FootCountingClass = aliased(TNomenclatures)
    MaterialQuality = aliased(TNomenclatures)
    Phenology1 = aliased(TNomenclatures)
    Phenology2 = aliased(TNomenclatures)
    MethodSample = aliased(TNomenclatures)
    Taxref_valid = aliased(Taxref)

    main_observer_subquery = (
        db.session.query(
            CorHarvestObserver.id_harvest,
            User.nom_role,
            User.prenom_role,
            Organisme.nom_organisme
        )
        .join(User, CorHarvestObserver.id_observer == User.id_role)
        .outerjoin(Organisme, User.id_organisme == Organisme.id_organisme)
        .filter(CorHarvestObserver.is_main_observer == True)
        .subquery()
    )

    commune_id = db.session.execute(text("SELECT ref_geo.get_id_area_type('COM')")).scalar()
    departement_id = db.session.execute(text("SELECT ref_geo.get_id_area_type('DEP')")).scalar()

    harvests = (
        db.session.query(
            THarvest.id_harvest,
            THarvest.date_start,
            THarvest.date_end,
            THarvest.precision,
            THarvest.surface,
            THarvest.altitude,
            THarvest.slope,
            THarvest.remarks,
            THarvest.cd_hab,
            HarvestType.label_default.label("harvest_type"),
            Exposition.label_default.label("exposition"),
            func.string_agg(func.distinct(User.nom_role + ' ' + User.prenom_role), ', ').label("observers_list"),
            main_observer_subquery.c.nom_organisme.label("organisme"),
            TMaterial.code_material.label("code_material"),
            FootCountingClass.label_default.label("classe_individus"),
            HarvestMaterial.label_default.label("harvest_material"),
            Phenology1.label_default.label("phenologie_1"),
            Phenology2.label_default.label("phenologie_2"),
            MethodSample.label_default.label("mode_echantillonnage"),
            MaterialQuality.label_default.label("material_quality"),
            func.ST_Y(func.ST_Transform(func.ST_Centroid(THarvest.geom), 4326)).label("latitude"),
            func.ST_X(func.ST_Transform(func.ST_Centroid(THarvest.geom), 4326)).label("longitude"),
            case([(THarvest.id_area_type == commune_id, LAreas.area_name)], else_=None).label("commune"),
            case([(THarvest.id_area_type == departement_id, LAreas.area_name)], else_=None).label("departement"),
            TMaterial.sample_foot_count.label("nombre_pieds_echantillonnes"),
            case([
                (TMaterial.is_soil_sampling == True, 'Oui'),
                (TMaterial.is_soil_sampling == False, 'Non')
            ], else_='Non').label("prelevement_terre"),
            case([
                (TMaterial.has_hybridation_risk == True, 'Oui'),
                (TMaterial.has_hybridation_risk == False, 'Non')
            ], else_='Non').label("risque_hybridation"),
            TMaterial.remarks.label("protocoles_astuces"),
            func.string_agg(func.distinct(cast(CorMaterialTaxon.cd_nom, String)), ', ').label("cd_noms"),
            func.string_agg(func.distinct(Taxref_valid.lb_nom), ', ').label("noms_valides"),
        )
        .outerjoin(HarvestType, THarvest.id_harvest_type == HarvestType.id_nomenclature)
        .outerjoin(Exposition, THarvest.id_exposition == Exposition.id_nomenclature)
        .outerjoin(CorHarvestObserver, CorHarvestObserver.id_harvest == THarvest.id_harvest)
        .outerjoin(User, CorHarvestObserver.id_observer == User.id_role)
        .outerjoin(main_observer_subquery, main_observer_subquery.c.id_harvest == THarvest.id_harvest)
        .outerjoin(TMaterial, THarvest.id_harvest == TMaterial.id_harvest)
        .outerjoin(FootCountingClass, TMaterial.id_foot_counting_class == FootCountingClass.id_nomenclature)
        .outerjoin(HarvestMaterial, TMaterial.id_material_type == HarvestMaterial.id_nomenclature)
        .outerjoin(Phenology1, TMaterial.id_phenology_1 == Phenology1.id_nomenclature)
        .outerjoin(Phenology2, TMaterial.id_phenology_2 == Phenology2.id_nomenclature)
        .outerjoin(MethodSample, TMaterial.id_method_sample == MethodSample.id_nomenclature)
        .outerjoin(MaterialQuality, TMaterial.id_material_quality == MaterialQuality.id_nomenclature)
        .outerjoin(LAreas, THarvest.id_area == LAreas.id_area)
        .outerjoin(CorMaterialTaxon, CorMaterialTaxon.id_material == TMaterial.id_material)
        .outerjoin(Taxref, CorMaterialTaxon.cd_nom == Taxref.cd_nom)
        .outerjoin(Taxref_valid, Taxref.cd_ref == Taxref_valid.cd_nom)
        .filter(THarvest.id_harvest.in_(harvest_ids))  # <-- le filtrage principal ici
        .group_by(
            THarvest.id_harvest,
            THarvest.date_start,
            THarvest.date_end,
            THarvest.precision,
            THarvest.surface,
            THarvest.altitude,
            THarvest.slope,
            THarvest.remarks,
            THarvest.cd_hab,
            HarvestType.label_default,
            Exposition.label_default,
            main_observer_subquery.c.nom_organisme,
            TMaterial.code_material,
            FootCountingClass.label_default,
            HarvestMaterial.label_default,
            Phenology1.label_default,
            Phenology2.label_default,
            MethodSample.label_default,
            MaterialQuality.label_default,
            LAreas.area_name,
            THarvest.id_area_type,
            TMaterial.sample_foot_count,
            TMaterial.is_soil_sampling,
            TMaterial.has_hybridation_risk,
            TMaterial.remarks
        )
        .all()
    )

    # Création CSV
    si = StringIO()
    fieldnames = [
        "Numéro de Récolte", "Nom taxref (nom valide)", "ID taxref (cd_nom)", "Id hab", 
        "Type Récolte", "Matériel végétal", "Date Début", "Date Fin", "Liste des Observateurs",
        "Organisme", "Commune", "Département", "Coordonnées", "Résolution", "Surface", "Altitude", 
        "Exposition", "Pente", "Remarques/Météo", "Classe d'individus", "Phénologie 1", "Phénologie 2", 
        "Mode d'échantillonnage", "État du lot", "Nombre de pieds échantillonnés", 
        "Prélèvement de terre", "Risque d'hybridation", "Protocoles et astuces"
    ]
    csv_writer = csv.DictWriter(si, fieldnames=fieldnames)
    csv_writer.writeheader()

    for h in harvests:
        csv_writer.writerow({
            "Numéro de Récolte": h.code_material,
            "Nom taxref (nom valide)": h.noms_valides,
            "ID taxref (cd_nom)": h.cd_noms,
            "Id hab": h.cd_hab,
            "Type Récolte": h.harvest_type,
            "Matériel végétal": h.harvest_material,
            "Date Début": h.date_start,
            "Date Fin": h.date_end,
            "Liste des Observateurs": h.observers_list,
            "Organisme": h.organisme,
            "Commune": h.commune,
            "Département": h.departement,
            "Coordonnées": f"{h.latitude:.6f}, {h.longitude:.6f}" if h.latitude and h.longitude else "",
            "Résolution": h.precision,
            "Surface": h.surface,
            "Altitude": h.altitude,
            "Exposition": h.exposition,
            "Pente": h.slope,
            "Remarques/Météo": h.remarks,
            "Classe d'individus": h.classe_individus,
            "Phénologie 1": h.phenologie_1,
            "Phénologie 2": h.phenologie_2,
            "Mode d'échantillonnage": h.mode_echantillonnage,
            "État du lot": h.material_quality,
            "Nombre de pieds échantillonnés": h.nombre_pieds_echantillonnes,
            "Prélèvement de terre": h.prelevement_terre or "Non",
            "Risque d'hybridation": h.risque_hybridation or "Non",
            "Protocoles et astuces": h.protocoles_astuces
        })

    output = Response(si.getvalue(), content_type="text/csv")
    output.headers["Content-Disposition"] = "attachment; filename=harvest.csv"
    return output

@blueprint.route('/materials/<int:id_material>/seeds', methods=['POST'])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def add_seed_to_material(id_material):
    """Ajout d'une description à une graine(taxon)"""
    data = request.get_json()
    material = TMaterial.query.get(id_material)
    if not material:
        return jsonify({'error': 'Matériel non trouvé'}), 404
    data["meta_create_by"] = g.current_user.id_role
    seed_repo = TMaterielSeedRepository()
    seed = seed_repo.create(data)
    return {"message": "Seed created successfully", "id_seed": seed.id_seed}, 201


@blueprint.route('/materials/<int:id_material>/seeds', methods=['GET'])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_seed_of_material(id_material):
    seed = TMaterielSeed.query.filter_by(id_material=id_material).first()
    if seed:
        return {"seed": seed.to_dic()}, 200
    else:
        return {}, 204 


@blueprint.route('/materials/seeds/<int:id_seed>', methods=['DELETE'])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_seed(id_seed):
    """Suppression d'une description de semence"""
    seed = TMaterielSeed.query.get(id_seed)
    if not seed:
        return {"error": "Semence non trouvée"}, 404

    try:
        db.session.delete(seed)
        db.session.commit()
        return {"message": "Semence supprimée avec succès"}, 200
    except SQLAlchemyError as e:
        db.session.rollback()
        return {"error": "Erreur lors de la suppression de la semence"}, 500


@blueprint.route('/materials/seeds/<int:id_seed>', methods=['PUT'])
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
@json_resp
def update_seed(id_seed):
    """Mise à jour d'une description de semence"""
    data = request.get_json()
    data["meta_update_by"] = g.current_user.id_role

    seed_repo = TMaterielSeedRepository()
    updated = seed_repo.update(id_seed, data)

    if not updated:
        return {"error": "Description non trouvée"}, 404

    return {"message": "Seed updated successfully"}, 200


@blueprint.route('/materials/<int:id_material>/actions', methods=['POST'])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def add_action(id_material):
    """Ajout d'une action"""
    data = request.get_json()
    
    material = TMaterial.query.get(id_material)
    if not material:
        return jsonify({'error': 'Matériel non trouvé'}), 404

    data["id_material"] = id_material
    data["meta_create_by"] = g.current_user.id_role

    action_repo = StorageRepository()
    try:
        action = action_repo.create(data)
        return {"message": "Action ajoutée avec succès", "id_storage": action.id_storage}, 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Erreur serveur"}), 500


@blueprint.route('/materials/<int:id_material>/action_context', methods=['GET'])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_action_context(id_material):
    """Retourne le contexte d'action d'un matériel (stockage initial, quantités restantes...)"""
    material = TMaterial.query.get(id_material)
    if not material:
        return jsonify({"error": "Matériel non trouvé"}), 404
    
    place_code = request.args.get("place_code")
    print(place_code)
    if not place_code:
        return jsonify({"error": "Le code du lieu (place_code) est requis."}), 400

    repo = StorageRepository()
    quantities_by_place = repo.get_current_quantities(id_material)
    has_initial_stockage = repo.has_initial_stockage(id_material, place_code)
    place_mapping = repo.get_place_code_mapping()

    return {
        "has_initial_stockage": has_initial_stockage,
        "quantities": quantities_by_place,
        "place_mapping": place_mapping
    }


@blueprint.route('/materials/<int:id_material>/actions/<int:id_storage>', methods=['PUT'])
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
def update_action(id_material, id_storage):
    """Modification d'une action"""
    data = request.get_json()

    material = TMaterial.query.get(id_material)
    if not material:
        return jsonify({'error': 'Matériel non trouvé'}), 404

    action = TStorage.query.get(id_storage)
    if not action or action.id_material != id_material:
        return jsonify({'error': 'Action non trouvée ou appartient à un autre matériel'}), 404

    try:
        action_repo = StorageRepository()
        updated_action = action_repo.update(id_storage, data)

        return {"message": "Action mise à jour avec succès", "id_storage": updated_action.id_storage}, 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Erreur serveur"}), 500


@blueprint.route('/materials/<int:id_material>/actions', methods=['GET'])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
def get_actions_by_place(id_material):
    code_place = request.args.get('placeCode')
    limit = request.args.get('limit', default=10, type=int) 
    page = request.args.get('page', default=1, type=int)


    if not code_place:
        return jsonify({"error": "Paramètre 'placeCode' requis"}), 400

    repo = StorageRepository()
    try:
        actions, total = repo.get_actions_by_place(id_material, code_place, page, limit)
        
        results = []
        for storage, action_type_label, humidity_level_label, humidity_device_label in actions:
            item = storage.to_dic()
            item["action_type_label"] = action_type_label
            item["humidity_level_label"] = humidity_level_label
            item["humidity_device_label"] = humidity_device_label
            results.append(item)
        
        return {
            "items": results,
            "total": total,
            "page": page,
            "limit": limit
        }, 200
    except ValueError as ve:
        print(str(ve))
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print(str(e))
        return jsonify({"error": "Erreur serveur"}), 500


@blueprint.route('/materials/<int:id_material>/stock-summary', methods=['GET'])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_stock_summary(id_material):
    """Retourne la quantité initiale et la quantité courante globale d'un matériel"""
    action_repo = StorageRepository()

    try:
        result = action_repo.get_stock_summary(id_material)
        return result, 200
    except Exception as e:
        return {"error": "Erreur lors du calcul du stock"}, 500
