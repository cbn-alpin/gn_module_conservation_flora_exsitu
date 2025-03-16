import logging

from flask import Blueprint, request, g
from geonature.core.gn_permissions import decorators as permissions
from utils_flask_sqla.response import json_resp
from .repositories import HarvestRepository, HarvestMaterialRepository
from .models import THarvestMaterial, THarvest, CorMaterialTaxon, CorHarvestObserver
from gn_module_conservation_flora_exsitu import MODULE_CODE
from ref_geo.models import LAreas, BibAreasTypes
from geonature.utils.env import db
from sqlalchemy.sql.expression import func, select
from sqlalchemy.orm import aliased
from apptax.taxonomie.models import Taxref
from pypnusershub.db.models import User
from geojson import Feature, FeatureCollection
from sqlalchemy import and_
from flask import request, jsonify
from pypn_habref_api.models import Habref
from geoalchemy2.functions import ST_AsGeoJSON
import json
from pypnnomenclature.models import TNomenclatures
from sqlalchemy import exists


blueprint = Blueprint("pr_conservation_flora_exsitu", __name__)
log = logging.getLogger(__name__)


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

    query = query.order_by(
        THarvestMaterial.code_material.isnot(None),
        THarvest.date_start.desc(),
        THarvest.id_harvest.desc(),
        THarvestMaterial.code_material.desc()
    ).limit(limit).offset(offset)

    results = query.all()

    if not results:
        return {
            'page': page,
            'limit': limit,
            'total': 0,
            'total_pages': 0,
            'items': [],
            'message': 'Aucun résultat trouvé pour ces filtres.'
        }, 200

    items = [
        {
            "id_harvest": result.id_harvest,
            "date_start": result.date_start,
            "code_material": result.code_material,
            "taxons": result.taxons,
            "departement_name": result.departement_name,
            "departement_code": result.departement_code,
            "commune": result.commune,
            "observateurs": result.observateurs
        }
        for result in results
    ]

    total_pages = (total + limit - 1) // limit

    return {
        'page': page,
        'limit': limit,
        'total': total,
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

    query = harvest_repo.build_harvest_query(
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

    results = query.add_columns(func.ST_AsGeoJSON(func.ST_Transform(THarvest.geom, 4326)).label("geom")).all()

    if not results:
        return {
            'items': []
        }, 200

    features = [
        Feature(
            id=result.id_harvest,
            geometry=json.loads(result.geom) if result.geom else None,
            properties={"id_harvest": result.id_harvest}
        )
        for result in results
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
    
    materials_exist = db.session.query(THarvestMaterial).filter(THarvestMaterial.id_harvest == harvest.id_harvest).count() > 0
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
        "precision": harvest.precision,
        "id_geographical_location": geographical_location,
        "id_exposition": harvest.id_exposition,
        "observers": observers, 
        "harvest_materials": materials_exist,
        "additional_data": additional_data
    }

    return harvest_data, 200



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
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
@json_resp
def update_material(id_harvest, id_material):
    """Mise à jour d'un matériel végétal dans une récolte"""
    data = request.get_json()
    material_repo = HarvestMaterialRepository()
    material = material_repo.update(id_material, data)
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
def get_harvest_materials(id_harvest):
    try:
        limit = request.args.get('limit', default=10, type=int) 
        page = request.args.get('page', default=1, type=int)
        offset = (page - 1) * limit

        materials = THarvestMaterial.query.filter_by(id_harvest=id_harvest)\
                                          .limit(limit)\
                                          .offset(offset)\
                                          .all()
        
        materials_list = [material.to_dic() for material in materials]

        return {
            'materials': materials_list,
            'total': THarvestMaterial.query.filter_by(id_harvest=id_harvest).count(),  # Total des matériaux
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
    query = db.session.query(exists().where(THarvestMaterial.code_material == code_material)).scalar()
    #material = THarvestMaterial.query.filter_by(code_material=code_material).first()

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
    
    results = db.session.query(THarvestMaterial.code_material).filter(
        THarvestMaterial.code_material.ilike(f"%{search_term}%")
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


