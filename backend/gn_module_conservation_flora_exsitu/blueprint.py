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
from geoalchemy2.shape import to_shape
from sqlalchemy import exists
from shapely import wkb
from shapely.geometry import shape


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



@blueprint.route("/harvests", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_harvests():
    """Récupère toutes les récoltes avec pagination et filtres (taxons, département, commune, observateurs)"""

    # Récupération des paramètres de la requête (pagination)
    page = request.args.get('page', default=1, type=int)
    limit = request.args.get('limit', default=10, type=int)
    offset = (page - 1) * limit

    # Filtres facultatifs
    cd_nom = request.args.get('cd_nom', type=int)  
    cd_hab = request.args.get('cd_hab', type=int)  
    date_start = request.args.get('date_start', type=str) 
    date_end = request.args.get('date_end', type=str) 
    observers = request.args.getlist('observers')  
    municipalites = request.args.getlist('municipalites')  
    departements = request.args.getlist('departements')  
    id_harvest_type = request.args.get('id_harvest_type', type=int)  
    code_material = request.args.get('code_material', type=str)  

    # Alias pour les jointures
    l_areas_dept = aliased(LAreas)
    l_areas_commune = aliased(LAreas)

    # Début de la requête SQLAlchemy
    query = (
        db.session.query(
            THarvest.id_harvest,
            THarvestMaterial.id_material,
            THarvest.date_start,
            THarvestMaterial.code_material,
            # db.func.string_agg(Taxref.lb_nom, ', ').label('taxons'),
            Taxref.lb_nom.label('taxon'),
            l_areas_dept.area_code.label('departement_code'),
            l_areas_dept.area_name.label('departement_name'),
            l_areas_commune.area_name.label('commune'),
            func.json_agg(
                func.json_build_object(
                    "prenom_role", User.prenom_role,
                    "nom_role", User.nom_role
                )
            ).label("observateurs"),
            func.ST_AsGeoJSON(func.ST_Transform(THarvest.geom, 4326)).label("geom")
            # ST_AsGeoJSON(THarvest.geom).label("geom")  # Conversion en GeoJSON
        )
        .join(THarvestMaterial, THarvest.id_harvest == THarvestMaterial.id_harvest)
        .outerjoin(CorMaterialTaxon, THarvestMaterial.id_material == CorMaterialTaxon.id_material)
        .outerjoin(Taxref, CorMaterialTaxon.cd_nom == Taxref.cd_nom)
        .outerjoin(l_areas_dept, and_(THarvest.location_code == l_areas_dept.id_area, l_areas_dept.id_type == 26))
        .outerjoin(l_areas_commune, and_(THarvest.location_code == l_areas_commune.id_area, l_areas_commune.id_type == 25))
        .outerjoin(CorHarvestObserver, THarvest.id_harvest == CorHarvestObserver.id_harvest)
        .outerjoin(User, CorHarvestObserver.id_observer == User.id_role)
        .group_by(
            THarvest.id_harvest,
            THarvestMaterial.id_material,
            THarvest.date_start,
            THarvestMaterial.code_material,
            Taxref.lb_nom,
            l_areas_dept.area_name,
            l_areas_dept.area_code,
            l_areas_commune.area_name,
            THarvest.geom
        )
    )

    if cd_nom:
        query = query.filter(CorMaterialTaxon.cd_nom == cd_nom)

    if cd_hab:
        query = query.filter(THarvest.cd_hab == cd_hab)

    if date_start:
        query = query.filter(THarvest.date_start >= date_start)

    if date_end:
        query = query.filter(THarvest.date_start <= date_end)

    if observers:
        query = query.filter(User.id_role.in_(observers))

    if municipalites:
        query = query.filter(THarvest.location_code.in_(municipalites))

    if departements:
        query = query.filter(THarvest.location_code.in_(departements))

    if id_harvest_type:
        query = query.filter(THarvest.id_harvest_type == id_harvest_type)

    if code_material:
        query = query.filter(THarvestMaterial.code_material.ilike(f"%{code_material}%"))

    query = query.order_by(THarvestMaterial.id_material.desc()).limit(limit).offset(offset)

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

    # Transformation des résultats en GeoJSON
    features = [
        Feature(
            id=result.id_material,
            geometry=json.loads(result.geom) if result.geom else None,
            properties={
                "id_harvest": result.id_harvest,
                "date_start": result.date_start,
                "code_material": result.code_material,
                "taxon": result.taxon,
                "departement_name": result.departement_name,
                "departement_code": result.departement_code,
                "commune": result.commune,
                "observateurs": result.observateurs
            }
        )
        for result in results
    ]

    # Calcul du nombre total d'éléments
    total = db.session.query(db.func.count(THarvestMaterial.id_material)).scalar()
    total_pages = (total + limit - 1) // limit

    return {
        'page': page,
        'limit': limit,
        'total': total,
        'total_pages': total_pages,
        'items': FeatureCollection(features)
    }, 200

@blueprint.route("/harvests/<int:harvest_id>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_harvest_by_id(harvest_id):

    harvest = db.session.query(THarvest).filter(THarvest.id_harvest == harvest_id).first()
    
    if not harvest:
        return {"error": "Harvest not found"}, 404

    observers = (
        db.session.query(CorHarvestObserver.id_observer)
        .filter(CorHarvestObserver.id_harvest == harvest.id_harvest)
        .all()
    )
    
    materials_exist = db.session.query(THarvestMaterial).filter(THarvestMaterial.id_harvest == harvest.id_harvest).count() > 0
    geom_geojson = None
    if harvest.geom:
        geom_wgs84 = db.session.query(func.ST_AsGeoJSON(func.ST_Transform(THarvest.geom, 4326))).filter(THarvest.id_harvest == harvest.id_harvest).first()
        if geom_wgs84:
            geom_geojson = json.loads(geom_wgs84[0]) 

    harvest_data = {
        "id_harvest": harvest.id_harvest,
        "id_harvest_type": harvest.id_harvest_type,
        "id_dataset": harvest.id_dataset,
        "date_start": harvest.date_start,
        "date_end": harvest.date_end,
        "location_type": harvest.location_type,
        "location_code": harvest.location_code,
        "geom": geom_geojson,
        "id_geographical_location": harvest.id_geographical_location,
        "id_exposition": harvest.id_exposition,
        "observers": [observer.id_observer for observer in observers], 
        "harvest_materials": materials_exist
    }

    return harvest_data, 200



@blueprint.route("/harvests/<int:id_harvest>/materials", methods=["POST"])
@permissions.check_cruved_scope("C", module_code=MODULE_CODE)
@json_resp
def create_material(id_harvest):
    """Ajout d'un matériel végétal à une récolte"""
    data = request.get_json()
    data['id_harvest'] = id_harvest
    material_repo = HarvestMaterialRepository()
    material = material_repo.create(data)
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


