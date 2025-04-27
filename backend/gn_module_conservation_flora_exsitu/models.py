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
    sample_foot_count = db.Column(db.Integer)
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
            "sample_foot_count": self.sample_foot_count,
            "id_foot_counting_class": self.id_foot_counting_class,
            "id_method_sample": self.id_method_sample,
            "is_soil_sampling": self.is_soil_sampling,
            "remarks": self.remarks,
            "id_phenology_1": self.id_phenology_1,
            "id_phenology_2": self.id_phenology_2,
            "has_hybridation_risk": self.has_hybridation_risk,
            "additional_data": self.additional_data
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
            "additional_data": self.additional_data,
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
    id_dry_type = db.Column(
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

    def to_dic(self):
        return {
            "id_storage": self.id_storage,
            "id_material": self.id_material,
            "id_place": self.id_place,
            "id_action_type": self.id_action_type,
            "quantity": self.quantity,
            "date_start": self.date_start.isoformat() if self.date_start else None,
            "date_end": self.date_end.isoformat() if self.date_end else None,
            "id_actor": self.id_actor,
            "id_humidity_level": self.id_humidity_level,
            "id_destock": self.id_destock,
            "humidity_rate": self.humidity_rate,
            "id_humidity_device": self.id_humidity_device,
            "id_dry_type": self.id_dry_type,
            "id_destination": self.id_destination,
            "remarks": self.remarks,
            "additional_data": self.additional_data,
        }


@serializable
class TSowing(db.Model):
    __tablename__ = "t_sowing"
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}

    id_sowing = db.Column(db.Integer, primary_key=True, unique=True)
    
    id_storage = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_storage.id_storage", ondelete="NO ACTION"),
        nullable=False
    )

    contract = db.Column(db.String(255))
    sowing_number = db.Column(db.String(255))
    seed_number = db.Column(db.String(255))
    seed_preparation = db.Column(db.Text)
    packaging = db.Column(db.Integer, nullable=False)
    substrate = db.Column(db.Integer, nullable=False)

    id_watering_method = db.Column(
        db.Integer,
        db.ForeignKey("ref_nomenclatures.t_nomenclatures.id_nomenclature"),
        nullable=False
    )

    id_sowing_method = db.Column(
        db.Integer,
        db.ForeignKey("ref_nomenclatures.t_nomenclatures.id_nomenclature")
    )

    sowing_depth_mm = db.Column(db.String(255))
    date_start = db.Column(db.Date)
    date_end = db.Column(db.Date)
    sowing_treatment = db.Column(db.Text)
    remarks = db.Column(db.Text)

    stock = db.relationship("TStorage", backref=db.backref("sowings", lazy="select"))

    def to_dic(self):
        return {
            "id_sowing": self.id_sowing,
            "contract": self.contract,
            "sowing_number": self.sowing_number,
            "date_start": self.date_start,
            "date_end": self.date_end
        }

@serializable
class TSowingReplicates(db.Model):
    __tablename__ = "t_sowing_replicates"
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}

    id_sowing_replicates = db.Column(db.Integer, primary_key=True, unique=True)

    id_sowing = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_sowing.id_sowing"),
        nullable=False
    )

    num_seedlings_emerged = db.Column(db.Integer)
    num_seedlings_dead = db.Column(db.Integer)
    num_seedlings_transplanted = db.Column(db.Integer)
    num_seeds_sown = db.Column(db.Integer)
    num_replicates = db.Column(db.Integer)
    germination_rate = db.Column(db.Float)
    germination_delay = db.Column(db.Integer)
    germination_period = db.Column(db.Integer)

    sowing = db.relationship("TSowing", backref=db.backref("replicates", lazy="select"))

@serializable
class TSowingReplicateDetails(db.Model):
    __tablename__ = "t_sowing_replicate_details"
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}

    id_sowing_replicate_details = db.Column(db.Integer, primary_key=True, unique=True)

    id_sowing_replicate = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_sowing_replicates.id_sowing_replicates", ondelete="NO ACTION"),
        nullable=False
    )

    date = db.Column(db.Date)
    num_seedlings_emerged = db.Column(db.Integer)
    num_seedlings_dead = db.Column(db.Integer)
    num_seedlings_transplanted = db.Column(db.Integer)

    replicate = db.relationship("TSowingReplicates", backref=db.backref("details", lazy="select"))

@serializable
class TGerminationTest(db.Model):
    __tablename__ = "t_germination_test"
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}

    id_germination_test = db.Column(db.Integer, primary_key=True, unique=True)

    id_storage = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_storage.id_storage", ondelete="NO ACTION"),
        nullable=False
    )

    contract = db.Column(db.String(255))
    initial_test = db.Column(db.Boolean)
    test_number = db.Column(db.String(255))
    seed_number = db.Column(db.String(255))
    sterilization = db.Column(db.Text)
    
    id_support = db.Column(
        db.Integer,
        db.ForeignKey("ref_nomenclatures.t_nomenclatures.id_nomenclature", ondelete="NO ACTION")
    )
    id_substrate = db.Column(
        db.Integer,
        db.ForeignKey("ref_nomenclatures.t_nomenclatures.id_nomenclature", ondelete="NO ACTION")
    )
    id_liquid = db.Column(
        db.Integer,
        db.ForeignKey("ref_nomenclatures.t_nomenclatures.id_nomenclature", ondelete="NO ACTION")
    )

    remarks = db.Column(db.Text)
    scarification = db.Column(db.Text)
    num_replicates = db.Column(db.String(255))

    stock = db.relationship("TStorage", backref=db.backref("germination_tests", lazy="select"))

    

@serializable
class TGerminationReplicates(db.Model):
    __tablename__ = "t_germination_replicates"
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}

    id_germination_replicates = db.Column(db.Integer, primary_key=True, unique=True)

    id_germination_test = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_germination_test.id_germination_test"),
        nullable=False
    )

    date = db.Column(db.Date)
    num_seedlings_emerged = db.Column(db.Integer)
    num_seedlings_dead = db.Column(db.Integer)
    num_seedlings_transplanted = db.Column(db.Integer)
    germination_rate = db.Column(db.Float)
    germination_delay = db.Column(db.Integer)
    germination_period = db.Column(db.Integer)
    T50 = db.Column(db.Integer)

    test = db.relationship("TGerminationTest", backref=db.backref("replicates", lazy="select"))

@serializable
class TGerminationReplicateDetails(db.Model):
    __tablename__ = "t_germination_replicate_details"
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}

    id_germination_replicate_details = db.Column(db.Integer, primary_key=True, unique=True)

    id_germination_replicate = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_germination_replicates.id_germination_replicates", ondelete="NO ACTION"),
        nullable=False
    )

    date = db.Column(db.Date)
    num_seeds_germinated = db.Column(db.Integer)
    num_seeds_dead = db.Column(db.Integer)
    num_seeds_ungerminated = db.Column(db.Integer)

    replicate = db.relationship("TGerminationReplicates", backref=db.backref("details", lazy="select"))

@serializable
class TGerminationTestPreTreatments(db.Model):
    __tablename__ = "t_germination_test_pre_treatments"
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}

    id_germination_test_pre_treatments = db.Column(db.Integer, primary_key=True, unique=True)

    id_germination_test = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_germination_test.id_germination_test"),
        nullable=False
    )

    pre_treatment = db.Column(db.Boolean)
    date_start = db.Column(db.Date)
    date_end = db.Column(db.Date)
    id_photo_thermo = db.Column(db.Integer)
    chemical_products = db.Column(db.Text)
    duration_days = db.Column(db.Integer)

    test = db.relationship("TGerminationTest", backref=db.backref("pre_treatments", lazy="select"))

    def to_dic(self):
        return {
            "id": self.id_germination_test_pre_treatments,
            "date_start": self.date_start,
            "date_end": self.date_end,
            "chemical_products": self.chemical_products,
            "pre_treatment": self.pre_treatment,
            "duration_days": self.duration_days
        }
    
@serializable
class TViabilityTest(db.Model):
    __tablename__ = "t_viability_test"
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}

    id_viability_test = db.Column(db.Integer, primary_key=True, unique=True)

    id_storage = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_storage.id_storage", ondelete="NO ACTION"),
        nullable=True
    )

    contract = db.Column(db.String(255))
    seed_number = db.Column(db.String(255))
    viability_rate = db.Column(db.Float)
    sterilization = db.Column(db.Text)
    scarification = db.Column(db.Text)
    remarks = db.Column(db.Text)

    stock = db.relationship("TStorage", backref=db.backref("viability_tests", lazy="select"))

    def to_dic(self):
        return {
            "id": self.id_viability_test,
            "contract": self.contract,
            "seed_number": self.seed_number,
            "viability_rate": self.viability_rate
        }
@serializable
class TViabilityTestReplicates(db.Model):
    __tablename__ = "t_viability_test_replicates"
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}

    id_viability_replicates = db.Column(db.Integer, primary_key=True, unique=True)

    id_viability_test = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_viability_test.id_viability_test", ondelete="NO ACTION"),
        nullable=False
    )

    num_seeds = db.Column(db.Integer)
    num_seeds_viable = db.Column(db.Integer)
    num_seeds_non_viable = db.Column(db.Integer)
    viability_rate = db.Column(db.Float)

    test = db.relationship("TViabilityTest", backref=db.backref("replicates", lazy="select"))
@serializable
class TViabilityTestTreatments(db.Model):
    __tablename__ = "t_viability_test_treatments"
    __table_args__ = {"schema": "pr_conservation_flora_exsitu"}

    id_viability_test_treatments = db.Column(db.Integer, primary_key=True, unique=True)

    id_viability_test = db.Column(
        db.Integer,
        db.ForeignKey("pr_conservation_flora_exsitu.t_viability_test.id_viability_test", ondelete="NO ACTION"),
        nullable=False
    )

    datetime_start = db.Column(db.Date)
    datetime_end = db.Column(db.Date)
    id_thermo = db.Column(db.Integer)
    concentration_ttc = db.Column(db.Text)
    duration_hours = db.Column(db.Integer)

    test = db.relationship("TViabilityTest", backref=db.backref("treatments", lazy="select"))