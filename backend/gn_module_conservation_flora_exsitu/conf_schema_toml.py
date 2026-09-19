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


class FormAdditionalConfigSchema(Schema):
    additional_data = fields.List(fields.Nested(AdditionalDataSchema), load_default=[])


class MailConfigSchema(Schema):
    smtp_host = fields.String(load_default="")
    smtp_port = fields.Integer(load_default=465)
    smtp_ssl = fields.Boolean(load_default=True)
    smtp_user = fields.String(load_default="")
    smtp_password = fields.String(load_default="")
    sender = fields.String(load_default="")


class GnModuleSchemaConf(Schema):
    module_code = fields.String(load_default="CONSERVATION_FLORA_EXSITU")
    module_title = fields.String(load_default="Exsitu")
    module_code_pf = fields.String(load_default="FLORA_EXSITU")
    observers_list_code = fields.String(load_default="OFS")
    zoom_center = fields.List(fields.Float(), load_default=[44.98266, 6.06245])
    zoom = fields.Integer(load_default=10)
    harvest_form = fields.Nested(
        FormAdditionalConfigSchema, load_default=FormAdditionalConfigSchema().load({})
    )
    material_form = fields.Nested(
        FormAdditionalConfigSchema, load_default=FormAdditionalConfigSchema().load({})
    )
    seed_form = fields.Nested(
        FormAdditionalConfigSchema, load_default=FormAdditionalConfigSchema().load({})
    )
    stock_form = fields.Nested(
        FormAdditionalConfigSchema, load_default=FormAdditionalConfigSchema().load({})
    )
    action_form = fields.Nested(
        FormAdditionalConfigSchema, load_default=FormAdditionalConfigSchema().load({})
    )
    default_dataset = fields.Integer(load_default=1)
    germination_form = fields.Nested(
        FormAdditionalConfigSchema, load_default=FormAdditionalConfigSchema().load({})
    )
    semis_form = fields.Nested(
        FormAdditionalConfigSchema, load_default=FormAdditionalConfigSchema().load({})
    )

    mail = fields.Nested(
        MailConfigSchema,
        load_default=MailConfigSchema().load({})
    )
