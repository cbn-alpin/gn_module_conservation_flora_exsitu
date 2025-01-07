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
depends_on = 'f06cc80cc8ba' # GN 2.15.0


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
        logger.info("Inserting Conservation Strategy nomenclatures…")
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
                "active",
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
                "active",
            ),
            header=True,
            encoding="UTF-8",
            delimiter=",",
        )


def downgrade():
    delete_nomenclatures("CFE_HARVEST_TYPE")
    delete_nomenclatures("CFE_METHOD_SAMPLE")
    delete_nomenclatures("CFE_HARVEST_MATERIAL")
    delete_nomenclatures("CFE_FOOT_COUNTING_CLASS")
    delete_nomenclatures("CFE_PHENOLOGY")
    delete_nomenclatures("CFE_FORM")
    delete_nomenclatures("CFE_ATWATER_TYPE")
    delete_nomenclatures("CFE_SEED_QUALITY")
    delete_nomenclatures("CFE_GROWTH")
    delete_nomenclatures("CFE_DECORATION")
    delete_nomenclatures("CFE_EMBRYO_TYPE")
    delete_nomenclatures("CFE_UNIT")
    delete_nomenclatures("CFE_STOCK_LOCATION")
    delete_nomenclatures("CFE_STOCK_FLOW")
    delete_nomenclatures("CFE_COLOR_TABLET")
    delete_nomenclatures("CFE_LOCATION_TYPE")
    delete_nomenclatures("CFE_DISSEMINATION_UNIT")

    delete_module(MODULE_CODE)

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

