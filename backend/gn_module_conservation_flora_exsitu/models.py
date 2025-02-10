from geonature.utils.env import db
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from utils_flask_sqla.serializers import serializable
from utils_flask_sqla_geo.serializers import geoserializable
from ref_geo.models import LAreas
from pypnusershub.db.models import User

@serializable
@geoserializable
class THarvest(db.Model):
    __tablename__ = 't_harvest'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_harvest = db.Column(
        db.Integer,
        primary_key=True,
        unique=True
    )
    id_dataset = db.Column(
        db.Integer,
        nullable=False
    )
    cd_hab = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_habitats.habref.cd_hab",
            ondelete="NULL"
        ),
    )
    id_harvest_type = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    date_start = db.Column(
        db.DateTime,
        nullable = False,
        server_default = sa.func.now(),
    )
    date_end = db.Column(db.DateTime)
    place_comment = db.Column(db.Text)
    comment = db.Column(db.Text)
    geom = db.Column(Geometry("GEOMETRY", 2154))
    location_type = db.Column(
        db.Integer,
        db.ForeignKey(
           "ref_geo.bib_areas_types.id_type",
            ondelete="NULL"
        ),
    )
    location_code = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_geo.l_areas.id_area",
            ondelete="NULL"
        ),
    )
    precision = db.Column(
        db.Integer, 
        default=10
    )
    surface = db.Column(db.Integer)
    altitude = db.Column(db.Integer)
    id_exposition = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    additional_data = db.Column(JSONB)
    meta_create_by = db.Column(
        db.Integer,
        db.ForeignKey(
            "utilisateurs.t_roles.id_role",
            ondelete="NULL",
        ),
    )
    meta_create_date = db.Column(
        db.DateTime,
        server_default=sa.func.now(),
    )
    meta_update_by = db.Column(
        db.Integer,
        db.ForeignKey(
            "utilisateurs.t_roles.id_role",
            ondelete="NULL",
        ),
    )
    meta_update_date = db.Column(
        db.DateTime,
        onupdate=sa.func.now(),
    )
    # Relation avec les observateurs (t_roles via la table de correspondance CorObserverHarvest)
    observers = db.relationship(
        User,  # Utilisation directe de t_role existant
        secondary='pr_conservation_flora_exsitu.cor_harvest_observer',
        backref=db.backref('harvests', lazy='select'),
        lazy='select'
    )
    materials = db.relationship('THarvestMaterial', backref='harvest')

@serializable
class CorHarvestObserver(db.Model):
    __tablename__ = 'cor_harvest_observer'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_observer = db.Column(
        db.Integer,
        db.ForeignKey("utilisateurs.t_roles.id_role"),
        primary_key=True
    )
    id_harvest = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_harvest.id_harvest"),
        primary_key=True
    )
    is_main_observer = db.Column(db.Boolean, default=False)

@serializable
class THarvestMaterial(db.Model):
    __tablename__ = 't_harvest_material'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_material = db.Column(
        db.Integer,
        primary_key=True,
        unique=True,
    )
    uuid_material = db.Column(
        UUID(as_uuid=True),
        server_default=sa.text("uuid_generate_v4()"),
    )
    code_material = db.Column(
        db.String(50),
        nullable=False
    )
    id_parent = db.Column(
        db.Integer,
        db.ForeignKey(
            "pr_conservation_flora_exsitu.t_harvest_material.id_material",
            ondelete="NULL"
        ),
    )
    id_harvest = db.Column(
        db.Integer,
        db.ForeignKey(
            "pr_conservation_flora_exsitu.t_harvest.id_harvest",
            ondelete="NULL"
        ),
    )
    id_harvest_material = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_foot_counting_class = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_method_sample = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_phenology_1 = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_phenology_2 = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    protocole_note = db.Column(db.Text)
    code_cultural_bank = db.Column(
        db.String(20),
    )
    sample_foot_nb = db.Column(db.Integer)
    is_soil_sampling = db.Column(
        db.Boolean,
        default=False
    )
    comment = db.Column(db.Text)

    seeds = db.relationship('TSeed', backref='material')



@serializable
class CorMaterialTaxon(db.Model):
    __tablename__ = 'cor_material_taxon'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_material  = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_harvest_material.id_material"),
        primary_key=True
    )
    cd_nom  = db.Column(
        db.Integer,
        db.ForeignKey(
            "taxonomie.taxref.cd_nom",
            ondelete="NULL",
        ),
        primary_key=True
    )

class TSeed(db.Model):
    __tablename__ = 't_seed'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_seed = db.Column(
        db.Integer,
        primary_key=True
    )
    uuid_seed = db.Column(
        UUID(as_uuid=True),
        server_default=sa.text("uuid_generate_v4()"),
    )
    id_material = db.Column(
        db.Integer,
        db.ForeignKey(
            "pr_conservation_flora_exsitu.t_harvest_material.id_material",
        ),
        nullable=False
    )
    remarks = db.Column(db.Text)
    id_form1 = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_form2 = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_type_atwater = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_seed_quality = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    length = db.Column(db.Float)
    width = db.Column(db.Float)
    thickness = db.Column(db.Float)
    total_mass_g = db.Column(db.Float)
    sample_weight = db.Column(db.Float)
    sample_mass_g = db.Column(db.Float)
    avg_num_seeds = db.Column(db.Float)
    avg_unit_mass = db.Column(db.Float)
    initial_quantity = db.Column(db.Integer)
    current_quantity = db.Column(db.Integer)
    is_photo_observed = db.Column(db.Boolean, default=False)
    pre_dry_start = db.Column(db.DateTime)
    pre_dry_end = db.Column(db.DateTime)
    pre_dry_duration = db.Column(db.Integer)
    is_pre_dry_sorted = db.Column(db.Boolean, default=False)
    pre_dry_tips = db.Column(db.Text)
    dry_start = db.Column(db.DateTime)
    dry_end = db.Column(db.DateTime)
    dry_duration = db.Column(db.Integer)
    is_freeze_dried = db.Column(db.Boolean, default=False)
    packaging_date = db.Column(db.DateTime)
    is_lot_active = db.Column(db.Boolean, default=False)
    lot_status_date = db.Column(db.DateTime)
    id_growth1 = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_growth2 = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_decoration1 = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_decoration2 = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_embryo_type1 = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_embryo_type2 = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    dimension_shape_comment = db.Column(db.Text)
    '''
    A revoir: id_bib_table_location
    '''
    id_bib_table_location = db.Column(
        db.Integer,
        db.ForeignKey(
            "gn_commons.bib_tables_location.id_table_location",
            ondelete="NULL"
        ),
    )
    additional_data = db.Column(JSONB)
    meta_create_by = db.Column(
        db.Integer,
        db.ForeignKey(
            "utilisateurs.t_roles.id_role",
            ondelete="NULL",
        ),
    )
    meta_create_date = db.Column(
        db.DateTime,
        server_default=sa.func.now(),
    )
    meta_update_by = db.Column(
        db.Integer,
        db.ForeignKey(
            "utilisateurs.t_roles.id_role",
            ondelete="NULL",
        ),
    )
    meta_update_date = db.Column(
        db.DateTime,
        onupdate=sa.func.now(),
    )

    stocks = db.relationship('TSeedStock', backref='seed')


@serializable
class TSeedStock(db.Model):
    __tablename__ = 't_seed_stock'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_stock = db.Column(
        db.Integer,
        primary_key=True
    )
    uuid_stock = db.Column(
        UUID(as_uuid=True),
        server_default=sa.text("uuid_generate_v4()"),
    )
    id_seed = db.Column(
        db.Integer,
        db.ForeignKey(
            "pr_conservation_flora_exsitu.t_seed.id_seed",
        ),
        nullable=False
    )
    id_stock_location = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    initial_quantity = db.Column(db.Integer)
    current_quantity = db.Column(db.Integer)
    stock_date = db.Column(db.DateTime)
    stock_mvts = db.relationship('TSeedStockMouvement', backref='stock')
    seed_tablets = db.relationship('TSeedTablet', backref='stock')

@serializable
class TSeedStockMouvement(db.Model):
    __tablename__ = 't_seed_stock_mouvement'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_stock_mvt = db.Column(
        db.Integer,
        primary_key=True
    )
    uuid_stock_mvt = db.Column(
        UUID(as_uuid=True),
        server_default=sa.text("uuid_generate_v4()"),
    )
    id_stock = db.Column(
        db.Integer,
        db.ForeignKey(
            "pr_conservation_flora_exsitu.t_seed_stock.id_stock"
        ),
        nullable=False
    )
    stock_mvt_date = db.Column(db.DateTime)
    id_stock_flow = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature"
        ),
        nullable=False
    )
    quantity = db.Column(db.Integer)
    mvt_comment = db.Column(db.Text)
    role_mvmt =  db.Column(db.String(5))

@serializable
class TSeedTablet(db.Model):
    __tablename__ = 't_seed_tablet'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_seed_tablet = db.Column(
        db.Integer,
        primary_key=True
    )
    uuid_tablet = db.Column(
        UUID(as_uuid=True),
        server_default=sa.text("uuid_generate_v4()"),
    )
    id_stock = db.Column(
        db.Integer,
        db.ForeignKey(
            "pr_conservation_flora_exsitu.t_seed_stock.id_stock"
        ),
        nullable=False
    )
    evaluation_date = db.Column(db.DateTime)
    id_tablet_color = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    tablet_change_date = db.Column(db.DateTime)
    remaks = db.Column(db.Text)