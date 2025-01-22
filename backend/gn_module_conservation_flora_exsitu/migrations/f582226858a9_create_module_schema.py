"""Create module schema

Revision ID: f582226858a9
Revises: 774793661884
Create Date: 2025-01-22 11:57:56.515152

"""
from alembic import op
import sqlalchemy as sa
import importlib
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision = 'f582226858a9'
down_revision = '774793661884'
branch_labels = None
depends_on = None


def upgrade():
    operations = text(
        importlib.resources.read_text(
            "gn_module_conservation_flora_exsitu.migrations.data", "schema.sql"
        )
    )
    op.get_bind().execute(operations)


def downgrade():
    op.execute("DROP SCHEMA pr_conservation_flora_exsitu CASCADE")
