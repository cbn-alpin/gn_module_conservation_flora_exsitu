"""make sowing storage optional and add sowing constraints

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

    op.alter_column(
        't_sowing',
        'id_actor',
        existing_type=sa.Integer(),
        nullable=True,
        schema='pr_conservation_flora_exsitu'

    )

    op.alter_column(
        't_sowing',
        'code',
        existing_type=sa.String(length=50),
        nullable=False,
        schema='pr_conservation_flora_exsitu'
    )

    op.create_unique_constraint(
        'uq_t_sowing_code',
        't_sowing',
        ['code'],
        schema='pr_conservation_flora_exsitu'
    )

    op.create_check_constraint(
        'ck_t_sowing_end_date_after_start_date',
        't_sowing',
        'end_date IS NULL OR end_date > start_date',
        schema='pr_conservation_flora_exsitu'
    )

    op.create_check_constraint(
        'ck_t_sowing_depth_positive',
        't_sowing',
        'depth IS NULL OR depth > 0',
        schema='pr_conservation_flora_exsitu'
    )

    op.create_check_constraint(
        'ck_t_sowing_initial_count_positive',
        't_sowing',
        'initial_count IS NULL OR initial_count > 0',
        schema='pr_conservation_flora_exsitu'
    )

    op.create_check_constraint(
        'ck_t_sowing_replicate_count_positive',
        't_sowing',
        'replicate_count IS NULL OR replicate_count > 0',
        schema='pr_conservation_flora_exsitu'
    )


def downgrade():
    op.drop_constraint(
        'ck_t_sowing_replicate_count_positive',
        't_sowing',
        schema='pr_conservation_flora_exsitu',
        type_='check'
    )

    op.drop_constraint(
        'ck_t_sowing_initial_count_positive',
        't_sowing',
        schema='pr_conservation_flora_exsitu',
        type_='check'
    )

    op.drop_constraint(
        'ck_t_sowing_depth_positive',
        't_sowing',
        schema='pr_conservation_flora_exsitu',
        type_='check'
    )

    op.drop_constraint(
        'ck_t_sowing_end_date_after_start_date',
        't_sowing',
        schema='pr_conservation_flora_exsitu',
        type_='check'
    )

    op.drop_constraint(
        'uq_t_sowing_code',
        't_sowing',
        schema='pr_conservation_flora_exsitu',
        type_='unique'
    )

    op.alter_column(
        't_sowing',
        'code',
        existing_type=sa.String(length=50),
        nullable=True,
        schema='pr_conservation_flora_exsitu'
    )

    op.alter_column(
        't_sowing',
        'id_actor',
        existing_type=sa.Integer(),
        nullable=False,
        schema='pr_conservation_flora_exsitu'
    )

    op.alter_column(
        't_sowing',
        'id_storage',
        existing_type=sa.Integer(),
        nullable=False,
        schema='pr_conservation_flora_exsitu'
    )