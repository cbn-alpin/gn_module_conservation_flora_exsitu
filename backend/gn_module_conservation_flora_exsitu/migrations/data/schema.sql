-- Create Conservation Flora Exsitu schema and tables

-- Set database variables
SET client_encoding = 'UTF8' ;


-- Create module schema
CREATE SCHEMA pr_conservation_flora_exsitu ;


-- Set new database variables
SET search_path = pr_conservation_flora_exsitu, pg_catalog, public;


-- --------------------------------------------------------------------------------
-- TABLES

-- Table `t_harvest`
CREATE TABLE "t_harvest" (
	"id_harvest" SERIAL NOT NULL UNIQUE,
	-- Clé étrangère  GN.gn_meta.t_datasets.id_dataset
	"id_dataset" INTEGER NOT NULL,
	-- cd_hab: clé étrangère GN.ref_habitats.habref.cd_hab
	"cd_hab" INTEGER,
	-- Type de récolte
	"id_harvest_type" INTEGER NOT NULL,
	-- Date de début de récolte
	"date_start" DATE NOT NULL,
	-- Date de fin de récolte
	"date_end" DATE,
	-- Remarques générales
	"remarks" TEXT,
	-- Commentaire sur la location(lieudit, comm_loc)
	"place_remarks" TEXT,
	-- Coordonnées GPS
	"geom" GEOMETRY(GEOMETRY, 2154),
	-- Code de la commune, du département
	"id_area" INTEGER,
	-- Type de localisation
	"id_area_type" INTEGER,
	"id_geographical_precision" INTEGER NOT NULL,
	-- Résolution de la localisation en mètres
	"precision" INTEGER,
	-- En m2
	"surface" INTEGER,
	"altitude" INTEGER,
	"id_exposition" INTEGER,
	-- Pente
	"slope" INTEGER,
	"additional_data" JSONB,
	"meta_create_by" INTEGER NOT NULL,
	"meta_create_date" TIMESTAMP NOT NULL,
	"meta_update_by" INTEGER,
	"meta_update_date" TIMESTAMP,
	PRIMARY KEY("id_harvest")
);

COMMENT ON TABLE "t_harvest" IS 'ID récolte : forme 2024_0001 4 chiffres';
COMMENT ON COLUMN t_harvest.id_dataset IS 'Clé étrangère  GN.gn_meta.t_datasets.id_dataset';
COMMENT ON COLUMN t_harvest.cd_hab IS 'cd_hab: clé étrangère GN.ref_habitats.habref.cd_hab';
COMMENT ON COLUMN t_harvest.id_harvest_type IS 'Type de récolte';
COMMENT ON COLUMN t_harvest.date_start IS 'Date de début de récolte';
COMMENT ON COLUMN t_harvest.date_end IS 'Date de fin de récolte';
COMMENT ON COLUMN t_harvest.place_remarks IS 'Commentaire sur la location(lieudit, comm_loc)';
COMMENT ON COLUMN t_harvest.geom IS 'Coordonnées GPS';
COMMENT ON COLUMN t_harvest.id_area IS 'Code de la commune, du département';
COMMENT ON COLUMN t_harvest.id_area_type IS 'Type de localisation';
COMMENT ON COLUMN t_harvest.precision IS 'Résolution de la localisation en mètres';
COMMENT ON COLUMN t_harvest.surface IS 'En m2';
COMMENT ON COLUMN t_harvest.remarks IS 'Remarques générales';
COMMENT ON COLUMN t_harvest.slope IS 'Pente';

CREATE TABLE "cor_harvest_observer" (
	"id_observer" INTEGER NOT NULL,
	"id_harvest" INTEGER NOT NULL,
	"is_main_observer" BOOLEAN DEFAULT FALSE,
	PRIMARY KEY("id_observer", "id_harvest")
);

CREATE TABLE "t_material" (
	"id_material" SERIAL NOT NULL UNIQUE,
	"uuid_material" UUID DEFAULT uuid_generate_v4(),
	"code_material" VARCHAR(50) NOT NULL UNIQUE,
	"id_material_parent" INTEGER,
	"id_harvest" INTEGER NOT NULL,
	-- Matériel végétal récolté
	"id_material_type" INTEGER NOT NULL,
	-- Classes d’individus
	"id_foot_counting_class" INTEGER,
	-- Phénologie
	"id_phenology_1" INTEGER,
	-- Phénologie
	"id_phenology_2" INTEGER,
	-- Protocoles et astuces
	"remarks" TEXT,
	-- Remarques générales
	"code_cultural_bank" INTEGER,
	-- Nombre de pieds échantillonnés
	"sample_foot_count" INTEGER,
	-- Prélèvement de terre
	"is_soil_sampling" BOOLEAN DEFAULT FALSE,
	-- Mode d’échantillonnage
	"id_method_sample" INTEGER,
	-- Risque d'hybridation
	"has_hybridation_risk" BOOLEAN DEFAULT FALSE,
	"additional_data" JSONB,
    "meta_create_by" INTEGER NOT NULL,
    "meta_create_date" TIMESTAMP NOT NULL,
    "meta_update_by" INTEGER,
    "meta_update_date" TIMESTAMP,
	PRIMARY KEY("id_material")
);
COMMENT ON COLUMN t_material.id_material_type IS 'Matériel végétal récolté';
COMMENT ON COLUMN t_material.id_foot_counting_class IS 'Classes d’individus';
COMMENT ON COLUMN t_material.id_phenology_1 IS 'Phénologie';
COMMENT ON COLUMN t_material.id_phenology_2 IS 'Phénologie';
COMMENT ON COLUMN t_material.remarks IS 'Commentaire + Protocoles et astuces';
COMMENT ON COLUMN t_material.sample_foot_count IS 'Nombre de pieds échantillonnés';
COMMENT ON COLUMN t_material.is_soil_sampling IS 'Prélèvement de terre';
COMMENT ON COLUMN t_material.id_method_sample IS 'Mode d’échantillonnage';
COMMENT ON COLUMN t_material.has_hybridation_risk IS 'Risque dhybridation';



CREATE TABLE "cor_material_taxon" (
	"id_material" INTEGER NOT NULL,
	-- Clé étrangère GN.taxonomie.taxonomie.taxref.cd_nom
	"cd_nom" INTEGER NOT NULL,
	PRIMARY KEY("id_material", "cd_nom")
);
COMMENT ON COLUMN cor_material_taxon.cd_nom IS 'Clé étrangère GN.taxonomie.taxonomie.taxref.cd_nom';


-- Si type_action = "destockage" ou "déplacement", alors il faut re-créer une action de type "stockage initial"


CREATE TABLE "t_storage" (
    "id_storage" SERIAL NOT NULL UNIQUE,
    "id_material" INTEGER NOT NULL,
	"id_place" INTEGER NOT NULL,
    "date_start" DATE NOT NULL,
    "date_end" DATE NOT NULL,
    "id_actor" INTEGER NOT NULL,
    -- Nomenclature : 
    -- - Stockage initial
    -- - Placement/déplacement du témoin humidité -> modèle
    -- - Evaluation de humidité -> niveau -> sec/moyennement humide/humide
    -- - Mesure humidité précise -> valeur AWMètre (décimal)
    -- - Destockage -> partiel/total -> quantité & destination (txt)
    -- - Déplacement du lot -> quantité & destination
    "id_storage_action" INTEGER NOT NULL,
    -- Obligatoire lorsque type_action = destockage / deplacement
    "quantity" INTEGER,
    "id_destock" INTEGER,
    -- Obligatoire lorsque type_action = stockage / destockage / deplacement
    "id_destination" INTEGER,
    -- - sec
    -- - moyennement humide
    -- - humide
    "id_humidity_level" INTEGER,
    "humidity_rate" decimal,
    -- obligatoire si type_action = placement du témoin humidité
    "id_humidity_device" INTEGER,
	"id_dry_type" INTEGER,
    "remarks" text,
	"destination_precision" text,
    "additional_data" JSONB,
    "meta_create_by" INTEGER NOT NULL,
    "meta_create_date" TIMESTAMP NOT NULL,
    "meta_update_by" INTEGER,
    "meta_update_date" TIMESTAMP,
    PRIMARY KEY ("id_storage")
);

COMMENT ON TABLE "t_storage" IS 'Si type_action = "destockage" ou "déplacement", alors il faut re-créer une action de type "stockage initial"';
COMMENT ON COLUMN "t_storage"."quantity" IS 'Obligatoire lorsque type_action = destockage / deplacement';
COMMENT ON COLUMN "t_storage"."id_destination" IS 'Obligatoire lorsque type_action = stockage / destockage / deplacement';
COMMENT ON COLUMN "t_storage"."id_humidity_level" IS '- sec - moyennement humide - humide';
COMMENT ON COLUMN "t_storage"."id_humidity_device" IS 'obligatoire si type_action = placement du témoin d''humidité';



CREATE TABLE "t_material_seed" (
    "id_seed" SERIAL NOT NULL UNIQUE,
	"unique_id_seed" UUID DEFAULT uuid_generate_v4(),
    "id_material" INTEGER UNIQUE,
    -- Longueur moyenne (mm)
    "length" decimal,
    -- Largeur moyenne (mm)
    "width" decimal,
    "thickness" decimal,
	"total_count" INTEGER,
	-- État du lot
	"id_material_quality" INTEGER,
	"total_mass" decimal,
	"sample_count" decimal,
	"sample_mass" decimal,
    "has_photo" BOOLEAN DEFAULT FALSE,
    "remarks" text,
	"additional_data" JSONB,
    "meta_create_by" INTEGER NOT NULL,
    "meta_create_date" TIMESTAMP NOT NULL,
    "meta_update_by" INTEGER,
    "meta_update_date" TIMESTAMP,
    PRIMARY KEY ("id_seed")
);

COMMENT ON COLUMN "t_material_seed"."length" IS 'Longueur moyenne (mm)';
COMMENT ON COLUMN "t_material_seed"."width" IS 'Largeur moyenne (mm)';
COMMENT ON COLUMN "t_material_seed"."id_material_quality" IS 'État du lot';
-------------------------------------------------------------------
CREATE TABLE "t_test" (
    "id_test" SERIAL NOT NULL UNIQUE,
    "id_test_parent" INTEGER,
    "id_material" INTEGER NOT NULL,
    "id_actor" INTEGER NOT NULL,
    "id_storage" INTEGER,
    "id_test_type" INTEGER,
    "code" VARCHAR(50),
    "seed_initial_count" INTEGER,
    "replicate_count" INTEGER DEFAULT 1,
    "id_support" INTEGER,
    "id_substrate" INTEGER,
    "remarks" TEXT,
    "additional_data" JSONB,
    "germination_rate" REAL,    
    "germination_delay" INTEGER,
    "germination_period" INTEGER,               
    "photo_thermo_regime" VARCHAR(100),  
    "last_test" BOOLEAN DEFAULT FALSE,  
    "pre_treatment"  BOOLEAN DEFAULT FALSE, 
    "meta_create_by" INTEGER,
    "meta_create_date" TIMESTAMP,
    "meta_update_by" INTEGER,
    "meta_update_date" TIMESTAMP,
    PRIMARY KEY ("id_test")
);

CREATE TABLE "t_sowing" (
    "id_sowing" SERIAL NOT NULL UNIQUE,
    "id_material" INTEGER NOT NULL,
    "id_storage" INTEGER, -- SLIM ERROR : id_storage ne doit plus être obligatoire pour t_sowing
    "id_test" INTEGER,
    "code" VARCHAR(50) NOT NULL,
    "id_actor" INTEGER NOT NULL,
    "start_date" TIMESTAMP NOT NULL,
    "end_date" TIMESTAMP,
    "substrate" JSONB,
    "container" JSONB,
    "id_location" INTEGER,
    "specification_location" VARCHAR(100),
    "id_watering_method" INTEGER,
    "id_sowing_method" INTEGER,
    "depth" INTEGER,
    "initial_count" INTEGER,
    "replicate_count" INTEGER DEFAULT 1,
    "remarks" TEXT,
    "additional_data" JSONB,
    "meta_create_by" INTEGER NOT NULL,
    "meta_create_date" TIMESTAMP NOT NULL,
    "meta_update_by" INTEGER,
    "meta_update_date" TIMESTAMP,
    CONSTRAINT "uq_t_sowing_code" UNIQUE ("code"),
    CONSTRAINT "ck_t_sowing_end_date_after_start_date" CHECK ("end_date" IS NULL OR "end_date" > "start_date"),
    CONSTRAINT "ck_t_sowing_depth_positive" CHECK ("depth" IS NULL OR "depth" > 0),
    CONSTRAINT "ck_t_sowing_initial_count_positive" CHECK ("initial_count" IS NULL OR "initial_count" > 0),
    CONSTRAINT "ck_t_sowing_replicate_count_positive" CHECK ("replicate_count" IS NULL OR "replicate_count" > 0),
    PRIMARY KEY ("id_sowing")
);

CREATE TABLE "t_action" (
    "id_action" SERIAL NOT NULL UNIQUE,
    "id_test" INTEGER,
    "id_sowing" INTEGER,
    "date_start" TIMESTAMP NOT NULL,
    "date_end" TIMESTAMP,
    "id_actor" INTEGER NOT NULL,
    "id_action_type" INTEGER NOT NULL,
    "id_scarification_type" INTEGER,
    "id_scarification_mecanique" INTEGER,
    "temperature_light" INTEGER,
    "temperature_shadow" INTEGER,
    "hour_count_light" INTEGER,
    "hour_count_shadow" INTEGER,
    "id_water_type" INTEGER,
    "duration_water" INTEGER,
    "id_chemical_liquid" INTEGER,
    "duration_chemical_liquid" INTEGER,
    "concentration_chemical_liquid" INTEGER,
    "id_liquid_treatment" INTEGER,
    "id_tool" INTEGER,
    "id_sterilization_product" INTEGER,
    "id_sterilization_liquid" INTEGER,

    "remarks" TEXT,
    "additional_data" JSONB,
    "meta_create_by" INTEGER NOT NULL,
    "meta_create_date" TIMESTAMP NOT NULL,
    "meta_update_by" INTEGER,
    "meta_update_date" TIMESTAMP,
    PRIMARY KEY ("id_action")
);
COMMENT ON COLUMN "t_action"."id_test" IS 'Au moins un des champs id_test ou id_sowing doit être non NULL.';
COMMENT ON COLUMN "t_action"."id_sowing" IS 'Au moins un des champs id_test ou id_sowing doit être non NULL.';
COMMENT ON COLUMN "t_action"."concentration_chemical_liquid" IS 'Valeur entre 0 et 100 (%).';
COMMENT ON COLUMN "t_action"."temperature_light" IS 'Valeur entre -10 et 50 (°C).';
COMMENT ON COLUMN "t_action"."temperature_shadow" IS 'Valeur entre -10 et 50 (°C).';
COMMENT ON COLUMN "t_action"."hour_count_light" IS 'Maximum 24 (heures).';
COMMENT ON COLUMN "t_action"."hour_count_shadow" IS 'Maximum 24 (heures).';


CREATE TABLE "t_action_replicate" (
    "id_action_replicate" SERIAL NOT NULL UNIQUE,
    "id_action" INTEGER NOT NULL,
    "code" VARCHAR(10),
    "count_viable" INTEGER,
    "count_germinated" INTEGER,
    "count_transplanted" INTEGER,
    "count_dead" INTEGER,
    "total_count_viable" INTEGER,
    "total_count_germinated" INTEGER,
    "total_count_transplanted" INTEGER,
    "total_count_dead" INTEGER,
    "last_replicate" BOOLEAN DEFAULT FALSE,

    PRIMARY KEY ("id_action_replicate")
);


-------------------------------------------------------------------



ALTER TABLE "t_harvest"
ADD FOREIGN KEY("meta_update_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("meta_create_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_harvest_type") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "cor_harvest_observer"
ADD FOREIGN KEY("id_harvest") REFERENCES "t_harvest"("id_harvest")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "cor_harvest_observer"
ADD FOREIGN KEY("id_observer") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
CREATE UNIQUE INDEX unique_main_observer_per_harvest
ON cor_harvest_observer(id_harvest)
WHERE is_main_observer = true;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("cd_hab") REFERENCES ref_habitats.habref(cd_hab)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_dataset") REFERENCES gn_meta.t_datasets(id_dataset)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material"
ADD FOREIGN KEY("id_harvest") REFERENCES "t_harvest"("id_harvest")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material"
ADD FOREIGN KEY("id_material_parent") REFERENCES "t_material"("id_material")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material"
ADD FOREIGN KEY("id_foot_counting_class") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material"
ADD FOREIGN KEY("id_phenology_1") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material"
ADD FOREIGN KEY("id_phenology_2") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "cor_material_taxon"
ADD FOREIGN KEY("cd_nom") REFERENCES taxonomie.taxref(cd_nom)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "cor_material_taxon"
ADD FOREIGN KEY("id_material") REFERENCES "t_material"("id_material")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material"
ADD FOREIGN KEY("id_material_type") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material"
ADD FOREIGN KEY("meta_update_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material"
ADD FOREIGN KEY("meta_create_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_exposition") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_geographical_precision") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material"
ADD FOREIGN KEY("id_method_sample") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_area") REFERENCES ref_geo.l_areas(id_area)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_area_type") REFERENCES ref_geo.bib_areas_types(id_type)
ON UPDATE NO ACTION ON DELETE NO ACTION;
-----------------------------------------------------------
ALTER TABLE "t_material_seed"
ADD FOREIGN KEY("id_material_quality") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material_seed"
ADD FOREIGN KEY("meta_create_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material_seed"
ADD FOREIGN KEY("meta_update_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_material_seed"
ADD FOREIGN KEY("id_material") REFERENCES "t_material"("id_material")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("meta_create_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("meta_update_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("id_actor") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("id_material") REFERENCES "t_material"("id_material")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("id_storage_action") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("id_place") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("id_destock") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("id_destination") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("id_humidity_level") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("id_humidity_device") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_storage"
ADD FOREIGN KEY("id_dry_type") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;

---------------------------------------------------------------------------

ALTER TABLE "t_test"
ADD FOREIGN KEY("id_test_parent") REFERENCES "t_test"("id_test")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_test"
ADD FOREIGN KEY("id_material") REFERENCES "t_material"("id_material")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_test"
ADD FOREIGN KEY("id_actor") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_test"
ADD FOREIGN KEY("id_storage") REFERENCES "t_storage"("id_storage")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_test"
ADD FOREIGN KEY("id_test_type") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_test"
ADD FOREIGN KEY("id_support") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_test"
ADD FOREIGN KEY("id_substrate") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_test"
ADD FOREIGN KEY("meta_create_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_test"
ADD FOREIGN KEY("meta_update_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;


ALTER TABLE "t_sowing"
ADD FOREIGN KEY("id_material") REFERENCES "t_material"("id_material")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing"
ADD FOREIGN KEY("id_storage") REFERENCES "t_storage"("id_storage")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing"
ADD FOREIGN KEY("id_test") REFERENCES "t_test"("id_test")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing"
ADD FOREIGN KEY("id_actor") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing"
ADD FOREIGN KEY("id_location") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing"
ADD FOREIGN KEY("id_watering_method") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing"
ADD FOREIGN KEY("id_sowing_method") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing"
ADD FOREIGN KEY("meta_create_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing"
ADD FOREIGN KEY("meta_update_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "t_action"
ADD FOREIGN KEY("id_test") REFERENCES "t_test"("id_test")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("id_sowing") REFERENCES "t_sowing"("id_sowing")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("id_actor") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("id_action_type") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("id_scarification_type") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("id_scarification_mecanique") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("id_tool") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("id_sterilization_product") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("id_sterilization_liquid") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("id_liquid_treatment") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "t_action"
ADD FOREIGN KEY("id_water_type") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("id_chemical_liquid") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("meta_create_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_action"
ADD FOREIGN KEY("meta_update_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;

ALTER TABLE "t_action_replicate"
ADD FOREIGN KEY("id_action") REFERENCES "t_action"("id_action")
ON UPDATE NO ACTION ON DELETE CASCADE;
