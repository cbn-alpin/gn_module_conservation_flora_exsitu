"""add specific data

Revision ID: 774793661884
Create Date: 2025-01-06 23:07:42.754140

"""
import importlib
from gn_module_conservation_flora_exsitu import MODULE_DB_BRANCH, MODULE_CODE
from csv import DictReader
from alembic import op
import sqlalchemy as sa
from utils_flask_sqla.migrations.utils import logger
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision = '774793661884'
down_revision = None
branch_labels = MODULE_DB_BRANCH
depends_on = 'f06cc80cc8ba' # GN 2.14.2


def copy_from_csv(
    f, schema, table, dest_cols="", source_cols=None, header=True, encoding=None, delimiter=None
):
    if dest_cols:
        dest_cols = " (" + ", ".join(dest_cols) + ")"
    if source_cols:
        final_table = table
        final_table_cols = dest_cols
        table = f"import_{table}"
        dest_cols = ""
        field_names = get_csv_field_names(f, encoding=encoding, delimiter=delimiter)
        op.create_table(
            table, *[sa.Column(c, sa.String) for c in map(str.lower, field_names)], schema=schema
        )

    options = ["FORMAT CSV"]
    if header:
        options.append("HEADER")
    if encoding:
        options.append(f"ENCODING '{encoding}'")
    if delimiter:
        options.append(f"DELIMITER E'{delimiter}'")
    options = ", ".join(options)
    cursor = op.get_bind().connection.cursor()
    cursor.copy_expert(
        f"""
        COPY {schema}.{table}{dest_cols}
        FROM STDIN WITH ({options})
    """,
        f,
    )

    if source_cols:
        source_cols = ", ".join(source_cols)
        op.execute(
            f"""
            INSERT INTO {schema}.{final_table}{final_table_cols}
            SELECT {source_cols}
                FROM {schema}.{table};
            """
        )
        op.drop_table(table, schema=schema)



def get_csv_field_names(f, encoding, delimiter):
    if encoding == "WIN1252":  # postgresql encoding
        encoding = "cp1252"  # python encoding
    # t = TextIOWrapper(f, encoding=encoding)
    reader = DictReader(f, delimiter=delimiter)
    field_names = reader.fieldnames
    # t.detach()  # avoid f to be closed on t garbage collection
    f.seek(0)
    return field_names


def upgrade():
    operations = text(
        importlib.resources.read_text("gn_module_conservation_flora_exsitu.migrations.data", "data.sql")
    )
    op.get_bind().execute(operations, {"moduleCode": MODULE_CODE})

    with importlib.resources.open_text(
        "gn_module_conservation_flora_exsitu.migrations.data", "nomenclatures.csv"
    ) as csvfile:
        logger.info("Inserting Conservation Flora Exsitu nomenclatures…")
        copy_from_csv(
            csvfile,
            "ref_nomenclatures",
            "t_nomenclatures",
            dest_cols=(
                "id_type",
                "cd_nomenclature",
                "mnemonique",
                "label_default",
                "definition_default",
                "label_fr",
                "definition_fr",
                "source",
                "hierarchy",
            ),
            source_cols=(
                "ref_nomenclatures.get_id_nomenclature_type(type_nomenclature_code)",
                "cd_nomenclature",
                "mnemonique",
                "label_default",
                "definition_default",
                "label_fr",
                "definition_fr",
                "source",
                "hierarchy",
            ),
            header=True,
            encoding="UTF-8",
            delimiter=";",
        )


def downgrade():
    created_temp_indexes = create_missing_nomenclature_indexes()

    delete_nomenclatures("CFE_HARVEST_TYPE")
    delete_nomenclatures("CFE_METHOD_SAMPLE")
    delete_nomenclatures("CFE_HARVEST_MATERIAL")
    delete_nomenclatures("CFE_FOOT_COUNTING_CLASS")
    delete_nomenclatures("CFE_MAIN_LOCATION")
    delete_nomenclatures("CFE_PHYSIOLOGICAL_STAGE")
    delete_nomenclatures("CFE_TRANSPLANTATION_TYPE")
    delete_nomenclatures("CFE_PHENOLOGICAL_STAGE")
    delete_nomenclatures("CFE_PHENOLOGY")
    delete_nomenclatures("CFE_FORM")
    delete_nomenclatures("CFE_ATWATER_TYPE")
    delete_nomenclatures("CFE_MATERIAL_QUALITY")
    delete_nomenclatures("CFE_GROWTH")
    delete_nomenclatures("CFE_DECORATION")
    delete_nomenclatures("CFE_EMBRYO_TYPE")
    delete_nomenclatures("CFE_UNIT")
    delete_nomenclatures("CFE_PLACE")
    delete_nomenclatures("CFE_STOCK_FLOW")
    delete_nomenclatures("CFE_COLOR_TABLET")
    delete_nomenclatures("CFE_DISSEMINATION_UNIT")
    delete_nomenclatures("CFE_GEOGRAPHICAL_PRECISION")
    delete_nomenclatures("CFE_DRY_TYPE")
    delete_nomenclatures("CFE_HUMIDITY_LEVEL")
    delete_nomenclatures("CFE_DESTOCK")
    delete_nomenclatures("CFE_DESTINATION")
    delete_nomenclatures("CFE_INTERNAL_DESTINATION")
    delete_nomenclatures("CFE_EXTERNAL_DESTINATION")
    delete_nomenclatures("CFE_HUMIDITY_DEVICE")
    delete_nomenclatures("CFE_STORAGE_ACTION")
    delete_nomenclatures("CFE_MEDIA_TYPE")
    

    delete_taxhub_attribute("cfe_form1")
    delete_taxhub_attribute("cfe_form2")
    delete_taxhub_attribute("cfe_type_albumen")
    delete_taxhub_attribute("cfe_excroissance1")
    delete_taxhub_attribute("cfe_excroissance2")
    delete_taxhub_attribute("cfe_ornementation1")
    delete_taxhub_attribute("cfe_ornementation2")
    delete_taxhub_attribute("cfe_embryo_type1")
    delete_taxhub_attribute("cfe_embryo_type2")
    delete_taxhub_attribute("cfe_comm_dim_forme")
   
    delete_taxhub_attribute_theme("Semence")
    delete_medias_for_table_location("pr_conservation_flora_exsitu", "t_material_seed", "unique_id_seed")
    delete_table_location("pr_conservation_flora_exsitu", "t_material_seed", "unique_id_seed")
    
    delete_nomenclatures("CFE_WATERING_METHOD")
    delete_nomenclatures("CFE_TEST_SUBSTRATE")
    delete_nomenclatures("CFE_SOWING_METHOD")
    delete_nomenclatures("CFE_LIQUID")
    delete_nomenclatures("CFE_WATER_TYPE")
    delete_nomenclatures("CFE_TG_SUPPORT")
    delete_nomenclatures("CFE_SOWING_LOCATION")
    delete_nomenclatures("CFE_TEST_TYPE")
    delete_nomenclatures("CFE_SCARIFICATION_TYPE")
    delete_nomenclatures("CFE_SOWING_SUBSTRATE")
    delete_nomenclatures("CFE_SOWING_CONTAINER")
    delete_nomenclatures("CFE_ACTION_TYPE")
    delete_nomenclatures("CFE_CHEMICAL")
    delete_nomenclatures("CFE_LIQUID")
    delete_nomenclatures("CFE_SCARIFICATION_TOOL")
    delete_nomenclatures("CFE_SCA_CH_PRODUCT")
    delete_nomenclatures("CFE_TREATMENT_PRODUCT")
    delete_nomenclatures("CFE_SCARIFICATION_MEC")
    delete_nomenclatures("CFE_STERILIZATION_PRODUCT")
    delete_nomenclatures("CFE_ACTION_VIA_TYPE")

    delete_nomenclatures("CFE_STERILIZATION_LIQUID")
    delete_nomenclatures("CFE_LIQUID_TREATMENT")

    delete_nomenclature_indexes(created_temp_indexes)

    delete_module(MODULE_CODE)


def create_missing_nomenclature_indexes():
    operation = text(
        """
        SELECT
            n.nspname AS schema_name,
            cl.relname AS table_name,
            a.attname AS column_name
        FROM pg_constraint AS c
            JOIN pg_class AS cl 
                ON cl.oid = c.conrelid
            JOIN pg_namespace AS n 
                ON n.oid = cl.relnamespace
            JOIN pg_attribute AS a 
                ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
        WHERE c.confrelid = 'ref_nomenclatures.t_nomenclatures'::regclass
          AND NOT EXISTS (
              SELECT 1 
              FROM pg_index i 
              WHERE i.indrelid = c.conrelid 
                AND a.attnum = ANY(i.indkey)
          );
    """
    )
    result = op.get_bind().execute(operation).fetchall()

    created_indexes = []
    print(f"Creating of {len(result)} temporary nomenclature indexes to accelerate the deletion...")
    for row in result:
        schema_name = row.schema_name
        table_name = row.table_name
        column_name = row.column_name

        # Max index name of 63 characters
        index_name = f"idx_tmp_{table_name}_{column_name}"
        index_name = index_name[:63]

        op.get_bind().execute(
            text(
                f"""
            CREATE INDEX IF NOT EXISTS {index_name} 
            ON {schema_name}.{table_name} ({column_name});
        """
            )
        )

        created_indexes.append((schema_name, index_name))

    return created_indexes


def delete_nomenclature_indexes(indexes_to_deleted):
    print(f"Deleting of {len(indexes_to_deleted)} temporary nomenclature indexes...")
    for schema_name, index_name in indexes_to_deleted:
        try:
            op.get_bind().execute(text(f"DROP INDEX IF EXISTS {schema_name}.{index_name};"))
        except Exception as e:
            print(f"Error while deleting index {schema_name}.{index_name}: {e}")


def delete_nomenclatures(mnemonique):
    operation = text(
        """
            DELETE FROM ref_nomenclatures.t_nomenclatures
            WHERE id_type = (
                SELECT id_type
                FROM ref_nomenclatures.bib_nomenclatures_types
                WHERE mnemonique = :mnemonique
            );
            DELETE FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = :mnemonique
        """
    )
    op.get_bind().execute(operation, {"mnemonique": mnemonique})


def delete_module(module_code):
    operation = text(
        """
        -- Unlink module from dataset
        DELETE FROM gn_commons.cor_module_dataset
            WHERE id_module = (
                SELECT id_module
                FROM gn_commons.t_modules
                WHERE module_code = :moduleCode
            ) ;
        -- Uninstall module (unlink this module of GeoNature)
        DELETE FROM gn_commons.t_modules
            WHERE module_code = :moduleCode ;
    """
    )
    op.get_bind().execute(operation, {"moduleCode": module_code})


def delete_taxhub_attribute_theme(theme_name):
    operation = text(
        """
            -- Delete TaxHub attributs theme
            WITH attributs_deleted AS (
                DELETE FROM taxonomie.bib_attributs WHERE id_theme IN (
                    SELECT id_theme FROM taxonomie.bib_themes
                    WHERE nom_theme = :themeName
                )
                RETURNING id_attribut
            )
            DELETE FROM taxonomie.cor_taxon_attribut WHERE id_attribut IN (
                SELECT id_attribut FROM attributs_deleted
            );

            DELETE FROM taxonomie.bib_themes WHERE nom_theme = :themeName ;
        """
    )
    op.get_bind().execute(operation, {"themeName": theme_name})


def delete_taxhub_attribute(attribut_name):
    operation = text(
        """
            -- Delete TaxHub attribut
            DELETE FROM taxonomie.cor_taxon_attribut WHERE id_attribut = (
                SELECT id_attribut
                FROM taxonomie.bib_attributs
                WHERE nom_attribut = :attributName
            );

            DELETE FROM taxonomie.bib_attributs WHERE nom_attribut = :attributName ;
        """
    )
    op.get_bind().execute(operation, {"attributName": attribut_name})


def delete_table_location(schema_name, table_name, uuid_field_name):
    operation = text("""
        DELETE FROM gn_commons.bib_tables_location
        WHERE schema_name = :schema_name
          AND table_name = :table_name
          AND uuid_field_name = :uuid_field_name
    """)
    op.get_bind().execute(operation, {
        "schema_name": schema_name,
        "table_name": table_name,
        "uuid_field_name": uuid_field_name
    })

def delete_medias_for_table_location(schema_name, table_name, uuid_field_name):
    operation = sa.text(
        """
            -- Delete medias linked to a specific table location
            DELETE FROM gn_commons.t_medias
            WHERE id_table_location = (
                SELECT id_table_location
                FROM gn_commons.bib_tables_location
                WHERE schema_name = :schema_name
                  AND table_name = :table_name
                  AND uuid_field_name = :uuid_field_name
            );
        """
    )
    op.get_bind().execute(operation, {
        "schema_name": schema_name,
        "table_name": table_name,
        "uuid_field_name": uuid_field_name
    })
