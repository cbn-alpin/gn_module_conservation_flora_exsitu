"""create module schema

Revision ID: e93f05515c4e
Revises: 774793661884
Create Date: 2025-01-06 22:44:37.661248

"""

import importlib

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision = 'e93f05515c4e'
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
