"""make sowing storage optional

Revision ID: 4c2b7f8a9d10
Revises: 308061920435
Create Date: 2026-04-18 15:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4c2b7f8a9d10'
down_revision = '308061920435'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        't_sowing',
        'id_storage',
        existing_type=sa.Integer(),
        nullable=True,
        schema='pr_conservation_flora_exsitu'
    )


def downgrade():
    op.alter_column(
        't_sowing',
        'id_storage',
        existing_type=sa.Integer(),
        nullable=False,
        schema='pr_conservation_flora_exsitu'
    )
