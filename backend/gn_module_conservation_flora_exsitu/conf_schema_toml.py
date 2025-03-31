"""
   Spécification du schéma toml des paramètres de configurations
   La classe doit impérativement s'appeller GnModuleSchemaConf
   Fichier spécifiant les types des paramètres et leurs valeurs par défaut
   Fichier à ne pas modifier. Paramètres surcouchables dans config/config_gn_module.tml
"""

from marshmallow import Schema, fields

class AdditionalDataSchema(Schema):
    type_widget = fields.String(required=True)
    attribut_label = fields.String(required=True)
    attribut_name = fields.String(required=True)

class HarvestFormSchema(Schema):
    additional_data = fields.List(fields.Nested(AdditionalDataSchema), load_default=[
        {"type_widget": "number", "attribut_label": "Pente", "attribut_name": "slope"},
        {"type_widget": "text", "attribut_label": "Commentaire météo", "attribut_name": "weather_comment"},
        {"type_widget": "text", "attribut_label": "Programme", "attribut_name": "program"},
    ])


class GnModuleSchemaConf(Schema):
    module_code = fields.String(load_default="CONSERVATION_FLORA_EXSITU")
    module_title = fields.String(load_default="Exsitu")
    module_code_pf = fields.String(load_default="FLORA_EXSITU")
    observers_list_code = fields.String(load_default="OFS")
    zoom_center = fields.List(fields.Float(), load_default=[44.982667966765845, 6.062455200884894])
    zoom = fields.Integer(load_default=10)
    harvest_form = fields.Nested(HarvestFormSchema, load_default=HarvestFormSchema().load({}))
    default_dataset = fields.Integer(load_default=1)