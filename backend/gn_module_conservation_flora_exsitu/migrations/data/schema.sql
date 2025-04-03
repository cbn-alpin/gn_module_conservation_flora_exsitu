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

-- Table des semis
CREATE TABLE "t_sowing" (
	"id_sowing" SERIAL NOT NULL UNIQUE,
	"id_stock" INTEGER NOT NULL,
	"contract" VARCHAR(255),
	"sowing_number" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"seed_preparation" TEXT,
	"packaging" INTEGER NOT NULL,
	"substrate" INTEGER NOT NULL,
	"id_watering_method" INTEGER NOT NULL,
	"id_sowing_method" INTEGER,
	"sowing_depth_mm" VARCHAR(255),
	"date_start" DATE,
	"date_end" DATE,
	"sowing_treatment" TEXT,
	"remarks" TEXT
);

-- Réplicats de semis
CREATE TABLE "t_sowing_replicates" (
	"id_sowing_replicates" SERIAL PRIMARY KEY,
	"id_sowing" INTEGER NOT NULL,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER,
	"num_seeds_sown" INTEGER,
	"num_replicates" INTEGER,
	"germination_rate" REAL,
	"germination_delay" INTEGER,
	"germination_period" INTEGER
);

-- Détails des réplicats de semis
CREATE TABLE "t_sowing_replicate_details" (
	"id_sowing_replicate_details" SERIAL PRIMARY KEY,
	"id_sowing_replicate" INTEGER NOT NULL,
	"date" DATE,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER
);

-- Test de germination
CREATE TABLE "t_germination_test" (
	"id_germination_test" SERIAL PRIMARY KEY,
	"contract" VARCHAR(255),
	"initial_test" BOOLEAN,
	"id_stock" INTEGER NOT NULL,
	"test_number" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"sterilization" TEXT,
	"id_support" INTEGER,
	"id_substrate" INTEGER,
	"id_liquid" INTEGER,
	"remarks" TEXT,
	"scarification" TEXT,
	"num_replicates" VARCHAR(255)
);

-- Réplicats de germination
CREATE TABLE "t_germination_replicates" (
	"id_germination_replicates" SERIAL PRIMARY KEY,
	"id_germination_test" INTEGER NOT NULL,
	"date" DATE,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER,
	"germination_rate" REAL,
	"germination_delay" INTEGER,
	"germination_period" INTEGER,
	"T50" INTEGER
);

-- Détail réplicats de germination
CREATE TABLE "t_germination_replicate_details" (
	"id_germination_replicate_details" SERIAL PRIMARY KEY,
	"id_germination_replicate" INTEGER NOT NULL,
	"date" DATE,
	"num_seeds_germinated" INTEGER,
	"num_seeds_dead" INTEGER,
	"num_seeds_ungerminated" INTEGER
);

-- Prétraitements germination
CREATE TABLE "t_germination_test_pre_treatments" (
	"id_germination_test_pre_treatments" SERIAL PRIMARY KEY,
	"id_germination_test" INTEGER NOT NULL,
	"pre_treatment" BOOLEAN,
	"date_start" DATE,
	"date_end" DATE,
	"id_photo_thermo" INTEGER NOT NULL,
	"chemical_products" TEXT,
	"duration_days" INTEGER
);

-- Tests de viabilité
CREATE TABLE "t_viability_test" (
	"id_viability_test" SERIAL PRIMARY KEY,
	"id_stock" INTEGER NOT NULL,
	"contract" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"viability_rate" REAL,
	"sterilization" TEXT,
	"scarification" TEXT,
	"remarks" TEXT
);

-- Réplicats de viabilité
CREATE TABLE "t_viability_test_replicates" (
	"id_viability_replicates" SERIAL PRIMARY KEY,
	"id_viability_test" INTEGER NOT NULL,
	"num_seeds" INTEGER,
	"num_seeds_viable" INTEGER,
	"num_seeds_non_viable" INTEGER,
	"viability_rate" REAL
);

-- Traitements tests viabilité
CREATE TABLE "t_viability_test_treatments" (
	"id_viability_test_treatments" SERIAL PRIMARY KEY,
	"id_viability_test" INTEGER NOT NULL,
	"datetime_start" DATE,
	"datetime_end" DATE,
	"id_thermo" INTEGER NOT NULL,
	"concentration_ttc" TEXT,
	"duration_hours" INTEGER
);

-- Table des semis
CREATE TABLE "t_sowing" (
	"id_sowing" SERIAL NOT NULL UNIQUE,
	"id_stock" INTEGER NOT NULL,
	"contract" VARCHAR(255),
	"sowing_number" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"seed_preparation" TEXT,
	"packaging" INTEGER NOT NULL,
	"substrate" INTEGER NOT NULL,
	"id_watering_method" INTEGER NOT NULL,
	"id_sowing_method" INTEGER,
	"sowing_depth_mm" VARCHAR(255),
	"date_start" DATE,
	"date_end" DATE,
	"sowing_treatment" TEXT,
	"remarks" TEXT
);

-- Réplicats de semis
CREATE TABLE "t_sowing_replicates" (
	"id_sowing_replicates" SERIAL PRIMARY KEY,
	"id_sowing" INTEGER NOT NULL,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER,
	"num_seeds_sown" INTEGER,
	"num_replicates" INTEGER,
	"germination_rate" REAL,
	"germination_delay" INTEGER,
	"germination_period" INTEGER
);

-- Détails des réplicats de semis
CREATE TABLE "t_sowing_replicate_details" (
	"id_sowing_replicate_details" SERIAL PRIMARY KEY,
	"id_sowing_replicate" INTEGER NOT NULL,
	"date" DATE,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER
);

-- Test de germination
CREATE TABLE "t_germination_test" (
	"id_germination_test" SERIAL PRIMARY KEY,
	"contract" VARCHAR(255),
	"initial_test" BOOLEAN,
	"id_stock" INTEGER NOT NULL,
	"test_number" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"sterilization" TEXT,
	"id_support" INTEGER,
	"id_substrate" INTEGER,
	"id_liquid" INTEGER,
	"remarks" TEXT,
	"scarification" TEXT,
	"num_replicates" VARCHAR(255)
);

-- Réplicats de germination
CREATE TABLE "t_germination_replicates" (
	"id_germination_replicates" SERIAL PRIMARY KEY,
	"id_germination_test" INTEGER NOT NULL,
	"date" DATE,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER,
	"germination_rate" REAL,
	"germination_delay" INTEGER,
	"germination_period" INTEGER,
	"T50" INTEGER
);

-- Détail réplicats de germination
CREATE TABLE "t_germination_replicate_details" (
	"id_germination_replicate_details" SERIAL PRIMARY KEY,
	"id_germination_replicate" INTEGER NOT NULL,
	"date" DATE,
	"num_seeds_germinated" INTEGER,
	"num_seeds_dead" INTEGER,
	"num_seeds_ungerminated" INTEGER
);

-- Prétraitements germination
CREATE TABLE "t_germination_test_pre_treatments" (
	"id_germination_test_pre_treatments" SERIAL PRIMARY KEY,
	"id_germination_test" INTEGER NOT NULL,
	"pre_treatment" BOOLEAN,
	"date_start" DATE,
	"date_end" DATE,
	"id_photo_thermo" INTEGER NOT NULL,
	"chemical_products" TEXT,
	"duration_days" INTEGER
);

-- Tests de viabilité
CREATE TABLE "t_viability_test" (
	"id_viability_test" SERIAL PRIMARY KEY,
	"id_stock" INTEGER NOT NULL,
	"contract" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"viability_rate" REAL,
	"sterilization" TEXT,
	"scarification" TEXT,
	"remarks" TEXT
);

-- Réplicats de viabilité
CREATE TABLE "t_viability_test_replicates" (
	"id_viability_replicates" SERIAL PRIMARY KEY,
	"id_viability_test" INTEGER NOT NULL,
	"num_seeds" INTEGER,
	"num_seeds_viable" INTEGER,
	"num_seeds_non_viable" INTEGER,
	"viability_rate" REAL
);

-- Traitements tests viabilité
CREATE TABLE "t_viability_test_treatments" (
	"id_viability_test_treatments" SERIAL PRIMARY KEY,
	"id_viability_test" INTEGER NOT NULL,
	"datetime_start" DATE,
	"datetime_end" DATE,
	"id_thermo" INTEGER NOT NULL,
	"concentration_ttc" TEXT,
	"duration_hours" INTEGER
);

-- Table des semis
CREATE TABLE "t_sowing" (
	"id_sowing" SERIAL NOT NULL UNIQUE,
	"id_stock" INTEGER NOT NULL,
	"contract" VARCHAR(255),
	"sowing_number" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"seed_preparation" TEXT,
	"packaging" INTEGER NOT NULL,
	"substrate" INTEGER NOT NULL,
	"id_watering_method" INTEGER NOT NULL,
	"id_sowing_method" INTEGER,
	"sowing_depth_mm" VARCHAR(255),
	"date_start" DATE,
	"date_end" DATE,
	"sowing_treatment" TEXT,
	"remarks" TEXT
);

-- Réplicats de semis
CREATE TABLE "t_sowing_replicates" (
	"id_sowing_replicates" SERIAL PRIMARY KEY,
	"id_sowing" INTEGER NOT NULL,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER,
	"num_seeds_sown" INTEGER,
	"num_replicates" INTEGER,
	"germination_rate" REAL,
	"germination_delay" INTEGER,
	"germination_period" INTEGER
);

-- Détails des réplicats de semis
CREATE TABLE "t_sowing_replicate_details" (
	"id_sowing_replicate_details" SERIAL PRIMARY KEY,
	"id_sowing_replicate" INTEGER NOT NULL,
	"date" DATE,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER
);

-- Test de germination
CREATE TABLE "t_germination_test" (
	"id_germination_test" SERIAL PRIMARY KEY,
	"contract" VARCHAR(255),
	"initial_test" BOOLEAN,
	"id_stock" INTEGER NOT NULL,
	"test_number" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"sterilization" TEXT,
	"id_support" INTEGER,
	"id_substrate" INTEGER,
	"id_liquid" INTEGER,
	"remarks" TEXT,
	"scarification" TEXT,
	"num_replicates" VARCHAR(255)
);

-- Réplicats de germination
CREATE TABLE "t_germination_replicates" (
	"id_germination_replicates" SERIAL PRIMARY KEY,
	"id_germination_test" INTEGER NOT NULL,
	"date" DATE,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER,
	"germination_rate" REAL,
	"germination_delay" INTEGER,
	"germination_period" INTEGER,
	"T50" INTEGER
);

-- Détail réplicats de germination
CREATE TABLE "t_germination_replicate_details" (
	"id_germination_replicate_details" SERIAL PRIMARY KEY,
	"id_germination_replicate" INTEGER NOT NULL,
	"date" DATE,
	"num_seeds_germinated" INTEGER,
	"num_seeds_dead" INTEGER,
	"num_seeds_ungerminated" INTEGER
);

-- Prétraitements germination
CREATE TABLE "t_germination_test_pre_treatments" (
	"id_germination_test_pre_treatments" SERIAL PRIMARY KEY,
	"id_germination_test" INTEGER NOT NULL,
	"pre_treatment" BOOLEAN,
	"date_start" DATE,
	"date_end" DATE,
	"id_photo_thermo" INTEGER NOT NULL,
	"chemical_products" TEXT,
	"duration_days" INTEGER
);

-- Tests de viabilité
CREATE TABLE "t_viability_test" (
	"id_viability_test" SERIAL PRIMARY KEY,
	"id_stock" INTEGER NOT NULL,
	"contract" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"viability_rate" REAL,
	"sterilization" TEXT,
	"scarification" TEXT,
	"remarks" TEXT
);

-- Réplicats de viabilité
CREATE TABLE "t_viability_test_replicates" (
	"id_viability_replicates" SERIAL PRIMARY KEY,
	"id_viability_test" INTEGER NOT NULL,
	"num_seeds" INTEGER,
	"num_seeds_viable" INTEGER,
	"num_seeds_non_viable" INTEGER,
	"viability_rate" REAL
);

-- Traitements tests viabilité
CREATE TABLE "t_viability_test_treatments" (
	"id_viability_test_treatments" SERIAL PRIMARY KEY,
	"id_viability_test" INTEGER NOT NULL,
	"datetime_start" DATE,
	"datetime_end" DATE,
	"id_thermo" INTEGER NOT NULL,
	"concentration_ttc" TEXT,
	"duration_hours" INTEGER
);

-- Table des semis
CREATE TABLE "t_sowing" (
	"id_sowing" SERIAL NOT NULL UNIQUE,
	"id_stock" INTEGER NOT NULL,
	"contract" VARCHAR(255),
	"sowing_number" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"seed_preparation" TEXT,
	"packaging" INTEGER NOT NULL,
	"substrate" INTEGER NOT NULL,
	"id_watering_method" INTEGER NOT NULL,
	"id_sowing_method" INTEGER,
	"sowing_depth_mm" VARCHAR(255),
	"date_start" DATE,
	"date_end" DATE,
	"sowing_treatment" TEXT,
	"remarks" TEXT
);

-- Réplicats de semis
CREATE TABLE "t_sowing_replicates" (
	"id_sowing_replicates" SERIAL PRIMARY KEY,
	"id_sowing" INTEGER NOT NULL,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER,
	"num_seeds_sown" INTEGER,
	"num_replicates" INTEGER,
	"germination_rate" REAL,
	"germination_delay" INTEGER,
	"germination_period" INTEGER
);

-- Détails des réplicats de semis
CREATE TABLE "t_sowing_replicate_details" (
	"id_sowing_replicate_details" SERIAL PRIMARY KEY,
	"id_sowing_replicate" INTEGER NOT NULL,
	"date" DATE,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER
);

-- Test de germination
CREATE TABLE "t_germination_test" (
	"id_germination_test" SERIAL PRIMARY KEY,
	"contract" VARCHAR(255),
	"initial_test" BOOLEAN,
	"id_stock" INTEGER NOT NULL,
	"test_number" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"sterilization" TEXT,
	"id_support" INTEGER,
	"id_substrate" INTEGER,
	"id_liquid" INTEGER,
	"remarks" TEXT,
	"scarification" TEXT,
	"num_replicates" VARCHAR(255)
);

-- Réplicats de germination
CREATE TABLE "t_germination_replicates" (
	"id_germination_replicates" SERIAL PRIMARY KEY,
	"id_germination_test" INTEGER NOT NULL,
	"date" DATE,
	"num_seedlings_emerged" INTEGER,
	"num_seedlings_dead" INTEGER,
	"num_seedlings_transplanted" INTEGER,
	"germination_rate" REAL,
	"germination_delay" INTEGER,
	"germination_period" INTEGER,
	"T50" INTEGER
);

-- Détail réplicats de germination
CREATE TABLE "t_germination_replicate_details" (
	"id_germination_replicate_details" SERIAL PRIMARY KEY,
	"id_germination_replicate" INTEGER NOT NULL,
	"date" DATE,
	"num_seeds_germinated" INTEGER,
	"num_seeds_dead" INTEGER,
	"num_seeds_ungerminated" INTEGER
);

-- Prétraitements germination
CREATE TABLE "t_germination_test_pre_treatments" (
	"id_germination_test_pre_treatments" SERIAL PRIMARY KEY,
	"id_germination_test" INTEGER NOT NULL,
	"pre_treatment" BOOLEAN,
	"date_start" DATE,
	"date_end" DATE,
	"id_photo_thermo" INTEGER NOT NULL,
	"chemical_products" TEXT,
	"duration_days" INTEGER
);

-- Tests de viabilité
CREATE TABLE "t_viability_test" (
	"id_viability_test" SERIAL PRIMARY KEY,
	"id_stock" INTEGER NOT NULL,
	"contract" VARCHAR(255),
	"seed_number" VARCHAR(255),
	"viability_rate" REAL,
	"sterilization" TEXT,
	"scarification" TEXT,
	"remarks" TEXT
);

-- Réplicats de viabilité
CREATE TABLE "t_viability_test_replicates" (
	"id_viability_replicates" SERIAL PRIMARY KEY,
	"id_viability_test" INTEGER NOT NULL,
	"num_seeds" INTEGER,
	"num_seeds_viable" INTEGER,
	"num_seeds_non_viable" INTEGER,
	"viability_rate" REAL
);

-- Traitements tests viabilité
CREATE TABLE "t_viability_test_treatments" (
	"id_viability_test_treatments" SERIAL PRIMARY KEY,
	"id_viability_test" INTEGER NOT NULL,
	"datetime_start" DATE,
	"datetime_end" DATE,
	"id_thermo" INTEGER NOT NULL,
	"concentration_ttc" TEXT,
	"duration_hours" INTEGER
);

-------------------------------------------------------------------



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
ALTER TABLE "t_sowing" 
ADD FOREIGN KEY("id_stock") REFERENCES t_seed_stock(id_stock)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing" 
ADD FOREIGN KEY("id_sowing_method") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing" 
ADD FOREIGN KEY("id_watering_method") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing_replicates" 
ADD FOREIGN KEY("id_sowing") REFERENCES t_sowing(id_sowing) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_sowing_replicate_details" 
ADD FOREIGN KEY("id_sowing_replicate") REFERENCES t_sowing_replicates(id_sowing_replicates) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_germination_test" 
ADD FOREIGN KEY("id_stock") REFERENCES t_seed_stock(id_stock) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_germination_test" 
ADD FOREIGN KEY("id_support") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_germination_test" 
ADD FOREIGN KEY("id_substrate") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_germination_test" 
ADD FOREIGN KEY("id_liquid") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_germination_replicates" 
ADD FOREIGN KEY("id_germination_test") REFERENCES t_germination_test(id_germination_test) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_germination_replicate_details" 
ADD FOREIGN KEY("id_germination_replicate") REFERENCES t_germination_replicates(id_germination_replicates) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_germination_test_pre_treatments" 
ADD FOREIGN KEY("id_germination_test") REFERENCES t_germination_test(id_germination_test) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_viability_test" 
ADD FOREIGN KEY("id_stock") REFERENCES t_seed_stock(id_stock) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_viability_test_replicates" 
ADD FOREIGN KEY("id_viability_test") REFERENCES t_viability_test(id_viability_test) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_viability_test_treatments" 
ADD FOREIGN KEY("id_viability_test") REFERENCES t_viability_test(id_viability_test) 
ON UPDATE NO ACTION ON DELETE NO ACTION;
