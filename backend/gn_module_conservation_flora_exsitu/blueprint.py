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
    municipality = request.args.get('municipality', type=str)  
    departement = request.args.get('departement', type=str)  
    id_harvest_type = request.args.get('id_harvest_type', type=int)  
    code_material = request.args.get('code_material', type=str)  

    # Alias pour les jointures
    l_areas_dept = aliased(LAreas)
    l_areas_commune = aliased(LAreas)
    ObservateurAlias = aliased(User)


    # Début de la requête SQLAlchemy
    query = (
        db.session.query(
            THarvest.id_harvest,
            THarvestMaterial.id_material,
            THarvest.date_start,
            THarvestMaterial.code_material,
            db.func.string_agg(Taxref.lb_nom, ', ').label('taxons'),
            l_areas_dept.area_code.label('departement_code'),
            l_areas_dept.area_name.label('departement_name'),
            l_areas_commune.area_name.label('commune'),
            func.json_agg(
                func.json_build_object(
                    "prenom_role", User.prenom_role,
                    "nom_role", User.nom_role
                )
            ).label("observateurs"),
            ST_AsGeoJSON(THarvest.geom).label("geom")  # Conversion en GeoJSON
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

    if municipality:
        query = query.filter(THarvest.location_code == municipality)

    if departement:
        query = query.filter(THarvest.location_code == departement)

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
                "taxons": result.taxons,
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
    """Récupère une récolte par son ID avec labels, date de début et matériaux"""
    harvest_repo = HarvestRepository()
    harvest = harvest_repo.get_one(harvest_id)

    if not harvest:
        return {"message": "Harvest not found"}, 404

    # Structurer la réponse avec les informations sur la récolte
    result = {
        "id_harvest": harvest[0][0],  # ID de la récolte
        "date_start": harvest[0][1].strftime("%Y-%m-%d") if harvest[0][1] else None,
        "cd_hab": harvest[0][2],
        "harvest_type": harvest[0][3],
        "exposition": harvest[0][4],
        "harvest_materials": []
    }

    # Ajouter tous les matériaux associés à la récolte
    for harvest_material in harvest:
        if harvest_material[-1]:  # Vérifier que THarvestMaterial existe
            harvest_material_dict = {c.name: getattr(harvest_material[-1], c.name) for c in THarvestMaterial.__table__.columns}
            result["harvest_materials"].append(harvest_material_dict)

    return result, 200


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


