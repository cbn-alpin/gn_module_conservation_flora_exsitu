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
    """Récupère toutes les récoltes avec labels, date de début et matériaux"""
    harvest_repo = HarvestRepository()
    harvests = harvest_repo.get_all()

    results = {}
    for harvest in harvests:
        harvest_id = harvest.id_harvest
        if harvest_id not in results:
            results[harvest_id] = {
                "date_start": harvest.date_start.strftime("%Y-%m-%d") if harvest.date_start else None,
                "cd_hab": harvest.cd_hab_label,
                "harvest_type": harvest.harvest_type_label,
                "exposition": harvest.exposition_label,
                "harvest_materials": []
            }
        if harvest.harvest_material:
            results[harvest_id]["harvest_materials"].append(harvest.harvest_material)

    return list(results.values()), 200

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


@blueprint.route("/harvests/<int:id_harvest>/materials", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_materials_by_id_harvest(id_harvest):
    material_repo = HarvestMaterialRepository()
    materials = material_repo.materials_by_id_harvest(id_harvest)
    
    return {
        "message": "Materials loaded successfully",
        "materials": [tuple_to_dict(material) for material in materials] if materials else []
    }, 200


def tuple_to_dict(material_tuple):
    columns = [
        "id_harvest", "code_cultural_bank", "code_material", "protocole_note", "comment",
        "id_parent", "is_soil_sampling", "id_material", "class_conting",
        "harvest_material", "sample_method", "phenology_1", "phenology_2"
    ]
    return dict(zip(columns, material_tuple))
