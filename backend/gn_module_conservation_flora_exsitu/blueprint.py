import logging

from flask import Blueprint, request, g
from geonature.core.gn_permissions import decorators as permissions
from utils_flask_sqla.response import json_resp
from .repositories import HarvestRepository, SeedRepository
from gn_module_conservation_flora_exsitu import MODULE_CODE

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
    return {"message": "Harvest created successfully", "id": harvest.id_harvest}, 201



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
