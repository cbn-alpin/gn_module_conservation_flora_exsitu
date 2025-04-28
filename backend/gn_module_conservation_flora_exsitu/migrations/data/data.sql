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


-- Create the "CFE_ACTION_TYPE" nomenclature type
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (
    mnemonique, label_default, definition_default, label_fr, definition_fr, source
) VALUES (
    'CFE_ACTION_TYPE',
    'Type action',
    'Nomenclature des types action.',
    'Type action',
    'Nomenclature des types action.',
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

-- TAXONOMY

-- Update TaxHub attributes themes
INSERT INTO taxonomie.bib_themes (
    nom_theme,
    desc_theme,
    ordre,
    id_droit
) VALUES (
    'Description semence',
    'Description de semence pour le module flora exsitu',
    (SELECT MAX(ordre) + 1 FROM taxonomie.bib_themes LIMIT 1),
    4 -- TODO : Voir à quoi cela correspond
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
    'cfe_form1',
    'Forme 1',
    '{"values":["Biconvexe","Circulaire","Cordiforme","Deltoïde","Elliptique","En forme de C","En forme de D","Irrégulière","Linéaire","Oblongue","Obovoïde","Ovoïde","Pyriforme","Quadrangulaire","Rectangulaire","Réniforme","Sigmoïde","Triangulaire","Obconique","Cunéiforme","Globulaire","Lanceolé","Oblancéolé","En forme de secteur","Cylindrique","Falciforme","Cymbiform"]}',
    False,
    'Forme 1 de la semence',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1
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
    'cfe_form2',
    'Forme 2',
    '{"values":["Biconvexe","Circulaire","Cordiforme","Deltoïde","Elliptique","En forme de C","En forme de D","Irrégulière","Linéaire","Oblongue","Obovoïde","Ovoïde","Pyriforme","Quadrangulaire","Rectangulaire","Réniforme","Sigmoïde","Triangulaire","Obconique","Cunéiforme","Globulaire","Lanceolé","Oblancéolé","En forme de secteur","Cylindrique","Falciforme","Cymbiform"]}',
    False,
    'Forme 2 de la semence',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1
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
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1
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
    'cfe_excroissance1',
    'Excroissance 1',
    '{"values":["Aile","Arille","Aucune","Caroncule","Funicule","Pappus","Apex","Trichome","Couronne"]}',
    False,
    'Excroissance 1',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1
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
    'cfe_excroissance2',
    'Excroissance 2',
    '{"values":["Aile","Arille","Aucune","Caroncule","Funicule","Pappus","Apex","Trichome","Couronne"]}',
    False,
    'Excroissance 2',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1
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
    'cfe_ornementation1',
    'Ornementation 1',
    '{"values":["Aiguillons","Aréoles","Ecailles","En forme échelles","En forme de viscères","Finement nervurée","Granulations","Lignes","Lignes parallèles très fines","Nervures","Ondulations","Petites dépressions","Petites dépressions réticulées","Petits pointillés","Pointillés","Ponctuations","Pustules","Renflements arrondis","Réticules","Rides","Sillons","Stries ou Côtes","Très petites dépressions","Tubercules","Verrues","Grosses dépressions","Alvéoles","Lisse","Tout petits pointillés"]}',
    False,
    'Ornementation 1',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1
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
    'cfe_ornementation2',
    'Ornementation 2',
    '{"values":["Aiguillons","Aréoles","Ecailles","En forme échelles","En forme de viscères","Finement nervurée","Granulations","Lignes","Lignes parallèles très fines","Nervures","Ondulations","Petites dépressions","Petites dépressions réticulées","Petits pointillés","Pointillés","Ponctuations","Pustules","Renflements arrondis","Réticules","Rides","Sillons","Stries ou Côtes","Très petites dépressions","Tubercules","Verrues","Grosses dépressions","Alvéoles","Lisse","Tout petits pointillés"]}',
    False,
    'Ornementation 2',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1
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
    'cfe_embryo_type1',
    'Type embryon 1',
    '{"values":["Axial","Basal","Feuillé","Miniature","Périphérique","Spiralé"]}',
    False,
    'Type embryon 1',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1
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
    'cfe_embryo_type2',
    'Type embryon 2',
    '{"values":["Axial","Basal","Feuillé","Miniature","Périphérique","Spiralé"]}',
    False,
    'Type embryon 2',
    'text',
    'multiselect',
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1
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
    (SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1),
    (SELECT COALESCE(MAX(ordre) + 1, 1) FROM taxonomie.bib_attributs WHERE id_theme = (
        SELECT id_theme FROM taxonomie.bib_themes WHERE nom_theme = 'Description semence' LIMIT 1
    ) LIMIT 1)
) ;
