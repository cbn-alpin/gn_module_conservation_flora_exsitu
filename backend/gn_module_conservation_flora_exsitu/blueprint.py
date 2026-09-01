import logging

from flask import Blueprint, request, g, Response
from geonature.core.gn_permissions import decorators as permissions
from .repositories import (
    SowingRepository,
    TestRepository,
    ActionRepository,
    CultureRepository,
    CultureActionTransplantationRepository,
    CultureActionObservationRepository,
    CultureActionTreatmentRepository,
    CultureActionSamplingRepository
)
from .models import (
    TSowing,
    TTest,
    TAction,
    TActionReplicate,
    TCulture
)
from utils_flask_sqla.response import json_resp
from .repositories import HarvestRepository, HarvestMaterialRepository, TMaterielSeedRepository, StorageRepository
from .models import TMaterial, THarvest, CorMaterialTaxon, CorHarvestObserver, TMaterielSeed, TStorage
from gn_module_conservation_flora_exsitu import MODULE_CODE
from ref_geo.models import LAreas, BibAreasTypes
from geonature.utils.env import db
from sqlalchemy.sql.expression import func, select
from sqlalchemy.orm import aliased
from apptax.taxonomie.models import Taxref, BibAttributs, Taxref, CorTaxonAttribut
from apptax.taxonomie.models import TMedias as TMediasTaxHub
from pypnusershub.db.models import User, Organisme
from geojson import Feature, FeatureCollection
from sqlalchemy import exists
from flask import request, jsonify, current_app, request
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
from geonature.core.gn_commons.models import (
    TMedias,
    BibTablesLocation
)
from werkzeug.utils import secure_filename
from pathlib import Path
from datetime import datetime

from .repositories import TestRepository,ActionReplicateRepository


blueprint = Blueprint("conservation_flora_exsitu", __name__)
log = logging.getLogger(__name__)


SEED_MATERIAL_CODE = "gr"


def get_material_type_code(material):
    if not material:
        return None

    return (
        db.session.query(TNomenclatures.cd_nomenclature)
        .filter(
            TNomenclatures.id_nomenclature == material.id_material_type
        )
        .scalar()
    )


def material_has_taxon(material):
    if not material:
        return False

    return (
        CorMaterialTaxon.query
        .filter_by(id_material=material.id_material)
        .first()
        is not None
    )


def material_can_have_seed_description(material):
    return (
        get_material_type_code(material)
        == SEED_MATERIAL_CODE
        and material_has_taxon(material)
    )


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

@blueprint.route("/constants/location-types", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
def get_location_types():
    try:
        harvest_repo = HarvestRepository()
        commune_id = harvest_repo.commune_id
        departement_id = harvest_repo.departement_id

        return jsonify({
            "COMMUNE_ID": commune_id,
            "DEPARTEMENT_ID": departement_id
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

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
    cd_hab_list = request.args.getlist('cd_hab', type=int)  
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
        cd_hab_list, 
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

    total_pages = (total_results + limit - 1) // limit

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
    cd_hab_list = request.args.getlist('cd_hab', type=int)  
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
        cd_hab_list, 
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

        geographical_precision_code = (
            db.session.query(TNomenclatures.cd_nomenclature)
            .filter(
                TNomenclatures.id_nomenclature
                == harvest.id_geographical_precision
            )
            .scalar()
        )

        area_name = None

        if harvest.id_area:
            area_name = (
                db.session.query(LAreas.area_name)
                .filter(LAreas.id_area == harvest.id_area)
                .scalar()
            )

        precision_value = (
            f"{harvest.precision} m"
            if harvest.precision is not None
            else "Non renseignée"
        )

        location_name = "Non renseignée"
        id_area_type = "Localisation"

        if geographical_precision_code == "com":
            location_name = (
                f"(C) {area_name}"
                if area_name
                else "Non renseignée"
            )

            id_area_type = "Commune"

        elif geographical_precision_code == "dept":
            location_name = (
                f"(D) {area_name}"
                if area_name
                else "Non renseignée"
            )

            id_area_type = "Département"

        elif geographical_precision_code == "nl":
            location_name = "Non localisable"
            id_area_type = "Non localisable"

        elif geographical_precision_code == "ptapp":
            location_name = f"(PA) {precision_value}"
            id_area_type = "Pointage approximatif"

        elif geographical_precision_code == "ptp":
            location_name = f"(PP) {precision_value}"
            id_area_type = "Pointage précis"

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

    material = TMaterial.query.get(id_material)

    if not material:
        return {"error": "Ce matériel n'existe pas"}, 404

    has_seed_description = (
        TMaterielSeed.query
        .filter_by(id_material=id_material)
        .first()
        is not None
    )

    if has_seed_description:
        requested_material_type = data.get("id_material_type")

        if requested_material_type is not None:
            requested_material_type_code = (
                db.session.query(TNomenclatures.cd_nomenclature)
                .filter(
                    TNomenclatures.id_nomenclature
                    == requested_material_type
                )
                .scalar()
            )

            if requested_material_type_code != SEED_MATERIAL_CODE:
                return {
                    "error": "Modification impossible",
                    "message": (
                        "Ce matériel récolté possède une fiche Semence. "
                        "Supprimez d'abord la fiche Semence avant de modifier "
                        "le type de matériel récolté."
                    )
                }, 409

        requested_taxons = data.get("taxons")

        if (
            requested_taxons is not None
            and len(requested_taxons) == 0
        ):
            return {
                "error": "Modification impossible",
                "message": (
                    "Ce matériel récolté possède une fiche Semence. "
                    "Au moins un taxon doit rester associé. "
                    "Supprimez d'abord la fiche Semence avant de retirer "
                    "le dernier taxon."
                )
            }, 409

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
    material = TMaterial.query.get(id_material)

    if not material:
        return {"error": "Matériel non trouvé."}, 404


    has_seed_description = (
        TMaterielSeed.query
        .filter_by(id_material=id_material)
        .first()
        is not None
    )


    storage_count = (
        TStorage.query
        .filter_by(id_material=id_material)
        .count()
    )


    germination_test_count = (
        db.session.query(TTest)
        .join(
            TNomenclatures,
            TTest.id_test_type == TNomenclatures.id_nomenclature
        )
        .filter(
            TTest.id_material == id_material,
            TNomenclatures.cd_nomenclature == "ger"
        )
        .count()
    )


    viability_test_count = (
        db.session.query(TTest)
        .join(
            TNomenclatures,
            TTest.id_test_type == TNomenclatures.id_nomenclature
        )
        .filter(
            TTest.id_material == id_material,
            TNomenclatures.cd_nomenclature == "via"
        )
        .count()
    )


    sowing_count = (
        TSowing.query
        .filter_by(id_material=id_material)
        .count()
    )


    culture_count = (
        TCulture.query
        .filter_by(id_material=id_material)
        .count()
    )


    if (
        has_seed_description
        or storage_count > 0
        or germination_test_count > 0
        or viability_test_count > 0
        or sowing_count > 0
        or culture_count > 0
    ):
        return {
            "error": "Suppression impossible",
            "message": "Ce matériel récolté contient des données liées.",
            "has_seed_description": has_seed_description,
            "storage_count": storage_count,
            "germination_test_count": germination_test_count,
            "viability_test_count": viability_test_count,
            "sowing_count": sowing_count,
            "culture_count": culture_count
        }, 409


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
                        "nom_valide": taxon_data.nom_valide
                    })

            nomenclature_material = db.session.query(
                TNomenclatures.label_default,
                TNomenclatures.cd_nomenclature
            ).filter_by(id_nomenclature=material.id_material_type).first()
            harvest_material_label = nomenclature_material.label_default if nomenclature_material else None
            harvest_material_code = nomenclature_material.cd_nomenclature if nomenclature_material else None

            code_parent_material = None
            # code_cultural_bank_material = None

            if material.id_material_parent:
                parent_material = TMaterial.query.get(material.id_material_parent)
                code_parent_material = parent_material.code_material if parent_material else None

            # if material.code_cultural_bank:
            #     cultural_bank_material = TMaterial.query.get(material.code_cultural_bank)
            #     code_cultural_bank_material = cultural_bank_material.code_material if cultural_bank_material else None

            material_dict = material.to_dic()
            material_dict["taxons"] = taxon_list
            material_dict["harvest_material_label"] = harvest_material_label
            material_dict["harvest_material_code"] = harvest_material_code
            material_dict["code_parent"] = code_parent_material
            # material_dict["code_cultural_bank"] = code_cultural_bank_material

            material_dict["has_seed_description"] = material.has_seed_description
            material_dict["has_storage"] = material.has_storage
            material_dict["storage_count"] = len(material.storages)

            material_dict["germination_test_count"] = (
                db.session.query(TTest)
                .join(
                    TNomenclatures,
                    TTest.id_test_type == TNomenclatures.id_nomenclature
                )
                .filter(
                    TTest.id_material == material.id_material,
                    TNomenclatures.cd_nomenclature == "ger"
                )
                .count()
            )

            material_dict["viability_test_count"] = (
                db.session.query(TTest)
                .join(
                    TNomenclatures,
                    TTest.id_test_type == TNomenclatures.id_nomenclature
                )
                .filter(
                    TTest.id_material == material.id_material,
                    TNomenclatures.cd_nomenclature == "via"
                )
                .count()
            )

            material_dict["sowing_count"] = (
                TSowing.query
                .filter_by(id_material=material.id_material)
                .count()
            )

            material_dict["culture_count"] = (
                TCulture.query
                .filter_by(id_material=material.id_material)
                .count()
            )

            materials_list.append(material_dict)

        return {
            'materials': materials_list,
            'total': TMaterial.query.filter_by(id_harvest=id_harvest).count(),
            'limit': limit,
            'offset': offset
        }, 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@blueprint.route("/materials/<int:id_material>", methods=["GET"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
def get_material_code(id_material):
    material = db.session.get(TMaterial, id_material)
    if material:
        return jsonify({
            "id_material": material.id_material,
            "code_material": material.code_material,
            "harvest_material_code": get_material_type_code(material),
            "has_taxon": material_has_taxon(material),
            "has_seed_description": material.has_seed_description
        })
    else:
        return jsonify({"error": "Material not found"}), 404



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

        has_seed_description = (
            TMaterielSeed.query
            .filter_by(id_material=id_material)
            .first()
            is not None
        )

        if has_seed_description:
            taxon_count = (
                CorMaterialTaxon.query
                .filter_by(id_material=id_material)
                .count()
            )

            if taxon_count <= 1:
                return jsonify({
                    "error": "Suppression impossible",
                    "message": (
                        "Ce matériel récolté possède une fiche Semence. "
                        "Au moins un taxon doit rester associé. "
                        "Supprimez d'abord la fiche Semence avant de supprimer "
                        "le dernier taxon."
                    )
                }), 409

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
        "Mode d'échantillonnage", "Nombre de pieds échantillonnés", 
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
            "Nombre de pieds échantillonnés": h.nombre_pieds_echantillonnes,
            "Prélèvement de terre": h.prelevement_terre or "Non",
            "Risque d'hybridation": h.risque_hybridation or "Non",
            "Protocoles et astuces": h.protocoles_astuces
        })

    output = Response(si.getvalue(), content_type="text/csv")
    output.headers["Content-Disposition"] = "attachment; filename=harvest.csv"
    return output


def get_code_nomenclature_by_id(id_nomenclature):
    nomenclature = TNomenclatures.query.get(id_nomenclature)
    return nomenclature.cd_nomenclature if nomenclature else None

def get_table_location_id(schema_name, table_name):
    table = BibTablesLocation.query.filter_by(
        schema_name=schema_name,
        table_name=table_name
    ).first()
    return table.id_table_location if table else None

@blueprint.route('/seeds/<int:id_seed>/media', methods=['POST'])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def add_multiple_media_to_seed(id_seed):
    seed = TMaterielSeed.query.get(id_seed)
    if not seed:
        return {"error": "Seed not found"}, 404

    if not material_can_have_seed_description(seed.material):
        return {
            "error": "La fiche Semence est réservée aux matériels récoltés de type Graine possédant au moins un taxon associé."
        }, 403

    id_media_type = request.form.get("id_media_type", type=int)
    if not id_media_type:
        return {"error": "id_media_type is required"}, 400
    
    code_nomenclature = get_code_nomenclature_by_id(id_media_type)
    if not code_nomenclature:
        return {"error": "Invalid id_media_type"}, 400
    
    id_table_location = get_table_location_id('pr_conservation_flora_exsitu', 't_material_seed')
    if not id_table_location:
        return {"error": "BibTablesLocation not found"}, 500

    title = request.form.get("title", "")

    files = request.files.getlist("media_file")
    urls = request.form.getlist("media_url")
    print(urls)

    created_media_ids = []

    #Photo
    if code_nomenclature == "2":
        for file in files:
            filename = secure_filename(file.filename)
            target_dir = Path(current_app.config["MEDIA_FOLDER"]) / "attachments"
            target_dir.mkdir(parents=True, exist_ok=True)
            media_path_full = target_dir / filename
            file.save(media_path_full)
            media_path = str(media_path_full.relative_to(current_app.config["MEDIA_FOLDER"] + "/attachments"))

            media = TMedias(
                id_table_location=id_table_location,
                id_nomenclature_media_type=id_media_type,
                uuid_attached_row=seed.unique_id_seed,
                title_fr=title,
                media_path=media_path,
                is_public=True,
                meta_create_date=datetime.utcnow()
            )
            print('photos saved')
            db.session.add(media)
            created_media_ids.append(media)

    # URLs
    if code_nomenclature == "3":
        for media_url in urls:
            media = TMedias(
                id_table_location=id_table_location,
                id_nomenclature_media_type=id_media_type,
                uuid_attached_row=seed.unique_id_seed,
                title_fr=title,
                media_url=media_url,
                is_public=True,
                meta_create_date=datetime.utcnow()
            )
            print('URLs saved')
            db.session.add(media)
            created_media_ids.append(media)

    db.session.commit()
    return {"message": "Médias ajoutés", "ids": [m.id_media for m in created_media_ids]}, 201

@blueprint.route('/seeds/<int:id_seed>/media', methods=['PUT'])
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
@json_resp
def update_media_for_seed(id_seed):
    seed = TMaterielSeed.query.get(id_seed)
    if not seed:
        return {"error": "Seed not found"}, 404

    if not material_can_have_seed_description(seed.material):
        return {
            "error": "La fiche Semence est réservée aux matériels récoltés de type Graine possédant au moins un taxon associé."
        }, 403

    id_media_type = request.form.get("id_media_type", type=int)
    if not id_media_type:
        return {"error": "id_media_type is required"}, 400

    code_nomenclature = get_code_nomenclature_by_id(id_media_type)
    if not code_nomenclature:
        return {"error": "Invalid id_media_type"}, 400

    id_table_location = get_table_location_id('pr_conservation_flora_exsitu', 't_material_seed')
    if not id_table_location:
        return {"error": "BibTablesLocation not found"}, 500

    title = request.form.get("title", "")
    files = request.files.getlist("media_file")
    urls = request.form.getlist("media_url")

    existing_media = TMedias.query.filter_by(
        uuid_attached_row=seed.unique_id_seed
    ).all()

    for media in existing_media:
        if media.media_path:
            try:
                old_path = Path(current_app.config["MEDIA_FOLDER"]) / "attachments" / media.media_path
                if old_path.exists():
                    old_path.unlink()
            except Exception as e:
                current_app.logger.warning(f"Could not delete old media file: {e}")
        db.session.delete(media)
        

    created_media_ids = []

    if code_nomenclature == "2":
        for file in files:
            filename = secure_filename(file.filename)
            target_dir = Path(current_app.config["MEDIA_FOLDER"]) / "attachments"
            target_dir.mkdir(parents=True, exist_ok=True)
            media_path_full = target_dir / filename
            file.save(media_path_full)
            media_path = str(media_path_full.relative_to(current_app.config["MEDIA_FOLDER"] + "/attachments"))

            media = TMedias(
                id_table_location=id_table_location,
                id_nomenclature_media_type=id_media_type,
                uuid_attached_row=seed.unique_id_seed,
                title_fr=title,
                media_path=media_path,
                is_public=True,
                meta_create_date=datetime.utcnow()
            )
            db.session.add(media)
            created_media_ids.append(media)

    elif code_nomenclature == "3":
        for media_url in urls:
            media = TMedias(
                id_table_location=id_table_location,
                id_nomenclature_media_type=id_media_type,
                uuid_attached_row=seed.unique_id_seed,
                title_fr=title,
                media_url=media_url,
                is_public=True,
                meta_create_date=datetime.utcnow()
            )
            db.session.add(media)
            created_media_ids.append(media)

    else:
        return {"error": f"Unsupported media type: {code_nomenclature}"}, 400

    db.session.commit()
    return {"message": "Médias remplacés", "ids": [m.id_media for m in created_media_ids]}, 200

@blueprint.route('/seeds/medias/<int:id_media>', methods=['DELETE'])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_media(id_media):
    """Suppression d'un média"""
    media = TMedias.query.get(id_media)
    if not media:
        return {"error": "Média non trouvé"}, 404

    try:
        # Supprimer le fichier physique si c'est un fichier
        if media.media_path:
            try:
                file_path = Path(current_app.config["MEDIA_FOLDER"]) / "attachments" / media.media_path
                if file_path.exists():
                    file_path.unlink()
            except Exception as e:
                current_app.logger.warning(f"Erreur suppression fichier: {e}")
        
        db.session.delete(media)
        db.session.commit()
        return {"message": "Média supprimé avec succès"}, 200

    except SQLAlchemyError:
        db.session.rollback()
        return {"error": "Erreur lors de la suppression du média"}, 500


@blueprint.route('/materials/<int:id_material>/seeds', methods=['POST'])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def add_seed_to_material(id_material):
    """Ajout d'une description à une graine(taxon)"""
    data = request.get_json()
    material = TMaterial.query.get(id_material)
    if not material:
        return jsonify({'error': 'Matériel non trouvé'}), 404

    if not material_can_have_seed_description(material):
        return {
            "error": "La fiche Semence est réservée aux matériels récoltés de type Graine possédant au moins un taxon associé."
        }, 403

    data["id_material"] = id_material
    data["meta_create_by"] = g.current_user.id_role
    seed_repo = TMaterielSeedRepository()
    seed = seed_repo.create(data)
    return {"message": "Seed created successfully", "id_seed": seed.id_seed}, 201


@blueprint.route('/materials/<int:id_material>/seeds', methods=['GET'])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_seed_of_material(id_material):
    material = TMaterial.query.get(id_material)

    if not material:
        return {"error": "Matériel non trouvé"}, 404

    if not material_can_have_seed_description(material):
        return {
            "error": "La fiche Semence est réservée aux matériels récoltés de type Graine possédant au moins un taxon associé."
        }, 403

    seed = TMaterielSeed.query.filter_by(id_material=id_material).first()
    if not seed:
        return {}, 204

    seed_data = seed.to_dic()

    # Récupérer TOUS les médias associés à cette semence
    medias = TMedias.query.filter_by(
        uuid_attached_row=seed.unique_id_seed
    ).order_by(TMedias.meta_create_date.desc()).all()

    media_list = []
    id_media_type = None

    for media in medias:
        if id_media_type is None and media.id_nomenclature_media_type:
            id_media_type = media.id_nomenclature_media_type

        media_list.append({
            'id_media': media.id_media,
            'media_url': media.media_url,
            'media_path': media.media_path,
        })

    seed_data['id_media_type'] = id_media_type
    seed_data['medias'] = media_list

    return {"seed": seed_data}, 200


@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@blueprint.route('/materials/seeds/<int:id_seed>/infos', methods=['GET'])
def get_full_seed_info(id_seed):
    seed = (
        db.session.query(TMaterielSeed)
        .filter(TMaterielSeed.id_seed == id_seed)
        .first()
    )

    if not seed:
        return jsonify({"error": "Semence non trouvée"}), 404

    if not material_can_have_seed_description(seed.material):
        return jsonify({
            "error": "La fiche Semence est réservée aux matériels récoltés de type Graine possédant au moins un taxon associé."
        }), 403

    seed_dict = seed.to_dic()

    seed_dict['material_quality_label'] = (
        seed.material_quality.label_default if seed.material_quality else None
    )
    seed_dict.pop('id_material_quality', None)
    seed_dict.pop('additional_data', None)

    link = db.session.query(CorMaterialTaxon).filter_by(id_material=seed.id_material).first()
    if link:
        cd_nom = link.cd_nom
        cd_ref = (
            db.session.query(Taxref.cd_ref)
            .filter(Taxref.cd_nom == cd_nom)
            .scalar()
        )
        if cd_ref:
            query = (
                db.session.query(
                    CorTaxonAttribut.valeur_attribut.label("content"),
                    BibAttributs.nom_attribut.label("code"),
                )
                .join(BibAttributs)
                .filter(CorTaxonAttribut.cd_ref == cd_ref)
            )
            attributs = db.session.execute(query).mappings().all()
            seed_dict["taxon_attributs"] = {attr["code"]: attr["content"] for attr in attributs}
        else:
            seed_dict["taxon_attributs"] = {}
    else:
        seed_dict["taxon_attributs"] = {}

    seed_dict['cd_ref'] = cd_ref

    media_entries = (
        db.session.query(TMedias)
        .filter(
            TMedias.uuid_attached_row == str(seed.unique_id_seed)
        )
        .all()
    )
    
    media_files = []
    for media in media_entries:
        if media.media_url:
            media_files.append({
                "type": "url",
                "title": media.title_fr,
                "url": media.media_url,
                "id_media": media.id_media
            })
        elif media.media_path:
            media_files.append({
                "type": "file",
                "title": media.title_fr,
                "url": f"/media/attachments/{media.media_path}",
                "id_media": media.id_media
            })

    seed_dict["media_files"] = media_files

    media_taxhub = (
        db.session.query(TMediasTaxHub)
        .filter(
            TMediasTaxHub.cd_ref == cd_ref
        )
        .all()
    )
    
    media_files_taxhub = []
    for media in media_taxhub:
        if media.url:
            media_files_taxhub.append({
                "type": "url",
                "title": media.titre,
                "url": media.url,
                "id_media": media.id_media
            })
        elif media.chemin:
            media_files_taxhub.append({
                "type": "file",
                "title": media.titre,
                "url": f"/media/taxhub/{media.chemin}",
                "id_media": media.id_media
            })
    seed_dict["media_files_taxhub"] = media_files_taxhub
    
    return jsonify(seed_dict)

    
@blueprint.route('/materials/seeds/<int:id_seed>', methods=['DELETE'])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_seed(id_seed):
    """Suppression d'une description de semence et de ses médias"""
    seed = TMaterielSeed.query.get(id_seed)
    if not seed:
        return {"error": "Semence non trouvée"}, 404

    if not material_can_have_seed_description(seed.material):
        return {
            "error": "La fiche Semence est réservée aux matériels récoltés de type Graine possédant au moins un taxon associé."
        }, 403

    try:
        existing_media = TMedias.query.filter_by(
            uuid_attached_row=seed.unique_id_seed
        ).all()

        for media in existing_media:
            if media.media_path:
                try:
                    old_path = Path(current_app.config["MEDIA_FOLDER"]) / "attachments" / media.media_path
                    if old_path.exists():
                        old_path.unlink()
                except Exception as e:
                    current_app.logger.warning(f"Erreur suppression fichier: {e}")
            db.session.delete(media)

        db.session.delete(seed)
        db.session.commit()

        return {"message": "Semence et médias associés supprimés avec succès"}, 200

    except SQLAlchemyError:
        db.session.rollback()
        return {"error": "Erreur lors de la suppression de la semence ou des médias"}, 500


@blueprint.route('/materials/seeds/<int:id_seed>', methods=['PUT'])
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
@json_resp
def update_seed(id_seed):
    """Mise à jour d'une description de semence"""
    seed = TMaterielSeed.query.get(id_seed)

    if not seed:
        return {"error": "Description non trouvée"}, 404

    if not material_can_have_seed_description(seed.material):
        return {
            "error": "La fiche Semence est réservée aux matériels récoltés de type Graine possédant au moins un taxon associé."
        }, 403

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
        for storage, action_type_label, destination, prenom_actor, nom_actor in actions:
            item = storage.to_dic()
            item["action_type_label"] = action_type_label
            item["destination"] = destination
            item["actor"] = f"{prenom_actor or ''} {nom_actor or ''}".strip()
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


@blueprint.route('/materials/<int:id_material>/actions/<int:id_storage>', methods=['DELETE'])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
def delete_action(id_material, id_storage):
    """Suppression d'une action"""

    material = TMaterial.query.get(id_material)
    if not material:
        return jsonify({'error': 'Matériel non trouvé'}), 404

    action = TStorage.query.get(id_storage)
    if not action or action.id_material != id_material:
        return jsonify({'error': 'Action non trouvée ou appartient à un autre matériel'}), 404

    try:
        action_repo = StorageRepository()
        code_stock_init = action_repo.get_id_nomenclature("CFE_STORAGE_ACTION", "sti")

        # Ne faire la vérif que si c’est un stockage initial
        if action.id_storage_action == code_stock_init:
            id_place = action.id_place

            # Somme des quantités de sortie (déstockage + déplacement)
            codes_outputs = ["dest", "depl"]
            ids_outputs = [action_repo.get_id_nomenclature("CFE_STORAGE_ACTION", c) for c in codes_outputs]

            outputs = (
                db.session.query(db.func.coalesce(db.func.sum(TStorage.quantity), 0))
                .filter(
                    TStorage.id_material == id_material,
                    TStorage.id_place == id_place,
                    TStorage.id_storage_action.in_(ids_outputs)
                )
                .scalar()
            )

            # Somme des autres stockages initiaux (sans celui qu’on supprime)
            storages_init = (
                db.session.query(db.func.coalesce(db.func.sum(TStorage.quantity), 0))
                .filter(
                    TStorage.id_material == id_material,
                    TStorage.id_place == id_place,
                    TStorage.id_storage_action == code_stock_init,
                    TStorage.id_storage != id_storage  # Exclure celui qu’on veut supprimer
                )
                .scalar()
            )

            # Vérification
            if outputs > storages_init:
                return jsonify({
                    "error": "Impossible de supprimer cette action de stockage : des quantités ont déjà été utilisées.",
                    "details": {
                        "quantite_sortie": outputs,
                        "quantite_stockage_restante_si_suppression": storages_init
                    }
                }), 403


        db.session.delete(action)
        db.session.commit()
        return jsonify({'message': 'Action supprimée avec succès'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erreur lors de la suppression'}), 500

from dateutil.parser import isoparse
@blueprint.route("/materials/<int:id_material>/sowings", methods=["POST"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def create_sowing(id_material):
    try:
        data = request.get_json(silent=True) or {}
        data["meta_create_by"] = g.current_user.id_role   # SLIM
        repo = SowingRepository()
        sowing = repo.create(id_material, data)
        return {"message": "Semis créé avec succès", "sowing": sowing.to_dic()}, 201
    except Exception as e:
        current_app.logger.exception("create_sowing failed")
        return {"error": str(e)}, 400
    
@blueprint.route("/sowings", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_sowings():
    repo = SowingRepository()
    sowings = repo.find_all()
    return [s.to_dic() for s in sowings]

@blueprint.route("/sowings/<int:id_sowing>/actions", methods=["POST"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def create_action_by_sowing(id_sowing):
    data = request.get_json()

    data['id_sowing'] = id_sowing
    data["meta_create_by"] = g.current_user.id_role

    repo = ActionRepository()
    success, result = repo.create(data)

    if not success:
        return {"message": "Erreur lors de la création de l'action", "code": 400}

    return {"message": "Action créée", "action": result.to_dic()}

# Récupérer un semis par ID
@blueprint.route("/sowings/<int:id_sowing>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_sowing_by_id(id_sowing):
    repo = SowingRepository()
    sowing = repo.find_by_id(id_sowing)
    if not sowing:
        return {"error": "Semis non trouvé"}, 404
    return sowing.to_dic()

@blueprint.route("/materials/<int:id_material>/sowings", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def list_sowings_by_material(id_material):
    repo = SowingRepository()
    return repo.get_with_labels_by_material(id_material)

@blueprint.route("/materials/<int:id_material>/sowings/<int:id_sowing>", methods=["DELETE"])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_sowing(id_material, id_sowing):
    repo = SowingRepository()
    result = repo.delete(id_sowing)

    if result.get("not_found"):
        return {"error": "Semis non trouvé"}, 404

    if result.get("blocked"):
        action_count = result.get("action_count", 0)

        return {
            "error": "Suppression impossible",
            "message": "Ce semis contient des actions liées.",
            "action_count": action_count
        }, 409

    return {"message": "Semis supprimé avec succès"}, 200

@blueprint.route("/materials/<int:id_material>/sowings/<int:id_sowing>", methods=["PUT"])
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
@json_resp
def update_sowing(id_material, id_sowing):
    repo = SowingRepository()
    data = request.get_json()

    sowing = repo.update(id_sowing, data)

    if not sowing:
        return {"error": "Semis non trouvé"}, 404

    return sowing.to_dic(), 200

@blueprint.route(
    "/materials/<int:id_material>/cultures",
    methods=["POST"]
)
@permissions.check_cruved_scope(
    "C",
    module_code=MODULE_CODE
)
@json_resp
def create_culture(id_material):
    try:
        data = request.get_json(silent=True) or {}

        data["meta_create_by"] = (
            g.current_user.id_role
        )

        repo = CultureRepository()
        culture = repo.create(
            id_material,
            data
        )

        return {
            "message": "Culture créée avec succès",
            "culture": culture.to_dic()
        }, 201

    except ValueError as e:
        return {
            "error": str(e)
        }, 400

    except Exception:
        current_app.logger.exception(
            "create_culture failed"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500


@blueprint.route(
    "/materials/<int:id_material>/cultures",
    methods=["GET"]
)
@permissions.check_cruved_scope(
    "R",
    module_code=MODULE_CODE
)
@json_resp
def list_cultures_by_material(id_material):

    repo = CultureRepository()

    source_type = request.args.get(
        "source_type"
    )

    id_sowing = request.args.get(
        "id_sowing",
        type=int
    )

    id_test = request.args.get(
        "id_test",
        type=int
    )


    # -----------------------------------------
    # Culture ouverte depuis Matériel récolté
    #
    # id_material = courant
    # id_sowing = NULL
    # id_test = NULL
    # -----------------------------------------
    if source_type == "material":

        return repo.get_direct_by_material(
            id_material
        ), 200


    # -----------------------------------------
    # Culture ouverte depuis un Semis
    #
    # id_material = courant
    # id_sowing = Semis courant
    # id_test = NULL
    # -----------------------------------------
    if source_type == "sowing":

        if not id_sowing:

            return {
                "error": (
                    "L'identifiant du semis "
                    "est obligatoire"
                )
            }, 400

        try:

            return repo.get_all_by_sowing(
                id_material,
                id_sowing
            ), 200

        except ValueError as e:

            return {
                "error": str(e)
            }, 400

    # -----------------------------------------
    # Culture ouverte depuis
    # un Test de germination
    #
    # id_material = courant
    # id_sowing = NULL
    # id_test = Test courant
    # -----------------------------------------
    if source_type == "test":

        if not id_test:

            return {
                "error": (
                    "L'identifiant du test "
                    "est obligatoire"
                )
            }, 400

        try:

            return repo.get_all_by_test(
                id_material,
                id_test
            ), 200

        except ValueError as e:

            return {
                "error": str(e)
            }, 400


    # -----------------------------------------
    # Sans contexte :
    # comportement historique conservé
    # -----------------------------------------
    return repo.get_all_by_material(
        id_material
    ), 200


@blueprint.route(
    "/cultures/<int:id_culture>",
    methods=["GET"]
)
@permissions.check_cruved_scope(
    "R",
    module_code=MODULE_CODE
)
@json_resp
def get_culture(id_culture):
    repo = CultureRepository()

    culture = repo.get_with_labels_by_id(
        id_culture
    )

    if not culture:
        return {
            "error": "Culture non trouvée"
        }, 404

    return culture, 200

@blueprint.route(
    "/cultures/<int:id_culture>/actions/transplantation",
    methods=["POST"]
)
@permissions.check_cruved_scope(
    "C",
    module_code=MODULE_CODE
)
@json_resp
def create_culture_transplantation(
    id_culture
):
    try:
        culture = (
            CultureRepository()
            .get_by_id(id_culture)
        )

        if not culture:
            return {
                "error": "Culture non trouvée"
            }, 404

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        action_data = (
            data.get("action")
            or {}
        )

        transplantation_data = (
            data.get("transplantation")
            or {}
        )

        result = (
            CultureActionTransplantationRepository()
            .create_with_action(
                id_culture=id_culture,
                action_data=action_data,
                transplantation_data=(
                    transplantation_data
                ),
                meta_create_by=(
                    g.current_user.id_role
                )
            )
        )

        return {
            "message": (
                "Action de transplantation "
                "créée avec succès"
            ),
            **result
        }, 201

    except ValueError as error:
        return {
            "error": str(error)
        }, 400

    except Exception:
        current_app.logger.exception(
            "create_culture_transplantation failed"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500
@blueprint.route(
    "/actions/<int:id_action>/transplantation",
    methods=["GET"]
)
@permissions.check_cruved_scope(
    "R",
    module_code=MODULE_CODE
)
@json_resp
def get_culture_transplantation(
    id_action
):
    transplantation = (
        CultureActionTransplantationRepository()
        .get_by_action(id_action)
    )

    if not transplantation:
        return {
            "error": (
                "Action de transplantation "
                "non trouvée"
            )
        }, 404

    return transplantation, 200

@blueprint.route(
    "/actions/<int:id_action>/transplantation",
    methods=["PUT"]
)
@permissions.check_cruved_scope(
    "U",
    module_code=MODULE_CODE
)
@json_resp
def update_culture_transplantation(
    id_action
):
    try:
        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        action_data = (
            data.get("action")
            or {}
        )

        transplantation_data = (
            data.get("transplantation")
            or {}
        )

        result = (
            CultureActionTransplantationRepository()
            .update_with_action(
                id_action=id_action,
                action_data=action_data,
                transplantation_data=(
                    transplantation_data
                ),
                meta_update_by=(
                    g.current_user.id_role
                )
            )
        )

        if not result:
            return {
                "error": (
                    "Action de transplantation "
                    "non trouvée"
                )
            }, 404

        return {
            "message": (
                "Action de transplantation "
                "mise à jour avec succès"
            ),
            "transplantation": result
        }, 200

    except ValueError as error:
        return {
            "error": str(error)
        }, 400

    except Exception:
        current_app.logger.exception(
            "update_culture_transplantation failed "
            f"for action {id_action}"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500

@blueprint.route(
    "/cultures/<int:id_culture>/actions/observation",
    methods=["POST"]
)
@permissions.check_cruved_scope(
    "C",
    module_code=MODULE_CODE
)
@json_resp
def create_culture_observation(
    id_culture
):
    try:
        culture = (
            CultureRepository()
            .get_by_id(id_culture)
        )

        if not culture:
            return {
                "error": "Culture non trouvée"
            }, 404

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        action_data = (
            data.get("action")
            or {}
        )

        observation_data = (
            data.get("observation")
            or {}
        )

        result = (
            CultureActionObservationRepository()
            .create_with_action(
                id_culture=id_culture,
                action_data=action_data,
                observation_data=(
                    observation_data
                ),
                meta_create_by=(
                    g.current_user.id_role
                )
            )
        )

        return {
            "message": (
                "Action d'observation "
                "créée avec succès"
            ),
            **result
        }, 201

    except ValueError as error:
        return {
            "error": str(error)
        }, 400

    except Exception:
        current_app.logger.exception(
            "create_culture_observation failed"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500


@blueprint.route(
    "/actions/<int:id_action>/observation",
    methods=["GET"]
)
@permissions.check_cruved_scope(
    "R",
    module_code=MODULE_CODE
)
@json_resp
def get_culture_observation(
    id_action
):
    observation = (
        CultureActionObservationRepository()
        .get_by_action(id_action)
    )

    if not observation:
        return {
            "error": (
                "Action d'observation "
                "non trouvée"
            )
        }, 404

    return observation, 200


@blueprint.route(
    "/actions/<int:id_action>/observation",
    methods=["PUT"]
)
@permissions.check_cruved_scope(
    "U",
    module_code=MODULE_CODE
)
@json_resp
def update_culture_observation(
    id_action
):
    try:
        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        action_data = (
            data.get("action")
            or {}
        )

        observation_data = (
            data.get("observation")
            or {}
        )

        result = (
            CultureActionObservationRepository()
            .update_with_action(
                id_action=id_action,
                action_data=action_data,
                observation_data=(
                    observation_data
                ),
                meta_update_by=(
                    g.current_user.id_role
                )
            )
        )

        if not result:
            return {
                "error": (
                    "Action d'observation "
                    "non trouvée"
                )
            }, 404

        return {
            "message": (
                "Action d'observation "
                "mise à jour avec succès"
            ),
            "observation": result
        }, 200

    except ValueError as error:
        return {
            "error": str(error)
        }, 400

    except Exception:
        current_app.logger.exception(
            "update_culture_observation failed "
            f"for action {id_action}"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500


@blueprint.route(
    "/cultures/<int:id_culture>/actions/treatment",
    methods=["POST"]
)
@permissions.check_cruved_scope(
    "C",
    module_code=MODULE_CODE
)
@json_resp
def create_culture_treatment(
    id_culture
):
    try:
        culture = (
            CultureRepository()
            .get_by_id(id_culture)
        )

        if not culture:
            return {
                "error": "Culture non trouvée"
            }, 404

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        action_data = (
            data.get("action")
            or {}
        )

        treatment_data = (
            data.get("treatment")
            or {}
        )

        result = (
            CultureActionTreatmentRepository()
            .create_with_action(
                id_culture=id_culture,
                action_data=action_data,
                treatment_data=(
                    treatment_data
                ),
                meta_create_by=(
                    g.current_user.id_role
                )
            )
        )

        return {
            "message": (
                "Action de traitement "
                "de culture créée avec succès"
            ),
            **result
        }, 201

    except ValueError as error:
        return {
            "error": str(error)
        }, 400

    except Exception:
        current_app.logger.exception(
            "create_culture_treatment failed"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500


@blueprint.route(
    "/actions/<int:id_action>/treatment",
    methods=["GET"]
)
@permissions.check_cruved_scope(
    "R",
    module_code=MODULE_CODE
)
@json_resp
def get_culture_treatment(
    id_action
):
    treatment = (
        CultureActionTreatmentRepository()
        .get_by_action(id_action)
    )

    if not treatment:
        return {
            "error": (
                "Action de traitement "
                "de culture non trouvée"
            )
        }, 404

    return treatment, 200


@blueprint.route(
    "/actions/<int:id_action>/treatment",
    methods=["PUT"]
)
@permissions.check_cruved_scope(
    "U",
    module_code=MODULE_CODE
)
@json_resp
def update_culture_treatment(
    id_action
):
    try:
        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        action_data = (
            data.get("action")
            or {}
        )

        treatment_data = (
            data.get("treatment")
            or {}
        )

        result = (
            CultureActionTreatmentRepository()
            .update_with_action(
                id_action=id_action,
                action_data=action_data,
                treatment_data=(
                    treatment_data
                ),
                meta_update_by=(
                    g.current_user.id_role
                )
            )
        )

        if not result:
            return {
                "error": (
                    "Action de traitement "
                    "de culture non trouvée"
                )
            }, 404

        return {
            "message": (
                "Action de traitement "
                "de culture mise à jour avec succès"
            ),
            "treatment": result
        }, 200

    except ValueError as error:
        return {
            "error": str(error)
        }, 400

    except Exception:
        current_app.logger.exception(
            "update_culture_treatment failed "
            f"for action {id_action}"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500


@blueprint.route(
    "/cultures/<int:id_culture>/actions/sampling",
    methods=["POST"]
)
@permissions.check_cruved_scope(
    "C",
    module_code=MODULE_CODE
)
@json_resp
def create_culture_sampling(
    id_culture
):
    try:
        culture = (
            CultureRepository()
            .get_by_id(id_culture)
        )

        if not culture:
            return {
                "error": "Culture non trouvée"
            }, 404

        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        action_data = (
            data.get("action")
            or {}
        )

        sampling_data = (
            data.get("sampling")
            or {}
        )

        result = (
            CultureActionSamplingRepository()
            .create_with_action(
                id_culture=id_culture,
                action_data=action_data,
                sampling_data=(
                    sampling_data
                ),
                meta_create_by=(
                    g.current_user.id_role
                )
            )
        )

        return {
            "message": (
                "Action de prélèvement "
                "créée avec succès"
            ),
            **result
        }, 201

    except ValueError as error:
        return {
            "error": str(error)
        }, 400

    except Exception:
        current_app.logger.exception(
            "create_culture_sampling failed"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500


@blueprint.route(
    "/actions/<int:id_action>/sampling",
    methods=["GET"]
)
@permissions.check_cruved_scope(
    "R",
    module_code=MODULE_CODE
)
@json_resp
def get_culture_sampling(
    id_action
):
    sampling = (
        CultureActionSamplingRepository()
        .get_by_action(id_action)
    )

    if not sampling:
        return {
            "error": (
                "Action de prélèvement "
                "non trouvée"
            )
        }, 404

    return sampling, 200


@blueprint.route(
    "/actions/<int:id_action>/sampling",
    methods=["PUT"]
)
@permissions.check_cruved_scope(
    "U",
    module_code=MODULE_CODE
)
@json_resp
def update_culture_sampling(
    id_action
):
    try:
        data = (
            request.get_json(
                silent=True
            )
            or {}
        )

        action_data = (
            data.get("action")
            or {}
        )

        sampling_data = (
            data.get("sampling")
            or {}
        )

        result = (
            CultureActionSamplingRepository()
            .update_with_action(
                id_action=id_action,
                action_data=action_data,
                sampling_data=(
                    sampling_data
                ),
                meta_update_by=(
                    g.current_user.id_role
                )
            )
        )

        if not result:
            return {
                "error": (
                    "Action de prélèvement "
                    "non trouvée"
                )
            }, 404

        return {
            "message": (
                "Action de prélèvement "
                "mise à jour avec succès"
            ),
            "sampling": result
        }, 200

    except ValueError as error:
        return {
            "error": str(error)
        }, 400

    except Exception:
        current_app.logger.exception(
            "update_culture_sampling failed "
            f"for action {id_action}"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500


@blueprint.route(
    "/materials/<int:id_material>/cultures/<int:id_culture>",
    methods=["PUT"]
)
@permissions.check_cruved_scope(
    "U",
    module_code=MODULE_CODE
)
@json_resp
def update_culture(
    id_material,
    id_culture
):
    try:
        data = request.get_json(silent=True) or {}

        data["meta_update_by"] = (
            g.current_user.id_role
        )

        repo = CultureRepository()

        culture = repo.update(
            id_material,
            id_culture,
            data
        )

        if not culture:
            return {
                "error": "Culture non trouvée"
            }, 404

        return {
            "message": "Culture mise à jour avec succès",
            "culture": culture.to_dic()
        }, 200

    except ValueError as e:
        return {
            "error": str(e)
        }, 400

    except Exception:
        current_app.logger.exception(
            "update_culture failed"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500


@blueprint.route(
    "/materials/<int:id_material>/cultures/<int:id_culture>",
    methods=["DELETE"]
)
@permissions.check_cruved_scope(
    "D",
    module_code=MODULE_CODE
)
@json_resp
def delete_culture(
    id_material,
    id_culture
):
    action_count = (
        TAction.query
        .filter_by(
            id_culture=id_culture
        )
        .count()
    )


    if action_count > 0:
        return {
            "error":
                "Suppression impossible",

            "message":
                "Cette culture contient des actions liées.",

            "action_count":
                action_count
        }, 409


    repo = CultureRepository()

    deleted = repo.delete(
        id_material,
        id_culture
    )


    if not deleted:
        return {
            "error": "Culture non trouvée"
        }, 404


    return {
        "message":
            "Culture supprimée avec succès"
    }, 200

@blueprint.route("/nomenclatures/<string:code_type>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
def get_nomenclatures_by_code_type(code_type):
    try:
        id_type = db.session.execute(
            text("SELECT ref_nomenclatures.get_id_nomenclature_type(:code_type)"),
            {"code_type": code_type}
        ).scalar()

        if not id_type:
            return jsonify([])

        rows = (
            db.session.query(
                TNomenclatures.id_nomenclature,
                TNomenclatures.label_default,
                TNomenclatures.cd_nomenclature,
                TNomenclatures.hierarchy
            )
            .filter(TNomenclatures.id_type == id_type)
            .order_by(TNomenclatures.hierarchy.asc(), TNomenclatures.id_nomenclature.asc())
            .all()
        )

        return jsonify([
            {
                "id_nomenclature": row.id_nomenclature,
                "label_default": row.label_default,
                "cd_nomenclature": row.cd_nomenclature,
                "hierarchy": row.hierarchy
            }
            for row in rows
        ])
    except Exception as e:
        current_app.logger.error(f"Erreur chargement nomenclatures {code_type}: {e}")
        return jsonify({"error": "Erreur interne du serveur"}), 500

@blueprint.route("/sowings/<int:id_sowing>/actions", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
def get_actions_by_id_sowing(id_sowing):
    try:
        repo = ActionRepository()
        actions = repo.get_actions_by_id_sowing(id_sowing)
        return jsonify(actions)
    except Exception as e:
        current_app.logger.error(f"Erreur lors du chargement des actions pour le semis {id_sowing}: {e}")
        return jsonify({"error": "Erreur interne du serveur"}), 500

@blueprint.route("/materials/<int:id_material>/tests", methods=["POST"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def create_test(id_material):
    """Ajout d'un test  à un materiel"""
    data = request.get_json()
    data['id_material'] = id_material

    data["meta_create_by"] = g.current_user.id_role
    repo = TestRepository()
    
    success, result = repo.create(data)

    if not success:
        return {"message": "Erreur lors de la création"}, 400

    return {"message": "Test créé", "test": result.to_dic()}


@blueprint.route("/materials/<int:id_material>/tests/code-autocomplete", methods=["GET"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
def get_test_by_material(id_material):
    test = db.session.query(TTest).filter_by(id_material=id_material).all()
    return jsonify([
        {"id_test": m.id_test, "code": m.code}
        for m in test
    ])

@blueprint.route("/materials/<int:id_material>/tests", methods=["GET"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
def get_all_tests_by_material(id_material):
    TestType = aliased(TNomenclatures)

    tests = (
        db.session.query(
            TTest,
            TestType.cd_nomenclature.label(
                "test_type_code"
            )
        )
        .outerjoin(
            TestType,
            TTest.id_test_type ==
            TestType.id_nomenclature
        )
        .filter(
            TTest.id_material == id_material
        )
        .all()
    )

    return jsonify([
        {
            "id_test": t.id_test,
            "code": t.code,
            "seed_initial_count": t.seed_initial_count,
            "meta_create_date": t.meta_create_date.isoformat() if t.meta_create_date else None,
            "meta_update_date": t.meta_update_date.isoformat() if t.meta_update_date else None,
            "replicate_count": t.replicate_count,
            "pre_treatment":t.pre_treatment,
            "germination_rate":t.germination_rate,
            "id_test_type":t.id_test_type,
            "test_type_code": test_type_code,


        } for t, test_type_code in tests
    ])

@blueprint.route("/tests/<int:id_test>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_test(id_test):
    repo = TestRepository()
    test = repo.get_test_by_id(id_test)
    if not test:
        return {"message": "Test non trouvé"}, 404
    return test.to_dic()

@blueprint.route("/tests/<int:id_test>/with-labels", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_test_with_labels(id_test):
    repo = TestRepository()
    test = repo.get_test_with_labels_by_id(id_test)
    if not test:
        return {"message": "Test non trouvé"}, 404
    return test

@blueprint.route("/tests/code/<string:code>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_test_by_cd_nomenclature(code):
    repo = TestRepository()
    test = repo.get_test_by_cd_nomenclature(code)
    if not test:
        return {"message": "Test non trouvé"}, 404
    return test.to_dic()
@blueprint.route('/materials/<int:id_material>/tests/<int:id_test>', methods=['PUT'])
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
def update_test(id_material, id_test):
    data = request.get_json()

    test = TTest.query.get(id_test)
    if not test or test.id_material != id_material:
        return jsonify({'error': 'Test non trouvé ou n’appartient pas à ce matériel'}), 404

    try:
        repo = TestRepository()
        updated_test = repo.update(id_test, data)
        return jsonify({'message': 'Test mis à jour avec succès', 'id_test': updated_test.id_test}), 200
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400
    except Exception as e:
        return jsonify({'error': 'Erreur serveur'}), 500



@blueprint.route("/actions/code/<string:cd_nomenclature>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_nomenclature_by_code(cd_nomenclature):
    """
    Récupère les informations d'une nomenclature à partir de son code (cd_nomenclature).
    """
    n = db.session.query(TNomenclatures).filter(
        TNomenclatures.cd_nomenclature == cd_nomenclature
    ).first()

    if not n:
        return {"message": "Code non trouvé"}, 404

    return {
        "id_nomenclature": n.id_nomenclature,
        "cd_nomenclature": n.cd_nomenclature,
        "mnemonique": n.mnemonique,
        "id_type": n.id_type
    }


@blueprint.route('/materials/<int:id_material>/tests/<int:id_test>', methods=['DELETE'])
def delete_test(id_material, id_test):
    test = db.session.query(TTest).filter_by(
        id_test=id_test,
        id_material=id_material
    ).first()

    if not test:
        return jsonify({
            'error': 'Test non trouvé'
        }), 404


    action_count = (
        db.session.query(TAction)
        .filter_by(id_test=id_test)
        .count()
    )


    if action_count > 0:
        return jsonify({
            'error': 'Suppression impossible',
            'message': 'Ce test contient des actions liées.',
            'action_count': action_count
        }), 409


    db.session.delete(test)
    db.session.commit()


    return jsonify({
        'success': True
    }), 200


@blueprint.route("/tests/<int:id_test>/actions", methods=["POST"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def create_action(id_test):
    """Ajout d'une action liée à un test"""
    data = request.get_json()

    data['id_test'] = id_test
    data["meta_create_by"] = g.current_user.id_role

    repo = ActionRepository()
    success, result = repo.create(data)

    if not success:
        return {"message": "Erreur lors de la création de l'action", "code": 400}

    return {"message": "Action créée", "action": result.to_dic()}

@blueprint.route("/actions/code/<int:id_nomenclature>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_nomenclature_details(id_nomenclature):
    repo = ActionRepository()
    details = repo.get_nomenclature_details_by_id(id_nomenclature)

    if not details:
        return {"message": "Nomenclature non trouvée"}, 404

    return details

@blueprint.route("/tests/<int:id_test>/actions/code-autocomplete", methods=["GET"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
def get_actions_code_autocomplete(id_test):
    actions = db.session.query(TAction).filter_by(id_test=id_test).all()
    return jsonify([
        {"id_action": action.id_action, "code": action.code}
        for action in actions
    ])


@blueprint.route("/tests/<int:id_test>/actions", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
def get_actions_by_id_test(id_test):
    try:
        repo = ActionRepository()
        actions = repo.get_actions_by_id_test(id_test)
        return jsonify(actions)
    except Exception as e:
        current_app.logger.error(f"Erreur lors du chargement des actions pour le test {id_test}: {e}")
        return jsonify({"error": "Erreur interne du serveur"}), 500
@blueprint.route(
    "/cultures/<int:id_culture>/actions",
    methods=["GET"]
)
@permissions.check_cruved_scope(
    "R",
    module_code=MODULE_CODE
)
@json_resp
def get_actions_by_id_culture(
    id_culture
):
    try:
        culture = (
            CultureRepository()
            .get_by_id(id_culture)
        )

        if not culture:
            return {
                "error": "Culture non trouvée"
            }, 404

        actions = (
            ActionRepository()
            .get_actions_by_id_culture(
                id_culture
            )
        )

        return actions, 200

    except Exception:
        current_app.logger.exception(
            "get_actions_by_id_culture failed "
            f"for Culture {id_culture}"
        )

        return {
            "error": "Erreur interne du serveur"
        }, 500
@blueprint.route("/actions/<int:id_action>/with-labels", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_action_with_labels(id_action):
    repo = ActionRepository()
    action = repo.get_action_with_labels_by_id(id_action)
    if not action:
        return {"message": "Action non trouvée"}, 404
    return action

@blueprint.route("/actions/<int:id_action>", methods=["DELETE"])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_actio(id_action):
    try:
        action = db.session.query(TAction).get(id_action)
        if not action:
            return {"message": "Action non trouvée"}, 404

        if action.id_culture:
            initial_action = (
                CultureRepository
                .get_initial_action(
                    action.id_culture
                )
            )

            is_initial_action = (
                initial_action is not None
                and initial_action.id_action ==
                action.id_action
            )

            if (
                is_initial_action
                and CultureRepository
                    .has_initial_transplantation(
                        action.id_culture
                    )
            ):
                action_count = (
                    TAction.query
                    .filter_by(
                        id_culture=
                            action.id_culture
                    )
                    .count()
                )

                if action_count > 1:
                    culture = (
                        CultureRepository()
                        .get_by_id(
                            action.id_culture
                        )
                    )

                    return {
                        "error": "Suppression impossible",
                        "message": (
                            "La transplantation initiale "
                            "doit être la dernière action "
                            "supprimée de la culture."
                        ),
                        "initial_transplantation": True,
                        "action_count": action_count,
                        "remaining_action_count": (
                            action_count - 1
                        ),
                        "code_culture": (
                            culture.code_culture
                            if culture
                            else None
                        )
                    }, 409

        db.session.delete(action)
        db.session.commit()

        return {"message": "Action supprimée avec succès"}, 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erreur lors de la suppression de l’action {id_action}: {e}")
        return {"error": "Erreur serveur lors de la suppression"}, 500


@blueprint.route("/thermo-photo/<int:id_test>", methods=["GET"])
def get_thermo_photo_by_test(id_test):
    result = ActionRepository().get_thermo_photo_by_test(id_test)
    return jsonify(result)

@blueprint.route("/tests/<int:id_test>/pre-treatment", methods=["PUT"])
def update_pre_treatment(id_test):
    body = request.get_json()
    value = body.get("pre_treatment")

    test = db.session.get(TTest, id_test)
    if not test:
        return jsonify({"error": "Test introuvable"}), 404

    test.pre_treatment = value
    db.session.commit()

    return jsonify({"success": True})

@blueprint.route("/materials/<int:id_material>/tests", methods=["GET"])
def get_tests_by_material_route(id_material):
    results = get_tests_by_material(id_material)
    return jsonify(results)  




@blueprint.route("/tests/<int:id_test>/replicate-dates", methods=["GET"])
def get_replicate_dates_by_test(id_test):
    try:
        dates = ActionRepository().get_replicate_dates_by_test(id_test)
        return jsonify(dates), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
@blueprint.route("/test/<int:id_test>/indicators", methods=["PATCH"])
def save_germination_indicators(id_test):
    try:
        data = request.get_json()

        delay = data.get("delay")
        period = data.get("period")
        percent = data.get("percent")

        test = db.session.query(TTest).get(id_test)
        if not test:
            return jsonify({"error": "Test non trouvé"}), 404

        test.germination_delay = delay
        test.germination_period = period
        test.germination_rate = percent

        db.session.commit()
        return jsonify({"message": "Indicateurs mis à jour"}), 200
    except Exception as e:
        print("❌ Erreur backend :", e)
        return jsonify({"error": str(e)}), 500


@blueprint.route("/tests/<int:id_test>/treatment", methods=["GET"])
def get_treatment_by_test_route(id_test):  
    try:
        result = ActionRepository().get_treatment_by_test(id_test)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@blueprint.route('/materials/<int:id_material>/tests/<int:id_test>/actions/<int:id_action>/replicates', methods=['PUT'])
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
def update_replicate(id_material, id_test, id_action):
    data = request.get_json()

    # Vérifier que l'action existe et appartient au bon test
    action = TAction.query.get(id_action)
    if not action or action.id_test != id_test:
        return jsonify({'error': 'Action non trouvée ou n’appartient pas à ce test'}), 404

    try:
        repo = ActionReplicateRepository()
        updated_action = repo.update(id_action, data)
        return jsonify({
            'message': 'Réplicats mis à jour avec succès',
            'id_action': updated_action.get("id_action")
        }), 200

    except ValueError as ve:
        return jsonify({'error': str(ve)}), 400

    except Exception as e:
        print(f"Erreur serveur : {e}")
        return jsonify({'error': 'Erreur serveur'}), 500

@blueprint.route("/actions/<int:id_action>/replicates", methods=["GET"])
def get_action_replicates(id_action):
    action = db.session.get(TAction, id_action)
    if not action:
        return jsonify({"error": "Action introuvable"}), 404

    action_type = TNomenclatures.query.get(action.id_action_type)
    code = action_type.cd_nomenclature if action_type else None

    replicates = db.session.query(TActionReplicate).filter_by(id_action=id_action).order_by(TActionReplicate.code).all()

    if code == "svr":
        return jsonify({
            "germes": [r.count_germinated for r in replicates],
            "mortes": [r.count_dead for r in replicates],
            "nonGermes": [r.count_viable for r in replicates],
            "last_replicate": any(r.last_replicate for r in replicates)
        })
    elif code == "synth" and replicates:
        r = replicates[0]
        return jsonify({
            "total_count_germinated": r.total_count_germinated,
            "total_count_dead": r.total_count_dead,
            "total_count_viable": r.total_count_viable
        })
    else:
        return jsonify({})

@blueprint.route("/actions/<int:id_action>/update", methods=["PUT"])
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
def update_action_data(id_action):
    data = request.get_json()

    try:
        repo = ActionRepository()
        updated = repo.update(id_action, data)
        return jsonify({"message": "Action mise à jour avec succès", "id_action": updated.id_action}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print("Erreur serveur :", e)
        return jsonify({"error": "Erreur serveur"}), 500



@blueprint.route("/test/<int:id_test>/germination-percent", methods=["GET"])
def get_germination_percent(id_test):
    test = TTest.query.get(id_test)
    if not test:
        return jsonify({"error": "Test non trouvé"}), 404

    svr_nomenclature = TNomenclatures.query.filter_by(cd_nomenclature='svr').first()
    if not svr_nomenclature:
        return jsonify({"error": "Type d’action 'svr' introuvable"}), 404

    actions = TAction.query.filter_by(id_test=id_test, id_action_type=svr_nomenclature.id_nomenclature).all()
    action_ids = [a.id_action for a in actions]
    if not action_ids:
        return jsonify({"percent": None})

    # Calcule le total des graines germées
    total_germinated = db.session.query(
        func.sum(TActionReplicate.count_germinated)
    ).filter(
        TActionReplicate.id_action.in_(action_ids)
    ).scalar() or 0

    # Calcule le total des graines (germées + mortes + non germées)
    total_seeds = db.session.query(
        func.sum(
            (TActionReplicate.count_germinated or 0) +
            (TActionReplicate.count_dead or 0) +
            (TActionReplicate.count_viable or 0)
        )
    ).filter(
        TActionReplicate.id_action.in_(action_ids)
    ).scalar() or 0

    if total_seeds == 0:
        return jsonify({"percent": None})

    percent = (total_germinated / total_seeds) * 100

    return jsonify({"percent": round(percent, 1)})


@blueprint.route("/test/<int:id_test>/indicators", methods=["PATCH"])
def update_test_indicators(id_test):
    test = TTest.query.get(id_test)
    if not test:
        return jsonify({"error": "Test introuvable"}), 404

    data = request.get_json()
    test.germination_rate = data.get("percent")  

    db.session.commit()
    return jsonify({"message": "Indicateurs mis à jour"})
