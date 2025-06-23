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


-- Create the "CFE_MATERIAL_QUALITY" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_MATERIAL_QUALITY',
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


-- Create the "CFE_PLACE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_PLACE',
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

-- Create the "CFE_GEOGRAPHICAL_PRECISION" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_GEOGRAPHICAL_PRECISION',
    'Précision géographique',
    'Nomenclature des types de précision géographique.',
    'Précision géographique',
    'Nomenclature des types de précision géographique.',
    'CBNA'
) ;

-- Create the "CFE_DRY_TYPE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_DRY_TYPE',
    'Type de séchage',
    'Nomenclature des types de séchage.',
    'Type de séchage',
    'Nomenclature des types de séchage.',
    'CBNA'
) ;

-- Create the "CFE_HUMIDITY_LEVEL" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_HUMIDITY_LEVEL',
    'Type de level humidité',
    'Nomenclature des types de level humidité.',
    'Type de level humidité',
    'Nomenclature des types de level humidité.',
    'CBNA'
) ;

-- Create the "CFE_DESTOCK" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_DESTOCK',
    'Type de déstockage',
    'Nomenclature des types de déstockage.',
    'Type de déstockage',
    'Nomenclature des types de déstockage.',
    'CBNA'
) ;

-- Create the "CFE_DESTINATION" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_DESTINATION',
    'Type de destination',
    'Nomenclature des types de destination.',
    'Type de destination',
    'Nomenclature des types de destination.',
    'CBNA'
) ;

-- Create the "CFE_INTERNAL_DESTINATION" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_INTERNAL_DESTINATION',
    'Type de destination intérieure',
    'Nomenclature des types de destination intérieure.',
    'Type de destination intérieure',
    'Nomenclature des types de destination intérieure.',
    'CBNA'
) ;

-- Create the "CFE_EXTERNAL_DESTINATION" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_EXTERNAL_DESTINATION',
    'Type de destination extérieure',
    'Nomenclature des types de destination extérieure.',
    'Type de destination extérieure',
    'Nomenclature des types de destination extérieure.',
    'CBNA'
) ;

-- Create the "CFE_HUMIDITY_DEVICE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_HUMIDITY_DEVICE',
    'Type de testeur humidité',
    'Nomenclature des types de testeur humidité.',
    'Type de testeur humidité',
    'Nomenclature des types de testeur humidité.',
    'CBNA'
) ;


-- Create the "CFE_STORAGE_ACTION" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_STORAGE_ACTION',
    'Type action',
    'Nomenclature des types action.',
    'Type action',
    'Nomenclature des types action.',
    'CBNA'
) ;

-- Create the "CFE_MEDIA_TYPE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_MEDIA_TYPE',
    'Type de média',
    'Nomenclature des types de média.',
    'Type de média',
    'Nomenclature des types de média.',
    'CBNA'
) ;

-- Create the "CFE_WATERING_METHOD" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_WATERING_METHOD',
    'Méthode arrosage',
    'Nomenclature des méthodes arrosage.',
    'Méthode arrosage',
    'Nomenclature des méthodes arrosage.',
    'conservation_flora_exsitu'
) ;

-- Create the "CFE_SOWING_METHOD" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_SOWING_METHOD',
    'Méthode de semis',
    'Nomenclature des méthodes de semis.',
    'Méthode de semis',
    'Nomenclature des méthodes de semis.',
    'conservation_flora_exsitu'
) ;

-- Create the "CFE_TEST_SUBSTRATE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_TEST_SUBSTRATE',
    'Type de substrat',
    'Nomenclature des types de substrat.',
    'Type de substrat',
    'Nomenclature des types de substrat.',
    'conservation_flora_exsitu'
) ;

-- Create the "CFE_WATER_TYPE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_WATER_TYPE',
    'Type de liquide',
    'Nomenclature des types de liquide.',
    'Type de liquide',
    'Nomenclature des types de liquide.',
    'conservation_flora_exsitu'
) ;

-- Create the "CFE_TG_SUPPORT" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_TG_SUPPORT',
    'Type de support',
    'Nomenclature des types de support.',
    'Type de support',
    'Nomenclature des types de support.',
    'conservation_flora_exsitu'
) ;

-- Create the "CFE_SOWING_LOCATION" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_SOWING_LOCATION',
    'Lieu de semis',
    'Nomenclature des lieux de semis.',
    'Lieu de semis',
    'Nomenclature des lieux de semis.',
    'conservation_flora_exsitu'
);

-- Create the "CFE_TEST_TYPE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_TEST_TYPE',
    'Type de test',
    'Nomenclature des types de test.',
    'Type de test',
    'Nomenclature des types de test.',
    'conservation_flora_exsitu'
);

-- Create the "CFE_SCARIFICATION_TYPE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_SCARIFICATION_TYPE',
    'Type de scarification',
    'Nomenclature des types de scarification.',
    'Type de scarification',
    'Nomenclature des types de scarification.',
    'conservation_flora_exsitu'
);

-- Create the "CFE_SOWING_SUBSTRATE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_SOWING_SUBSTRATE',
    'Substrat de semis',
    'Nomenclature des substrats utilisés pour les semis.',
    'Substrat de semis',
    'Nomenclature des substrats utilisés pour les semis.',
    'conservation_flora_exsitu'
);

-- Create the "CFE_SOWING_CONTAINER" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_SOWING_CONTAINER',
    'Contenant de semis',
    'Nomenclature des contenants utilisés pour les semis.',
    'Contenant de semis',
    'Nomenclature des contenants utilisés pour les semis.',
    'conservation_flora_exsitu'
);

-- Create the "CFE_ACTION_TYPE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_ACTION_TYPE',
    'Type d’action',
    'Nomenclature des types d’action appliquées aux semences.',
    'Type d’action',
    'Nomenclature des types d’action appliquées aux semences.',
    'conservation_flora_exsitu'
);

-- Create the "CFE_CHEMICAL" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_CHEMICAL',
    'Produit chimique',
    'Nomenclature des produits chimiques utilisés pour les semences.',
    'Produit chimique',
    'Nomenclature des produits chimiques utilisés pour les semences.',
    'conservation_flora_exsitu'
);

-- Create the "CFE_LIQUID" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_LIQUID',
    'Liquide',
    'Nomenclature des liquides utilisés pour les semences ou les tests.',
    'Liquide',
    'Nomenclature des liquides utilisés pour les semences ou les tests.',
    'conservation_flora_exsitu'
);



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

-- TAXONOMY

-- Update TaxHub attributes themes
INSERT INTO taxonomie.bib_themes (
    nom_theme,
    desc_theme,
    ordre
) VALUES (
    'Semence',
    'Description des semences(graines) pour le module flora exsitu',
    (SELECT MAX(ordre) + 1 FROM taxonomie.bib_themes LIMIT 1)
) ;

-- Update TaxHub attributes
INSERT INTO taxonomie.bib_attributs (
    nom_attribut,
    label_attribut,
    liste_valeur_attribut,
    obligatoire,
    desc_attribut,
    type_attribut,
    type_widget,
    id_theme,
    ordre
) VALUES (
    'cfe_form',
    'Forme',
    '{"values":["Biconvexe","Circulaire","Cordiforme","Deltoïde","Elliptique","En forme de C","En forme de D","Irrégulière","Linéaire","Oblongue","Obovoïde","Ovoïde","Pyriforme","Quadrangulaire","Rectangulaire","Réniforme","Sigmoïde","Triangulaire","Obconique","Cunéiforme","Globulaire","Lanceolé","Oblancéolé","En forme de secteur","Cylindrique","Falciforme","Cymbiform"]}',
    False,
    'Forme de la semence',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1
    ) LIMIT 1)
) ;

INSERT INTO taxonomie.bib_attributs (
    nom_attribut,
    label_attribut,
    liste_valeur_attribut,
    obligatoire,
    desc_attribut,
    type_attribut,
    type_widget,
    id_theme,
    ordre
) VALUES (
    'cfe_type_albumen',
    'Type de semences',
    '{"values":["Périsperme","Albuminée","Exalbuminée"]}',
    False,
    'Type de semences',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1
    ) LIMIT 1)
) ;

INSERT INTO taxonomie.bib_attributs (
    nom_attribut,
    label_attribut,
    liste_valeur_attribut,
    obligatoire,
    desc_attribut,
    type_attribut,
    type_widget,
    id_theme,
    ordre
) VALUES (
    'cfe_excroissance',
    'Excroissance',
    '{"values":["Aile","Arille","Aucune","Caroncule","Funicule","Pappus","Apex","Trichome","Couronne"]}',
    False,
    'Excroissance',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1
    ) LIMIT 1)
) ;

INSERT INTO taxonomie.bib_attributs (
    nom_attribut,
    label_attribut,
    liste_valeur_attribut,
    obligatoire,
    desc_attribut,
    type_attribut,
    type_widget,
    id_theme,
    ordre
) VALUES (
    'cfe_ornementation',
    'Ornementation',
    '{"values":["Aiguillons","Aréoles","Ecailles","En forme échelles","En forme de viscères","Finement nervurée","Granulations","Lignes","Lignes parallèles très fines","Nervures","Ondulations","Petites dépressions","Petites dépressions réticulées","Petits pointillés","Pointillés","Ponctuations","Pustules","Renflements arrondis","Réticules","Rides","Sillons","Stries ou Côtes","Très petites dépressions","Tubercules","Verrues","Grosses dépressions","Alvéoles","Lisse","Tout petits pointillés"]}',
    False,
    'Ornementation',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1
    ) LIMIT 1)
) ;

INSERT INTO taxonomie.bib_attributs (
    nom_attribut,
    label_attribut,
    liste_valeur_attribut,
    obligatoire,
    desc_attribut,
    type_attribut,
    type_widget,
    id_theme,
    ordre
) VALUES (
    'cfe_embryo_type',
    'Type embryon',
    '{"values":["Axial","Basal","Feuillé","Miniature","Périphérique","Spiralé"]}',
    False,
    'Type embryon',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1
    ) LIMIT 1)
) ;

INSERT INTO taxonomie.bib_attributs (
    nom_attribut,
    label_attribut,
    liste_valeur_attribut,
    obligatoire,
    desc_attribut,
    type_attribut,
    type_widget,
    id_theme,
    ordre
) VALUES (
    'cfe_comm_dim_forme',
    'Commentaire dimension',
    '{}',
    False,
    'Commentaire dimension',
    'text',
    'textarea',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Semence' LIMIT 1
    ) LIMIT 1)
) ;


INSERT INTO gn_commons.bib_tables_location 
    (schema_name, table_name, pk_field, uuid_field_name, table_desc)
    VALUES 
    ('pr_conservation_flora_exsitu', 't_material_seed', 'id_seed', 'unique_id_seed', 'Semences associées au matériel');
