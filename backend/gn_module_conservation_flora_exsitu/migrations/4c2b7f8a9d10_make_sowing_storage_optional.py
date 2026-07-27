"""make sowing storage optional and add sowing constraints

Revision ID: 4c2b7f8a9d10
Revises: 308061920435
Create Date: 2026-04-18 15:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


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

    op.alter_column(
        't_test',
        'id_actor',
        existing_type=sa.Integer(),
        nullable=True,
        schema='pr_conservation_flora_exsitu'
    )

    op.alter_column(
        't_action',
        'id_actor',
        existing_type=sa.Integer(),
        nullable=True,
        schema='pr_conservation_flora_exsitu'
    )

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Jardin alpin',
            label_fr = 'Jardin alpin'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SOWING_LOCATION'
        )
        AND cd_nomenclature = 'jar';
    """)

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Sol prélevé in-situ',
            label_fr = 'Sol prélevé in-situ'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SOWING_SUBSTRATE'
        )
        AND label_default = 'Sol in situ';
    """)

    op.execute("""
        DELETE FROM ref_nomenclatures.t_nomenclatures
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_WATERING_METHOD'
        )
        AND cd_nomenclature = 'aut';
    """)

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            hierarchy = '.001'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'scar';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            cd_nomenclature = 'pret',
            mnemonique = 'pretraitement',
            label_default = 'Prétraitement',
            label_fr = 'Prétraitement',
            definition_default = 'Action de préparation des semences avant traitement ou germination',
            definition_fr = 'Action de préparation des semences avant traitement ou germination',
            hierarchy = '.002'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'ster';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            hierarchy = '.003'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'strat';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            hierarchy = '.004'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'svr';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            hierarchy = '.005'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'synth';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            hierarchy = '.006'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'tra';
    """)

    op.execute("""
        UPDATE ref_nomenclatures.bib_nomenclatures_types
        SET
            label_default = 'Produit prétraitement',
            label_fr = 'Produit prétraitement',
            definition_default = 'Nomenclature des produits utilisés pour le prétraitement des semences.',
            definition_fr = 'Nomenclature des produits utilisés pour le prétraitement des semences.'
        WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT';

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'naclo', 'hypochloriteSodium', 'Hypochlorite de sodium (NaClO)',
               'Produit utilisé pour le prétraitement des semences',
               'Hypochlorite de sodium (NaClO)',
               'Produit utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.001'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        AND NOT EXISTS (
            SELECT 1
            FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'naclo'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'h2so4', 'acideSulfurique', 'Acide sulfurique (H₂SO₄)',
               'Produit utilisé pour le prétraitement des semences',
               'Acide sulfurique (H₂SO₄)',
               'Produit utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.005'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        AND NOT EXISTS (
            SELECT 1
            FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'h2so4'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'crypt', 'cryptonol', 'Cryptonol',
               'Produit utilisé pour le prétraitement des semences',
               'Cryptonol',
               'Produit utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.006'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        AND NOT EXISTS (
            SELECT 1
            FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'crypt'
        );

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Hypochlorite de sodium (NaClO)',
            label_fr = 'Hypochlorite de sodium (NaClO)',
            definition_default = 'Produit utilisé pour le prétraitement des semences',
            definition_fr = 'Produit utilisé pour le prétraitement des semences',
            hierarchy = '.001'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        )
        AND cd_nomenclature = 'naclo';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Hypochlorite de calcium (Ca(ClO)₂)',
            label_fr = 'Hypochlorite de calcium (Ca(ClO)₂)',
            definition_default = 'Produit utilisé pour le prétraitement des semences',
            definition_fr = 'Produit utilisé pour le prétraitement des semences',
            hierarchy = '.002'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        )
        AND cd_nomenclature = 'cacl2';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Éthanol (C₂H₅OH)',
            label_fr = 'Éthanol (C₂H₅OH)',
            definition_default = 'Produit utilisé pour le prétraitement des semences',
            definition_fr = 'Produit utilisé pour le prétraitement des semences',
            hierarchy = '.003'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        )
        AND cd_nomenclature = 'c2h5oh';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Peroxyde d’hydrogène (H₂O₂)',
            label_fr = 'Peroxyde d’hydrogène (H₂O₂)',
            definition_default = 'Produit utilisé pour le prétraitement des semences',
            definition_fr = 'Produit utilisé pour le prétraitement des semences',
            hierarchy = '.004'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        )
        AND cd_nomenclature = 'h2o2';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Acide sulfurique (H₂SO₄)',
            label_fr = 'Acide sulfurique (H₂SO₄)',
            definition_default = 'Produit utilisé pour le prétraitement des semences',
            definition_fr = 'Produit utilisé pour le prétraitement des semences',
            hierarchy = '.005'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        )
        AND cd_nomenclature = 'h2so4';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Cryptonol',
            label_fr = 'Cryptonol',
            definition_default = 'Produit utilisé pour le prétraitement des semences',
            definition_fr = 'Produit utilisé pour le prétraitement des semences',
            hierarchy = '.006'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        )
        AND cd_nomenclature = 'crypt';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Autre',
            label_fr = 'Autre',
            definition_default = 'Autre produit utilisé pour le prétraitement des semences',
            definition_fr = 'Autre produit utilisé pour le prétraitement des semences',
            hierarchy = '.007'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        )
        AND cd_nomenclature = 'aut';
        UPDATE ref_nomenclatures.bib_nomenclatures_types
        SET
            label_default = 'Liquide prétraitement',
            label_fr = 'Liquide prétraitement',
            definition_default = 'Nomenclature des liquides utilisés pour le prétraitement des semences.',
            definition_fr = 'Nomenclature des liquides utilisés pour le prétraitement des semences.'
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID';

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'edis', 'eauDistillee', 'Eau distillée',
               'Liquide utilisé pour le prétraitement des semences',
               'Eau distillée',
               'Liquide utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.001'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'edis'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'edem', 'eauDemineralisee', 'Eau déminéralisée',
               'Liquide utilisé pour le prétraitement des semences',
               'Eau déminéralisée',
               'Liquide utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.003'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'edem'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'erob', 'eauRobinet', 'Eau du robinet',
               'Liquide utilisé pour le prétraitement des semences',
               'Eau du robinet',
               'Liquide utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.005'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'erob'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'gr24', 'strigolactoneGR24', 'Strigolactone (GR24)',
               'Liquide utilisé pour le prétraitement des semences',
               'Strigolactone (GR24)',
               'Liquide utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.007'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'gr24'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'pvpp', 'polyvinylpolypyrrolidone', 'Polyvinylpolypyrrolidone (PVPP)',
               'Liquide utilisé pour le prétraitement des semences',
               'Polyvinylpolypyrrolidone (PVPP)',
               'Liquide utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.008'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'pvpp'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'kine', 'kinetine', 'Kinétine',
               'Liquide utilisé pour le prétraitement des semences',
               'Kinétine',
               'Liquide utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.009'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'kine'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'exrac', 'imbibitionExtraitRacinaire', 'Liquide d’imbibition (extrait racinaire)',
               'Liquide utilisé pour le prétraitement des semences',
               'Liquide d’imbibition (extrait racinaire)',
               'Liquide utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.010'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'exrac'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'exrad', 'imbibitionExtraitRadiculaire', 'Liquide d’imbibition (extrait radiculaire)',
               'Liquide utilisé pour le prétraitement des semences',
               'Liquide d’imbibition (extrait radiculaire)',
               'Liquide utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.011'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'exrad'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'exbouti', 'imbibitionExtraitBouture', 'Liquide d’imbibition (extrait de bouture)',
               'Liquide utilisé pour le prétraitement des semences',
               'Liquide d’imbibition (extrait de bouture)',
               'Liquide utilisé pour le prétraitement des semences',
               'conservation_flora_exsitu', '.012'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'exbouti'
        );

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Eau distillée', label_fr = 'Eau distillée', hierarchy = '.001'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'edis';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Eau osmosée', label_fr = 'Eau osmosée', hierarchy = '.002'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'eosm';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Eau déminéralisée', label_fr = 'Eau déminéralisée', hierarchy = '.003'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'edem';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Eau purifiée', label_fr = 'Eau purifiée', hierarchy = '.004'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'epuri';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Eau du robinet', label_fr = 'Eau du robinet', hierarchy = '.005'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'erob';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Eau', label_fr = 'Eau', hierarchy = '.006'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'eau';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Strigolactone (GR24)', label_fr = 'Strigolactone (GR24)', hierarchy = '.007'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'gr24';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Polyvinylpolypyrrolidone (PVPP)', label_fr = 'Polyvinylpolypyrrolidone (PVPP)', hierarchy = '.008'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'pvpp';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Kinétine', label_fr = 'Kinétine', hierarchy = '.009'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'kine';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Liquide d’imbibition (extrait racinaire)', label_fr = 'Liquide d’imbibition (extrait racinaire)', hierarchy = '.010'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'exrac';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Liquide d’imbibition (extrait radiculaire)', label_fr = 'Liquide d’imbibition (extrait radiculaire)', hierarchy = '.011'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'exrad';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Liquide d’imbibition (extrait de bouture)', label_fr = 'Liquide d’imbibition (extrait de bouture)', hierarchy = '.012'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'exbouti';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET label_default = 'Autre', label_fr = 'Autre', hierarchy = '.013'
        WHERE id_type = (SELECT id_type FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique = 'CFE_STERILIZATION_LIQUID')
        AND cd_nomenclature = 'aut';
    """)

    op.execute("""
        UPDATE ref_nomenclatures.bib_nomenclatures_types
        SET
            label_default = 'Liquide traitement',
            label_fr = 'Liquide traitement',
            definition_default = 'Nomenclature des liquides utilisés pour le traitement des semences.',
            definition_fr = 'Nomenclature des liquides utilisés pour le traitement des semences.'
        WHERE mnemonique = 'CFE_LIQUID_TREATMENT';

        WITH liquid_type AS (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_LIQUID_TREATMENT'
        ),
        expected_values AS (
            SELECT *
            FROM (
                VALUES
                    ('acg', 'acideGibberellique', 'Acide gibbérellique (GA₃)', 'Liquide utilisé pour le traitement des semences', '.001'),
                    ('eadi', 'eauDistillee', 'Eau distillée', 'Liquide utilisé pour le traitement des semences', '.002'),
                    ('eaos', 'eauOsmosee', 'Eau osmosée', 'Liquide utilisé pour le traitement des semences', '.003'),
                    ('eade', 'eauDemineralisee', 'Eau déminéralisée', 'Liquide utilisé pour le traitement des semences', '.004'),
                    ('epuri', 'eauPurifiee', 'Eau purifiée', 'Liquide utilisé pour le traitement des semences', '.005'),
                    ('eaur', 'eauRobinet', 'Eau du robinet', 'Liquide utilisé pour le traitement des semences', '.006'),
                    ('eau', 'eau', 'Eau', 'Liquide utilisé pour le traitement des semences', '.007'),
                    ('nitp', 'nitratePotassium', 'Nitrate de potassium (KNO3)', 'Liquide utilisé pour le traitement des semences', '.008'),
                    ('stri', 'strigolactoneGR24', 'Strigolactone (GR24)', 'Liquide utilisé pour le traitement des semences', '.009'),
                    ('liqrac', 'imbibitionExtraitRacinaire', 'Liquide d’imbibition (extrait racinaire)', 'Liquide utilisé pour le traitement des semences', '.010'),
                    ('liqimb', 'imbibitionJus', 'Liquide d’imbibition (jus)', 'Liquide utilisé pour le traitement des semences', '.011'),
                    ('poh3', 'potentielHydriqueMoins03', 'Potentiel hydrique : -0.3 mpa', 'Liquide utilisé pour le traitement des semences', '.012'),
                    ('poh6', 'potentielHydriqueMoins06', 'Potentiel hydrique : -0.6 mpa', 'Liquide utilisé pour le traitement des semences', '.013'),
                    ('aut', 'autre', 'Autre', 'Autre liquide utilisé pour le traitement des semences', '.014'),
                    ('fonbac', 'fongicideBactericide', 'Fongicide/Bactéricide', 'Liquide utilisé pour le traitement des semences', '.015'),
                    ('ins', 'insecticide', 'Insecticide', 'Liquide utilisé pour le traitement des semences', '.016')
            ) AS v(cd_nomenclature, mnemonique, label, definition, hierarchy)
        )
        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT
            lt.id_type,
            ev.cd_nomenclature,
            ev.mnemonique,
            ev.label,
            ev.definition,
            ev.label,
            ev.definition,
            'conservation_flora_exsitu',
            ev.hierarchy
        FROM liquid_type lt
        CROSS JOIN expected_values ev
        WHERE NOT EXISTS (
            SELECT 1
            FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = lt.id_type
            AND n.cd_nomenclature = ev.cd_nomenclature
        );

        WITH liquid_type AS (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_LIQUID_TREATMENT'
        ),
        expected_values AS (
            SELECT *
            FROM (
                VALUES
                    ('acg', 'acideGibberellique', 'Acide gibbérellique (GA₃)', 'Liquide utilisé pour le traitement des semences', '.001'),
                    ('eadi', 'eauDistillee', 'Eau distillée', 'Liquide utilisé pour le traitement des semences', '.002'),
                    ('eaos', 'eauOsmosee', 'Eau osmosée', 'Liquide utilisé pour le traitement des semences', '.003'),
                    ('eade', 'eauDemineralisee', 'Eau déminéralisée', 'Liquide utilisé pour le traitement des semences', '.004'),
                    ('epuri', 'eauPurifiee', 'Eau purifiée', 'Liquide utilisé pour le traitement des semences', '.005'),
                    ('eaur', 'eauRobinet', 'Eau du robinet', 'Liquide utilisé pour le traitement des semences', '.006'),
                    ('eau', 'eau', 'Eau', 'Liquide utilisé pour le traitement des semences', '.007'),
                    ('nitp', 'nitratePotassium', 'Nitrate de potassium (KNO3)', 'Liquide utilisé pour le traitement des semences', '.008'),
                    ('stri', 'strigolactoneGR24', 'Strigolactone (GR24)', 'Liquide utilisé pour le traitement des semences', '.009'),
                    ('liqrac', 'imbibitionExtraitRacinaire', 'Liquide d’imbibition (extrait racinaire)', 'Liquide utilisé pour le traitement des semences', '.010'),
                    ('liqimb', 'imbibitionJus', 'Liquide d’imbibition (jus)', 'Liquide utilisé pour le traitement des semences', '.011'),
                    ('poh3', 'potentielHydriqueMoins03', 'Potentiel hydrique : -0.3 mpa', 'Liquide utilisé pour le traitement des semences', '.012'),
                    ('poh6', 'potentielHydriqueMoins06', 'Potentiel hydrique : -0.6 mpa', 'Liquide utilisé pour le traitement des semences', '.013'),
                    ('aut', 'autre', 'Autre', 'Autre liquide utilisé pour le traitement des semences', '.014'),
                    ('fonbac', 'fongicideBactericide', 'Fongicide/Bactéricide', 'Liquide utilisé pour le traitement des semences', '.015'),
                    ('ins', 'insecticide', 'Insecticide', 'Liquide utilisé pour le traitement des semences', '.016')
            ) AS v(cd_nomenclature, mnemonique, label, definition, hierarchy)
        )
        UPDATE ref_nomenclatures.t_nomenclatures n
        SET
            mnemonique = ev.mnemonique,
            label_default = ev.label,
            label_fr = ev.label,
            definition_default = ev.definition,
            definition_fr = ev.definition,
            source = 'conservation_flora_exsitu',
            hierarchy = ev.hierarchy
        FROM liquid_type lt
        JOIN expected_values ev ON TRUE
        WHERE n.id_type = lt.id_type
        AND n.cd_nomenclature = ev.cd_nomenclature;
    """)

    op.execute("""
        WITH treatment_type AS (
        SELECT id_type
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_LIQUID_TREATMENT'
        ),
        aut_values AS (
        SELECT
        n.id_nomenclature,
        MIN(n.id_nomenclature) OVER () AS keep_id
        FROM ref_nomenclatures.t_nomenclatures n
        JOIN treatment_type t ON t.id_type = n.id_type
        WHERE n.label_fr = 'Autre'
        OR n.cd_nomenclature = 'aut'
        ),
        duplicate_aut_values AS (
        SELECT id_nomenclature, keep_id
        FROM aut_values
        WHERE id_nomenclature <> keep_id
        )
        UPDATE pr_conservation_flora_exsitu.t_action a
        SET id_liquid_treatment = d.keep_id
        FROM duplicate_aut_values d
        WHERE a.id_liquid_treatment = d.id_nomenclature;
        
        WITH treatment_type AS (
        SELECT id_type
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_LIQUID_TREATMENT'
        ),
        aut_values AS (
        SELECT
        n.id_nomenclature,
        MIN(n.id_nomenclature) OVER () AS keep_id
        FROM ref_nomenclatures.t_nomenclatures n
        JOIN treatment_type t ON t.id_type = n.id_type
        WHERE n.label_fr = 'Autre'
        OR n.cd_nomenclature = 'aut'
        )
        DELETE FROM ref_nomenclatures.t_nomenclatures n
        USING aut_values a
        WHERE n.id_nomenclature = a.id_nomenclature
        AND a.id_nomenclature <> a.keep_id;
    """)

    op.execute("""
        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type,
            cd_nomenclature,
            mnemonique,
            label_default,
            definition_default,
            label_fr,
            definition_fr,
            source,
            hierarchy
        )
        SELECT
            id_type,
            'aut',
            'autre',
            'Autre',
            'Autre support de germination',
            'Autre',
            'Autre support de germination',
            'conservation_flora_exsitu',
            '.004'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_TG_SUPPORT'
        AND NOT EXISTS (
            SELECT 1
            FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'aut'
        );

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.001'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_TG_SUPPORT'
        )
        AND cd_nomenclature = 'bpet';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.002'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_TG_SUPPORT'
        )
        AND cd_nomenclature = 'psto';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.003'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_TG_SUPPORT'
        )
        AND cd_nomenclature = 'ter';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.004'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_TG_SUPPORT'
        )
        AND cd_nomenclature = 'aut';
    """)

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.001'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_TEST_SUBSTRATE'
        )
        AND cd_nomenclature = 'ppf';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.002'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_TEST_SUBSTRATE'
        )
        AND cd_nomenclature = 'sbl';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.003'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_TEST_SUBSTRATE'
        )
        AND cd_nomenclature = 'tera';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.004'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_TEST_SUBSTRATE'
        )
        AND cd_nomenclature = 'torb';
    """)

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Partielle',
            label_fr = 'Partielle'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SCARIFICATION_MEC'
        )
        AND cd_nomenclature = 'par';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Totale',
            label_fr = 'Totale'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SCARIFICATION_MEC'
        )
        AND cd_nomenclature = 'tot';
    """)

        # Création de la table Culture
    op.create_table(
        't_culture',

        sa.Column(
            'id_culture',
            sa.Integer(),
            autoincrement=True,
            nullable=False
        ),

        sa.Column(
            'code_culture',
            sa.String(length=50),
            nullable=False
        ),

        sa.Column(
            'id_material',
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            'id_sowing',
            sa.Integer(),
            nullable=True
        ),

        sa.Column(
            'id_test',
            sa.Integer(),
            nullable=True
        ),

        sa.Column(
            'id_actor',
            sa.Integer(),
            nullable=True
        ),

        sa.Column(
            'date_start',
            sa.DateTime(),
            nullable=False
        ),

        sa.Column(
            'date_end',
            sa.DateTime(),
            nullable=True
        ),

        sa.Column(
            'remarks',
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            'additional_data',
            JSONB(),
            nullable=True
        ),

        sa.Column(
            'meta_create_by',
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            'meta_create_date',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('now()')
        ),

        sa.Column(
            'meta_update_by',
            sa.Integer(),
            nullable=True
        ),

        sa.Column(
            'meta_update_date',
            sa.DateTime(),
            nullable=True
        ),

        sa.PrimaryKeyConstraint(
            'id_culture',
            name='pk_t_culture'
        ),

        sa.UniqueConstraint(
            'code_culture',
            name='uq_t_culture_code_culture'
        ),

        sa.CheckConstraint(
            'date_end IS NULL OR date_end >= date_start',
            name='ck_t_culture_end_date_after_start_date'
        ),

        sa.ForeignKeyConstraint(
            ['id_material'],
            [
                'pr_conservation_flora_exsitu.'
                't_material.id_material'
            ],
            name='fk_t_culture_id_material'
        ),

        sa.ForeignKeyConstraint(
            ['id_sowing'],
            [
                'pr_conservation_flora_exsitu.'
                't_sowing.id_sowing'
            ],
            name='fk_t_culture_id_sowing'
        ),

        sa.ForeignKeyConstraint(
            ['id_test'],
            [
                'pr_conservation_flora_exsitu.'
                't_test.id_test'
            ],
            name='fk_t_culture_id_test'
        ),

        sa.ForeignKeyConstraint(
            ['id_actor'],
            ['utilisateurs.t_roles.id_role'],
            name='fk_t_culture_id_actor'
        ),

        sa.ForeignKeyConstraint(
            ['meta_create_by'],
            ['utilisateurs.t_roles.id_role'],
            name='fk_t_culture_meta_create_by'
        ),

        sa.ForeignKeyConstraint(
            ['meta_update_by'],
            ['utilisateurs.t_roles.id_role'],
            name='fk_t_culture_meta_update_by'
        ),

        schema='pr_conservation_flora_exsitu'
    )

    # Liaison entre les actions et la Culture
    op.add_column(
        't_action',
        sa.Column(
            'id_culture',
            sa.Integer(),
            nullable=True
        ),
        schema='pr_conservation_flora_exsitu'
    )

    op.create_foreign_key(
        'fk_t_action_id_culture',
        't_action',
        't_culture',
        ['id_culture'],
        ['id_culture'],
        source_schema='pr_conservation_flora_exsitu',
        referent_schema='pr_conservation_flora_exsitu',
        ondelete='SET NULL'
    )
    
def downgrade():

    op.drop_constraint(
        'fk_t_action_id_culture',
        't_action',
        schema='pr_conservation_flora_exsitu',
        type_='foreignkey'
    )

    op.drop_column(
        't_action',
        'id_culture',
        schema='pr_conservation_flora_exsitu'
    )
    
    op.execute("""
        DROP TABLE IF EXISTS
        pr_conservation_flora_exsitu.t_culture;
    """)

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Jardin',
            label_fr = 'Jardin'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SOWING_LOCATION'
        )
        AND cd_nomenclature = 'jar';
    """)

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Sol in situ',
            label_fr = 'Sol in situ'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SOWING_SUBSTRATE'
        )
        AND label_default = 'Sol prélevé in-situ';
    """)

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

    op.alter_column(
        't_action',
        'id_actor',
        existing_type=sa.Integer(),
        nullable=False,
        schema='pr_conservation_flora_exsitu'
    )

    op.alter_column(
        't_test',
        'id_actor',
        existing_type=sa.Integer(),
        nullable=False,
        schema='pr_conservation_flora_exsitu'
    )

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Mécanique',
            label_fr = 'Mécanique',
            hierarchy = '.001'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SCARIFICATION_TYPE'
        )
        AND cd_nomenclature = 'mec';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.002'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SCARIFICATION_TYPE'
        )
        AND cd_nomenclature = 'chi';
    """)

    op.execute("""
        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type,
            cd_nomenclature,
            mnemonique,
            label_default,
            definition_default,
            label_fr,
            definition_fr,
            source,
            hierarchy
        )
        SELECT
            id_type,
            'aut',
            'autre',
            'Autre',
            'Méthode d''irrigation différente des méthodes habituelles',
            'Autre',
            'Méthode d''irrigation différente des méthodes habituelles',
            'conservation_flora_exsitu',
            '.003'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_WATERING_METHOD'
            AND NOT EXISTS (
                SELECT 1
                FROM ref_nomenclatures.t_nomenclatures
                WHERE id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
                AND cd_nomenclature = 'aut'
        );
    """)

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            cd_nomenclature = 'ster',
            mnemonique = 'sterilisation',
            label_default = 'Stérilisation',
            label_fr = 'Stérilisation',
            definition_default = 'Technique destinée à détruire tout germe microbien',
            definition_fr = 'Technique destinée à détruire tout germe microbien',
            hierarchy = '.001'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'pret';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.002'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'scar';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.003'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'strat';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.004'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'tra';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.005'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'svr';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.006'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_ACTION_TYPE'
        )
        AND cd_nomenclature = 'synth';
    """)

    op.execute("""
        UPDATE ref_nomenclatures.bib_nomenclatures_types
        SET
            label_default = 'Produit de stérilisation',
            label_fr = 'Produit de stérilisation',
            definition_default = 'Nomenclature des produits utilisés pour la stérilisation des semences.',
            definition_fr = 'Nomenclature des produits utilisés pour la stérilisation des semences.'
        WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Hypochlorite de calcium (Ca(ClO)₂)',
            label_fr = 'Hypochlorite de calcium (Ca(ClO)₂)',
            definition_default = 'Désinfectant chimique à base de chlore utilisé sur les graines',
            definition_fr = 'Désinfectant chimique à base de chlore utilisé sur les graines',
            hierarchy = '.002'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        )
        AND cd_nomenclature = 'cacl2';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Éthanol (C₂H₅OH)',
            label_fr = 'Éthanol (C₂H₅OH)',
            definition_default = 'Alcool utilisé comme désinfectant pour les semences',
            definition_fr = 'Alcool utilisé comme désinfectant pour les semences',
            hierarchy = '.003'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        )
        AND cd_nomenclature = 'c2h5oh';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Peroxyde d’hydrogène (H₂O₂)',
            label_fr = 'Peroxyde d’hydrogène (H₂O₂)',
            definition_default = 'Oxydant puissant utilisé pour la stérilisation des semences',
            definition_fr = 'Oxydant puissant utilisé pour la stérilisation des semences',
            hierarchy = '.004'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        )
        AND cd_nomenclature = 'h2o2';

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'naclo', 'hypochloriteSodium', 'Hypochlorite de sodium (NaClO)',
               'Agent stérilisant utilisé pour éliminer les microorganismes',
               'Hypochlorite de sodium (NaClO)',
               'Agent stérilisant utilisé pour éliminer les microorganismes',
               'conservation_flora_exsitu', '.001'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'naclo'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'h2so4', 'acideSulfurique', 'Acide sulfurique (H₂SO₄)',
               'Acide utilisé pour éliminer les pathogènes des semences',
               'Acide sulfurique (H₂SO₄)',
               'Acide utilisé pour éliminer les pathogènes des semences',
               'conservation_flora_exsitu', '.005'
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'h2so4'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'crypt', 'cryptonol', 'Cryptonol (fongicide)',
               'Fongicide utilisé pour stériliser les semences',
               'Cryptonol (fongicide)',
               'Fongicide utilisé pour stériliser les semences',
               'conservation_flora_exsitu', '.006'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_PRODUCT'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'crypt'
        );

        UPDATE ref_nomenclatures.bib_nomenclatures_types
        SET
            label_default = 'Liquide de stérilisation',
            label_fr = 'Liquide de stérilisation',
            definition_default = 'Nomenclature des liquides utilisés pour la stérilisation des semences.',
            definition_fr = 'Nomenclature des liquides utilisés pour la stérilisation des semences.'
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID';

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'exbouti', 'imbibitionExtraitBouture', 'Liquide d’imbibition (extrait de bouture)',
               'Extrait végétal utilisé pour favoriser la germination',
               'Liquide d’imbibition (extrait de bouture)',
               'Extrait végétal utilisé pour favoriser la germination',
               'conservation_flora_exsitu', '.0012'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'exbouti'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'exrac', 'imbibitionExtraitRacinaire', 'Liquide d’imbibition (extrait racinaire)',
               'Extrait de racines utilisé pour stimuler la germination',
               'Liquide d’imbibition (extrait racinaire)',
               'Extrait de racines utilisé pour stimuler la germination',
               'conservation_flora_exsitu', '.0010'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'exrac'
        );

        INSERT INTO ref_nomenclatures.t_nomenclatures (
            id_type, cd_nomenclature, mnemonique, label_default, definition_default,
            label_fr, definition_fr, source, hierarchy
        )
        SELECT id_type, 'exrad', 'imbibitionExtraitRadiculaire', 'Liquide d’imbibition (extrait radiculaire)',
               'Solution issue des racines utilisée pour l’imbibition',
               'Liquide d’imbibition (extrait radiculaire)',
               'Solution issue des racines utilisée pour l’imbibition',
               'conservation_flora_exsitu', '.0011'
        FROM ref_nomenclatures.bib_nomenclatures_types
        WHERE mnemonique = 'CFE_STERILIZATION_LIQUID'
        AND NOT EXISTS (
            SELECT 1 FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.bib_nomenclatures_types.id_type
            AND n.cd_nomenclature = 'exrad'
        );
    """)

    op.execute("""
        UPDATE ref_nomenclatures.bib_nomenclatures_types
        SET
            label_default = 'Traitement liquide',
            label_fr = 'Traitement liquide',
            definition_default = 'Nomenclature des liquides utilisés pour les traitements des semences.',
            definition_fr = 'Nomenclature des liquides utilisés pour les traitements des semences.'
        WHERE mnemonique = 'CFE_LIQUID_TREATMENT';
    """)

    op.execute("""
        DELETE FROM ref_nomenclatures.t_nomenclatures AS n
        WHERE n.id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_TG_SUPPORT'
        )
        AND n.cd_nomenclature = 'aut'
        AND NOT EXISTS (
            SELECT 1
            FROM pr_conservation_flora_exsitu.t_test AS t
            WHERE t.id_support = n.id_nomenclature
        );
    """)

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Mécanique ',
            label_fr = 'Mécanique ',
            hierarchy = '.002'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SCARIFICATION_TYPE'
        )
        AND cd_nomenclature = 'mec';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET hierarchy = '.001'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SCARIFICATION_TYPE'
        )
        AND cd_nomenclature = 'chi';
    """)

    op.execute("""
        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Partielle',
            label_fr = 'Scarification partielle'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SCARIFICATION_MEC'
        )
        AND cd_nomenclature = 'par';

        UPDATE ref_nomenclatures.t_nomenclatures
        SET
            label_default = 'Totale',
            label_fr = 'Scarification totale'
        WHERE id_type = (
            SELECT id_type
            FROM ref_nomenclatures.bib_nomenclatures_types
            WHERE mnemonique = 'CFE_SCARIFICATION_MEC'
        )
        AND cd_nomenclature = 'tot';
    """)