from geonature.utils.env import db
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from utils_flask_sqla.serializers import serializable
from utils_flask_sqla_geo.serializers import geoserializable
from ref_geo.models import LAreas
from pypnusershub.db.models import User
from datetime import datetime
from pypnnomenclature.models import TNomenclatures


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
    place_remarks = db.Column(db.Text)
    remarks = db.Column(db.Text)
    geom = db.Column(Geometry("GEOMETRY", 2154))
    id_area_type = db.Column(
        db.Integer,
        db.ForeignKey(
           "ref_geo.bib_areas_types.id_type",
            ondelete="NULL"
        ),
    )
    id_area = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_geo.l_areas.id_area",
            ondelete="NULL"
        ),
    )
    id_geographical_precision  = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    precision = db.Column(
        db.Integer
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
    slope = db.Column(
        db.Integer
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
        nullable=False,
        default=datetime.utcnow,
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
    materials = db.relationship('TMaterial', backref='harvest')

    def to_dic(self):
        return {
            "id_harvest": self.id_harvest,
            "date_start": self.date_start,
            "date_end": self.date_end
        }

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
class TMaterial(db.Model):
    __tablename__ = 't_material'
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
        nullable=False,
        unique=True,
    )
    id_material_parent = db.Column(
        db.Integer,
        db.ForeignKey(
            "pr_conservation_flora_exsitu.t_material.id_material",
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
    id_material_type = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
    )
    id_material_quality = db.Column(
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
    remarks = db.Column(db.Text)
    code_cultural_bank = db.Column(
        db.Integer,
    )
    sample_foot_nb = db.Column(db.Integer)
    is_soil_sampling = db.Column(
        db.Boolean,
        default=False
    )
    has_hybridation_risk = db.Column(db.Boolean)
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
        nullable=False,
        default=datetime.utcnow,
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

    seeds = db.relationship('TMaterielSeed', uselist=False, backref='material')

    def to_dic(self):
        return {
            "id_material": self.id_material,
            "code_material": self.code_material,
            "id_material_type": self.id_material_type,
            "id_material_quality": self.id_material_quality,
            "id_harvest": self.id_harvest,
            "sample_foot_nb": self.sample_foot_nb,
            "id_foot_counting_class": self.id_foot_counting_class,
            "id_method_sample": self.id_method_sample,
            "is_soil_sampling": self.is_soil_sampling,
            "remarks": self.remarks,
            "id_phenology_1": self.id_phenology_1,
            "id_phenology_2": self.id_phenology_2,
            "has_hybridation_risk": self.has_hybridation_risk
        }


@serializable
class CorMaterialTaxon(db.Model):
    __tablename__ = 'cor_material_taxon'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_material  = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_material.id_material"),
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

@serializable
class TMaterielSeed(db.Model):
    __tablename__ = 't_material_seed'
    __table_args__ = (
        sa.UniqueConstraint('id_material'),
        {"schema": "pr_conservation_flora_exsitu"}
    )
    id_seed = db.Column(
        db.Integer,
        primary_key=True
    )
    id_material = db.Column(
        db.Integer,
        db.ForeignKey(
            "pr_conservation_flora_exsitu.t_material.id_material",
        ),
        nullable=False,
        unique=True
    )
    length = db.Column(db.Numeric)
    width = db.Column(db.Numeric)
    thickness = db.Column(db.Numeric)
    total_count = db.Column(db.Integer)
    total_mass = db.Column(db.Numeric)
    sample_count = db.Column(db.Numeric)
    sample_mass = db.Column(db.Numeric)
    has_photo = db.Column(db.Boolean, default=False)
    remarks = db.Column(db.Text)
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
        nullable=False,
        default=datetime.utcnow,
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

    def to_dic(self):
        return {
            "id_seed": self.id_seed,
            "id_material": self.id_material,
            "length": self.length,
            "width": self.width,
            "thickness": self.thickness,
            "total_count": self.total_count,
            "total_mass": self.total_mass,
            "sample_count": self.sample_count,
            "sample_mass": self.sample_mass,
            "has_photo": self.has_photo,
            "remarks": self.remarks,
        }


@serializable
class TStorage(db.Model):
    __tablename__ = 't_storage'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_storage = db.Column(
        db.Integer,
        primary_key=True
    )
    id_material = db.Column(
        db.Integer,
        db.ForeignKey(
            "pr_conservation_flora_exsitu.t_material.id_material",
        ),
        nullable=False
    )
    id_place = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    id_dry_type = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    initial_quantity = db.Column(db.Integer)
    current_quantity = db.Column(db.Integer)
    remarks = db.Column(db.Text)
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
        nullable=False,
        default=datetime.utcnow,
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

    place = db.relationship("TNomenclatures", foreign_keys=[id_place])
    dry_type = db.relationship("TNomenclatures", foreign_keys=[id_dry_type])
    

@serializable
class TAction(db.Model):
    __tablename__ = 't_action'
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}
    id_action = db.Column(
        db.Integer,
        primary_key=True
    )
    id_storage = db.Column(
        db.Integer,
        db.ForeignKey(
            "pr_conservation_flora_exsitu.t_storage.id_storage",
        ),
        nullable=False
    )
    date_start = db.Column(
        db.DateTime,
        nullable = False,
        server_default = sa.func.now(),
    )
    date_end = db.Column(db.DateTime)
    id_actor = db.Column(
        db.Integer,
        db.ForeignKey(
            "utilisateurs.t_roles.id_role",
            ondelete="NULL",
        ),
    )
    id_action_type = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    quantity = db.Column(db.Integer)
    id_destock = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    id_destination = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    id_humidity_level = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    humidity_rate = db.Column(db.Numeric)
    id_humidity_device = db.Column(
        db.Integer,
        db.ForeignKey(
            "ref_nomenclatures.t_nomenclatures.id_nomenclature",
            ondelete="NULL"
        ),
        nullable=False
    )
    remarks = db.Column(db.Text)
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
        nullable=False,
        default=datetime.utcnow,
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
