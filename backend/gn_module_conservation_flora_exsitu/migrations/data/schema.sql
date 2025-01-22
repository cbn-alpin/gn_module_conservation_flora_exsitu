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
	"uuid_harvest" UUID DEFAULT uuid_generate_v4(),
	"is_seed_mix" BOOLEAN NOT NULL,
	-- Numéro de récolte 
	"code_harvest" VARCHAR(50) NOT NULL,
	-- Saisi du taxon
	"sciname_cited" VARCHAR(256) NOT NULL,
	-- cd_nom:  clé étrangère GN.taxonomie.taxonomie.taxref.cd_nom
	"cd_nom" INTEGER NOT NULL,
	-- cd_hab: clé étrangère GN.ref_habitats.habref.cd_hab
	"cd_hab" INTEGER NOT NULL,
	-- Type de récolte
	"id_harvest_type" INTEGER NOT NULL,
	-- Date de début de récolte
	"date_start" DATE NOT NULL,
	-- Date de fin de récolte
	"date_end" DATE NOT NULL,
	-- Matériel végétal récolté
	"id_harvest_material" INTEGER NOT NULL,
	-- Nombre de pieds échantillonnés
	"sample_foot_nb" INTEGER,
	-- Mode d’échantillonnage
	"id_method_sample" INTEGER,
	-- Prélèvement de terre
	"is_soil_sampling" BOOLEAN,
	-- Protocoles et astuces
	"protocol_note" TEXT,
	-- Commentaire sur la location(lieudit, comm_loc)
	"place_comment" TEXT,
	-- Phénologie
	"id_phenology_1" INTEGER,
	-- Phénologie
	"id_phenology_2" INTEGER,
	-- Coordonnées GPS
	"geom" GEOMETRY(POINT, 2154),
	-- Code de la commune, du département
	"location_code" INTEGER,
	"precision" INTEGER DEFAULT 10,
	-- En m2
	"surface" INTEGER,
	"altitude" INTEGER,
	"id_exposition" INTEGER,
	-- Classes d'individu
	"id_foot_counting_class" INTEGER,
	-- Protocoles et astuces
	"protocole_note" TEXT,
	-- Remarques générales
	"comment" TEXT,
	"num_cultural_bank" INTEGER,
	"additional_data" JSONB,
	"meta_create_by" INTEGER NOT NULL,
	"meta_create_date" TIMESTAMP NOT NULL,
	"meta_update_by" INTEGER,
	"meta_update_date" TIMESTAMP,
	PRIMARY KEY("id_harvest")
);

COMMENT ON TABLE "t_harvest" IS 'ID récolte : forme 2024_0001 4 chiffres';
COMMENT ON COLUMN t_harvest.id_dataset IS 'Clé étrangère  GN.gn_meta.t_datasets.id_dataset';
COMMENT ON COLUMN t_harvest.code_harvest IS 'Numéro de récolte ';
COMMENT ON COLUMN t_harvest.sciname_cited IS 'Saisi du taxon';
COMMENT ON COLUMN t_harvest.cd_nom IS 'cd_nom:  clé étrangère GN.taxonomie.taxonomie.taxref.cd_nom';
COMMENT ON COLUMN t_harvest.cd_hab IS 'cd_hab: clé étrangère GN.ref_habitats.habref.cd_hab';
COMMENT ON COLUMN t_harvest.id_harvest_type IS 'Type de récolte';
COMMENT ON COLUMN t_harvest.date_start IS 'Date de début de récolte';
COMMENT ON COLUMN t_harvest.date_end IS 'Date de fin de récolte';
COMMENT ON COLUMN t_harvest.id_harvest_material IS 'Matériel végétal récolté';
COMMENT ON COLUMN t_harvest.sample_foot_nb IS 'Nombre de pieds échantillonnés';
COMMENT ON COLUMN t_harvest.id_method_sample IS 'Mode d’échantillonnage';
COMMENT ON COLUMN t_harvest.is_soil_sampling IS 'Prélèvement de terre';
COMMENT ON COLUMN t_harvest.protocol_note IS 'Protocoles et astuces';
COMMENT ON COLUMN t_harvest.place_comment IS 'Commentaire sur la location(lieudit, comm_loc)';
COMMENT ON COLUMN t_harvest.id_phenology_1 IS 'Phénologie';
COMMENT ON COLUMN t_harvest.id_phenology_2 IS 'Phénologie';
COMMENT ON COLUMN t_harvest.geom IS 'Coordonnées GPS';
COMMENT ON COLUMN t_harvest.location_code IS 'Code de la commune, du département';
COMMENT ON COLUMN t_harvest.precision IS 'Résolution de la localisation en mètres';
COMMENT ON COLUMN t_harvest.surface IS 'En m2';
COMMENT ON COLUMN t_harvest.id_foot_counting_class IS 'Classes dindividu';
COMMENT ON COLUMN t_harvest.protocole_note IS 'Protocoles et astuces';
COMMENT ON COLUMN t_harvest.comment IS 'Remarques générales';

-- Table `t_seed`
CREATE TABLE "t_seed" (
	"id_seed" SERIAL NOT NULL UNIQUE,
	"uuid_seed" UUID DEFAULT uuid_generate_v4() UNIQUE,
	"num_seed" VARCHAR(10) NOT NULL,
	-- Clé étrangère ES.exsitu.t_harvest
	"id_harvest" INTEGER,
	-- Saisi du taxon
	"sciname_cited" VARCHAR(256),
	-- Clé étrangère GN.taxonomie.taxonomie.taxref.cd_nom
	"cd_nom" INTEGER,
	"remarks" TEXT,
	"id_form1" INTEGER,
	"id_form2" INTEGER,
	-- Longueur moyenne (mm)
	"length" DECIMAL,
	-- Largeur moyenne (mm)
	"width" DECIMAL,
	-- Epaisseur moyenne (mm)
	"thickness" DECIMAL,
	-- Type de semences
	"id_type_atwater" INTEGER,
	-- Masse totale (g) 
	"total_mass_g" DECIMAL,
	-- Quantité de semences pesées
	"sample_weight" DECIMAL,
	-- Masse de la pesée (g)
	"sample_mass_g" DECIMAL,
	-- Nombre moyenne semence
	-- 
	"avg_num_seeds" DECIMAL,
	-- Masse moyenne unitaire
	-- 
	"avg_unit_mass" DECIMAL,
	-- Quantité initiale globale
	"initial_quantity" INTEGER,
	-- Quantité en cours
	"current_quantity" INTEGER,
	-- Etat du lot
	"id_seed_quality" INTEGER,
	-- Scan des semences
	"is_photo_observed" BOOLEAN,
	-- Pré-séchage début
	"pre_dry_start" DATE,
	-- Pré-séchage fin
	"pre_dry_end" DATE,
	-- Pré-séchage durée
	"pre_dry_duration" INTEGER,
	-- Pré-séchage tri
	"is_pre_dry_sorted" BOOLEAN,
	-- Pré-séchage astuce
	"pre_dry_tips" TEXT,
	-- Dessiccation début
	"dry_start" DATE,
	-- Dessiccation fin
	"dry_end" DATE,
	-- Dessiccation durée
	"dry_duration" INTEGER,
	-- Lyophilisation
	"is_freeze_dried" BOOLEAN,
	-- Date de conditionnement
	"packaging_date" DATE,
	-- Statut lot actif
	"is_lot_active" BOOLEAN,
	-- Statut lot date
	"lot_status_date" DATE,
	-- Excroissance
	"id_growth1" INTEGER,
	-- Excroissance
	"id_growth2" INTEGER,
	-- Ornementation
	"id_decoration1" INTEGER,
	-- Ornementation
	"id_decoration2" INTEGER,
	-- Type embryon
	"id_embryo_type1" INTEGER,
	-- Type embryon
	"id_embryo_type2" INTEGER,
	-- Unité de dissémination
	"id_diss_unit" INTEGER,
	-- Commentaire dimension forme
	-- 
	"dimension_shape_comment" TEXT,
	"id_media" INTEGER,
	"id_bib_table_location" INTEGER,
	"additional_data" JSONB,
	"meta_create_by" INTEGER NOT NULL,
	"meta_create_date" TIMESTAMP NOT NULL DEFAULT now(),
	"meta_update_by" INTEGER,
	"meta_update_date" TIMESTAMP,
	PRIMARY KEY("id_seed")
);
COMMENT ON COLUMN t_seed.id_harvest IS 'Clé étrangère ES.exsitu.t_harvest';
COMMENT ON COLUMN t_seed.sciname_cited IS 'Saisi du taxon';
COMMENT ON COLUMN t_seed.cd_nom IS 'Clé étrangère GN.taxonomie.taxonomie.taxref.cd_nom';
COMMENT ON COLUMN t_seed.length IS 'Longueur moyenne (mm)';
COMMENT ON COLUMN t_seed.width IS 'Largeur moyenne (mm)';
COMMENT ON COLUMN t_seed.thickness IS 'Epaisseur moyenne (mm)';
COMMENT ON COLUMN t_seed.id_type_atwater IS 'Type de semences';
COMMENT ON COLUMN t_seed.total_mass_g IS 'Masse totale (g) ';
COMMENT ON COLUMN t_seed.sample_weight IS 'Quantité de semences pesées';
COMMENT ON COLUMN t_seed.sample_mass_g IS 'Masse de la pesée (g)';
COMMENT ON COLUMN t_seed.avg_num_seeds IS 'Nombre moyenne semence
';
COMMENT ON COLUMN t_seed.avg_unit_mass IS 'Masse moyenne unitaire
';
COMMENT ON COLUMN t_seed.initial_quantity IS 'Quantité initiale globale';
COMMENT ON COLUMN t_seed.current_quantity IS 'Quantité en cours';
COMMENT ON COLUMN t_seed.id_seed_quality IS 'Etat du lot';
COMMENT ON COLUMN t_seed.is_photo_observed IS 'Scan des semences';
COMMENT ON COLUMN t_seed.pre_dry_start IS 'Pré-séchage début';
COMMENT ON COLUMN t_seed.pre_dry_end IS 'Pré-séchage fin';
COMMENT ON COLUMN t_seed.pre_dry_duration IS 'Pré-séchage durée';
COMMENT ON COLUMN t_seed.is_pre_dry_sorted IS 'Pré-séchage tri';
COMMENT ON COLUMN t_seed.pre_dry_tips IS 'Pré-séchage astuce';
COMMENT ON COLUMN t_seed.dry_start IS 'Dessiccation début';
COMMENT ON COLUMN t_seed.dry_end IS 'Dessiccation fin';
COMMENT ON COLUMN t_seed.dry_duration IS 'Dessiccation durée';
COMMENT ON COLUMN t_seed.is_freeze_dried IS 'Lyophilisation';
COMMENT ON COLUMN t_seed.packaging_date IS 'Date de conditionnement';
COMMENT ON COLUMN t_seed.is_lot_active IS 'Statut lot actif';
COMMENT ON COLUMN t_seed.lot_status_date IS 'Statut lot date';
COMMENT ON COLUMN t_seed.id_growth1 IS 'Excroissance';
COMMENT ON COLUMN t_seed.id_growth2 IS 'Excroissance';
COMMENT ON COLUMN t_seed.id_decoration1 IS 'Ornementation';
COMMENT ON COLUMN t_seed.id_decoration2 IS 'Ornementation';
COMMENT ON COLUMN t_seed.id_embryo_type1 IS 'Type embryon';
COMMENT ON COLUMN t_seed.id_embryo_type2 IS 'Type embryon';
COMMENT ON COLUMN t_seed.id_diss_unit IS 'Unité de dissémination';
COMMENT ON COLUMN t_seed.dimension_shape_comment IS 'Commentaire dimension forme
';


-- Table `t_seed_stock`
CREATE TABLE "t_seed_stock" (
	"id_stock" SERIAL NOT NULL UNIQUE,
	"uuid_stock" UUID DEFAULT uuid_generate_v4(),
	-- N° semence
	"id_seed" INTEGER NOT NULL,
	-- Localisation
	"id_stock_location" INTEGER NOT NULL,
	-- Quantité initiale
	"initial_quantity" INTEGER NOT NULL,
	-- Quantité en cours
	"current_quantity" INTEGER NOT NULL,
	-- Date stockage
	"stock_date" DATE,
	PRIMARY KEY("id_stock")
);
COMMENT ON COLUMN t_seed_stock.id_seed IS 'N° semence';
COMMENT ON COLUMN t_seed_stock.id_stock_location IS 'Localisation';
COMMENT ON COLUMN t_seed_stock.initial_quantity IS 'Quantité initiale';
COMMENT ON COLUMN t_seed_stock.current_quantity IS 'Quantité en cours';
COMMENT ON COLUMN t_seed_stock.stock_date IS 'Date stockage';


-- Table `t_seed_stock_mouvement`
CREATE TABLE "t_seed_stock_mouvement" (
	"id_seed_stock_mvt" SERIAL NOT NULL UNIQUE,
	"uuid_stock_mvt" UUID DEFAULT uuid_generate_v4(),
	-- N° de stock(Localisation)
	"id_stock" INTEGER NOT NULL,
	-- Date de sortie
	"stock_mvt_date" DATE NOT NULL,
	-- Type de sortie
	"id_stock_flow" INTEGER NOT NULL,
	-- Quantité
	"quantity" INTEGER NOT NULL,
	"mvt_comment" TEXT,
	"role_mvmt" CHAR(4) NOT NULL,
	PRIMARY KEY("id_seed_stock_mvt")
);
COMMENT ON COLUMN t_seed_stock_mouvement.id_stock IS 'N° de stock(Localisation)';
COMMENT ON COLUMN t_seed_stock_mouvement.stock_mvt_date IS 'Date de sortie';
COMMENT ON COLUMN t_seed_stock_mouvement.id_stock_flow IS 'Type de sortie';
COMMENT ON COLUMN t_seed_stock_mouvement.quantity IS 'Quantité';


CREATE TABLE "t_seed_tablet" (
	"id_seed_tablet" SERIAL NOT NULL UNIQUE,
	"uuid_tablet" UUID DEFAULT uuid_generate_v4(),
	"id_stock" INTEGER NOT NULL,
	-- Date de l’évaluation
	"evaluation_date" DATE NOT NULL,
	-- Evaluation de la couleur des pastilles
	"id_tablet_color" INTEGER NOT NULL,
	-- Date de changement des pastilles
	"tablet_change_date" DATE,
	"remaks" TEXT,
	PRIMARY KEY("id_seed_tablet")
);
COMMENT ON COLUMN t_seed_tablet.evaluation_date IS 'Date de l’évaluation';
COMMENT ON COLUMN t_seed_tablet.id_tablet_color IS 'Evaluation de la couleur des pastilles';
COMMENT ON COLUMN t_seed_tablet.tablet_change_date IS 'Date de changement des pastilles';


CREATE TABLE "cor_observer_harvest" (
	"id_observer" INTEGER NOT NULL,
	"id_harvest" INTEGER NOT NULL,
	"is_main_observer" BOOLEAN DEFAULT FALSE,
	PRIMARY KEY("id_observer", "id_harvest")
);


-- --------------------------------------------------------------------------------
-- FOREING KEYS
-- TODO: check if all DELETE CASCADE are necessary

ALTER TABLE "t_seed_stock"
ADD FOREIGN KEY("id_seed") REFERENCES "t_seed"("id_seed")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("meta_update_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("meta_create_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("meta_create_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("meta_update_by") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_phenology_1") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_phenology_2") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_foot_counting_class") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_method_sample") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_harvest_material") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_harvest_type") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_type_atwater") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_form2") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_form1") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_seed_quality") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_diss_unit") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_embryo_type1") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_embryo_type2") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_decoration2") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_decoration1") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_growth1") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_growth2") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed_stock"
ADD FOREIGN KEY("id_stock_location") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed_stock_mouvement"
ADD FOREIGN KEY("id_stock_flow") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_harvest") REFERENCES "t_harvest"("id_harvest")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "cor_observer_harvest"
ADD FOREIGN KEY("id_harvest") REFERENCES "t_harvest"("id_harvest")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "cor_observer_harvest"
ADD FOREIGN KEY("id_observer") REFERENCES utilisateurs.t_roles(id_role)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed_tablet"
ADD FOREIGN KEY("id_tablet_color") REFERENCES ref_nomenclatures.t_nomenclatures(id_nomenclature)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed_stock_mouvement"
ADD FOREIGN KEY("id_stock") REFERENCES "t_seed_stock"("id_stock")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("cd_nom") REFERENCES taxonomie.taxref(cd_nom)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("cd_hab") REFERENCES ref_habitats.habref(cd_hab)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("id_dataset") REFERENCES gn_meta.t_datasets(id_dataset)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("id_bib_table_location") REFERENCES gn_commons.bib_tables_location(id_table_location)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed"
ADD FOREIGN KEY("cd_nom") REFERENCES taxonomie.taxref(cd_nom)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_harvest"
ADD FOREIGN KEY("location_code") REFERENCES ref_geo.l_areas(id_area)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "t_seed_tablet"
ADD FOREIGN KEY("id_stock") REFERENCES "t_seed_stock"("id_stock")
ON UPDATE NO ACTION ON DELETE NO ACTION;