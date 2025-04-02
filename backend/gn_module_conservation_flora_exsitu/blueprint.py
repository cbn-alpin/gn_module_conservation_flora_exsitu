import logging

from flask import Blueprint, request, g, Response
from geonature.core.gn_permissions import decorators as permissions
from utils_flask_sqla.response import json_resp
from .repositories import HarvestRepository, HarvestMaterialRepository
from .models import TMaterial, THarvest, CorMaterialTaxon, CorHarvestObserver
from gn_module_conservation_flora_exsitu import MODULE_CODE
from ref_geo.models import LAreas, BibAreasTypes
from geonature.utils.env import db
from sqlalchemy.sql.expression import func, select
from sqlalchemy.orm import aliased
from apptax.taxonomie.models import Taxref
from pypnusershub.db.models import User, Organisme
from geojson import Feature, FeatureCollection
from sqlalchemy import and_, exists, Text
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
    
    geographical_location = db.session.query(TNomenclatures).filter(TNomenclatures.id_nomenclature == harvest.id_geographical_location).first()
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
        "location_type": harvest.location_type,
        "location_code": harvest.location_code,
        "cd_hab": cd_bah_obj,
        "geom": geom_geojson,
        "slope": harvest.slope,
        "precision": harvest.precision,
        "id_geographical_location": geographical_location,
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
        location_type = None

        # Vérification si on a une localisation
        if harvest.location_code:
            area = db.session.query(LAreas.area_name, LAreas.id_type).filter(LAreas.id_area == harvest.location_code).first()

            if area:
                if area.id_type == commune_id:
                    location_name = area.area_name
                    location_type = "Commune"
                elif area.id_type == departement_id:
                    location_name = area.area_name
                    location_type = "Département"

        # Vérification si une géométrie existe (et qu'on n'a pas déjà une commune ou département)
        if not harvest.location_code and harvest.geom:
            location_name = "Précise"
            location_type = "Localisation"

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
                "location_type": location_type,
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
    taxons = data.pop('taxons', [])
    material_repo = HarvestMaterialRepository()
    material = material_repo.create(data)
    if taxons:
        for cd_nom in taxons:
            existing_entry = CorMaterialTaxon.query.filter_by(id_material=material.id_material, cd_nom=cd_nom).first()
            if not existing_entry:
                new_link = CorMaterialTaxon(id_material=material.id_material, cd_nom=cd_nom)
                db.session.add(new_link)
        db.session.commit()

    return {"message": "Harvest material created successfully", "material": material.to_dic()}, 201

@blueprint.route("/harvests/<int:id_harvest>/materials/<int:id_material>", methods=["PUT"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def update_material(id_harvest, id_material):
    """Mise à jour d'un matériel végétal d'une récolte"""
    data = request.get_json()

    material_repo = HarvestMaterialRepository()
    material = material_repo.update(id_material, data)

    if material is None:
        return {"error": "Material not found"}, 404

    taxons = data.pop('taxons', [])
    if taxons:
        CorMaterialTaxon.query.filter_by(id_material=id_material).delete()
        for cd_nom in taxons:
            new_link = CorMaterialTaxon(id_material=material.id_material, cd_nom=cd_nom)
            db.session.add(new_link)

    db.session.commit()

    return {"message": "Harvest material updated successfully", "material": material.to_dic()}, 200



@blueprint.route("/materials/<int:id_material>", methods=["DELETE"])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_material(id_material):
    """Suppression d'un matériel végétal d'une récolte"""
    material_repo = HarvestMaterialRepository()
    material_repo.delete(id_material)
    return {"message": "Harvest material deleted successfully"}, 200

@blueprint.route("/harvests/<int:id_harvest>/materials", methods=["GET"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def get_materials(id_harvest):
    try:
        limit = request.args.get('limit', default=10, type=int) 
        page = request.args.get('page', default=1, type=int)
        offset = (page - 1) * limit

        materials = TMaterial.query.filter_by(id_harvest=id_harvest)\
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

            # Récupérer le label_default de l'id_harvest_material depuis TNomenclatures
            nomenclature_label = db.session.query(TNomenclatures.label_default)\
                                           .filter_by(id_nomenclature=material.id_harvest_material)\
                                           .scalar()
            
            code_parent_material = None
            code_cultural_bank_material = None

            if material.id_parent:
                parent_material = TMaterial.query.get(material.id_parent)
                code_parent_material = parent_material.code_material if parent_material else None

            if material.code_cultural_bank:
                cultural_bank_material = TMaterial.query.get(material.code_cultural_bank)
                code_cultural_bank_material = cultural_bank_material.code_material if cultural_bank_material else None

            material_dict = material.to_dic()
            material_dict["taxons"] = taxon_list
            material_dict["harvest_material_label"] = nomenclature_label
            material_dict["code_parent"] = code_parent_material
            material_dict["code_cultural_bank"] = code_cultural_bank_material

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


