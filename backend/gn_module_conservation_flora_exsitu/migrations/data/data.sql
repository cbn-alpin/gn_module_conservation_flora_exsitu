-- Insert Flora exsitu default data (nomenclatures, module)
-- NOMENCLATURE

-- Create the "CFE_HARVEST_TYPE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_HARVEST_TYPE',
    'Type de récolte',
    'Nomenclature des types de récoltes.',
    'Type de récolte',
    'Nomenclature des types de récoltes.',
    'CBNA'
) ;


-- Create the "CFE_METHOD_SAMPLE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_METHOD_SAMPLE',
    'Type de mode d’échantillonnage',
    'Nomenclature des types d’échantillonnage.',
    'Type de mode d’échantillonnage',
    'Nomenclature des types d’échantillonnage.',
    'CBNA'
) ;


-- Create the "CFE_HARVEST_MATERIAL" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_HARVEST_MATERIAL',
    'Type de matériel végétal récolté',
    'Nomenclature des types de matériel végétal récolté.',
    'Type de matériel végétal récolté',
    'Nomenclature des types de matériel végétal récolté.',
    'CBNA'
) ;


-- Create the "CFE_FOOT_COUNTING_CLASS" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_FOOT_COUNTING_CLASS',
    'Type de classes d’individus',
    'Nomenclature des types de classes d’individus.',
    'Type de classes d’individus',
    'Nomenclature des types de classes d’individus.',
    'CBNA'
) ;


-- Create the "CFE_PHENOLOGY" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_PHENOLOGY',
    'Type de phénologie',
    'Nomenclature des types de phénologie.',
    'Type de phénologie',
    'Nomenclature des types de phénologie.',
    'CBNA'
) ;


-- Create the "CFE_FORM" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_FORM',
    'Type de forme de graine',
    'Nomenclature des types de forme de graine.',
    'Type de forme de graine',
    'Nomenclature des types de forme de graine.',
    'CBNA'
) ;


-- Create the "CFE_ATWATER_TYPE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_ATWATER_TYPE',
    'Type de semence',
    'Nomenclature des types de semences.',
    'Type de semence',
    'Nomenclature des types de semences.',
    'CBNA'
) ;


-- Create the "CFE_SEED_QUALITY" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_SEED_QUALITY',
    'Type de qualité de semence',
    'Nomenclature des types de qualité de semence.',
    'Type de qualité de semence',
    'Nomenclature des types de qualité de semence.',
    'CBNA'
) ;


-- Create the "CFE_GROWTH" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_GROWTH',
    'Type d''excroissance',
    'Nomenclature des types d''excroissances.',
    'Type d''excroissance',
    'Nomenclature des types d''excroissances.',
    'CBNA'
) ;


-- Create the "CFE_DECORATION" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_DECORATION',
    'Type d''ornementation',
    'Nomenclature des types d''ornementations.',
    'Type d''ornementation',
    'Nomenclature des types d''ornementations.',
    'CBNA'
) ;


-- Create the "CFE_EMBRYO_TYPE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_EMBRYO_TYPE',
    'Type d''embryon',
    'Nomenclature des types d''embryons.',
    'Type d''embryon',
    'Nomenclature des types d''embryons.',
    'CBNA'
) ;


-- Create the "CFE_UNIT" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_UNIT',
    'Type d''unité de dissémination',
    'Nomenclature des types d''unité de dissémination.',
    'Type d''unité de dissémination',
    'Nomenclature des types d''unité de dissémination.',
    'CBNA'
) ;


-- Create the "CFE_STOCK_LOCATION" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_STOCK_LOCATION',
    'Type de stock localisation',
    'Nomenclature des types de stock de localisation.',
    'Type de stock localisation',
    'Nomenclature des types de stock de localisation.',
    'CBNA'
) ;


-- Create the "CFE_STOCK_FLOW" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_STOCK_FLOW',
    'Type de sortie',
    'Nomenclature des types de sorties.',
    'Type de sortie',
    'Nomenclature des types de sorties.',
    'CBNA'
) ;


-- Create the "CFE_COLOR_TABLET" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_COLOR_TABLET',
    'Type de couleur',
    'Nomenclature des types de couleurs.',
    'Type de couleur',
    'Nomenclature des types de couleurs.',
    'CBNA'
) ;


-- Create the "CFE_DISSEMINATION_UNIT" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_DISSEMINATION_UNIT',
    'Type d''unité de dissémination',
    'Nomenclature des types d''unité de dissémination.',
    'Type d''unité de dissémination',
    'Nomenclature des types d''unité de dissémination.',
    'CBNA'
) ;

-- --------------------------------------------------------------------------------
-- COMMONS

-- Add module

UPDATE gn_commons.t_modules
SET
    module_label = 'FLORA EXSITU',
    module_picto = 'fa-envira',
    module_desc = 'Outil de gestion des récoltes de graines (ex-situ et in-situ), de leur stockage, des tests de germination, des semis et mise en culture.',
    module_doc_url = 'https://github.com/cbn-alpin/gn_module_conservation_flora_exsitu'
WHERE module_code = :moduleCode ;
