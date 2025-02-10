"""
   Spécification du schéma toml des paramètres de configurations
   La classe doit impérativement s'appeller GnModuleSchemaConf
   Fichier spécifiant les types des paramètres et leurs valeurs par défaut
   Fichier à ne pas modifier. Paramètres surcouchables dans config/config_gn_module.tml
"""

from marshmallow import Schema, fields


class GnModuleSchemaConf(Schema):
    module_code = fields.String(load_default="CONSERVATION_FLORA_EXSITU")
    module_title = fields.String(load_default="Exsitu")
    module_code_pf = fields.String(load_default="FLORA_EXSITU")
    observers_list_code = fields.String(load_default="OFS")