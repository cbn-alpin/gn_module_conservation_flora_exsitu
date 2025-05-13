# Conservation Flora Exsitu

Outil de gestion des récoltes de graines (ex-situ et in-situ), de leur stockage, des tests de germination, des semis et de leur mise en culture.

## Installation et configuration

- Se référer à la documentation GeoNature pour l'installation d’un module :  
  📄 [Installation d’un module GeoNature](https://docs.geonature.fr/installation.html#installation-d-un-module-geonature)

- Créez le fichier de configuration du module (`conservation_flora_exsitu_config.toml`) dans le dossier `config`, en se basant sur le fichier d’exemple existant :  
  `conservation_flora_exsitu_config.example.toml`.

- Ensuite, créez un **lien symbolique** vers ce fichier dans le dossier `config` de GeoNature, par exemple :

  ```bash
  ln -s /chemin/vers/conservation_flora_exsitu_config.toml /chemin/vers/geonature/config/
  ```


## Mettre à jour la colonne centroid de la table l_areas(si c'est pas encore fait)
Lancer la requête suivante pour mettre à jour la colonne centroid avec le centroïde de la géométrie :

```
UPDATE ref_geo.l_areas SET centroid = ST_Centroid(geom) WHERE centroid IS NULL;
```

## Associer d'une liste d'utilisateurs pour créer des récoltes
Renseigner le paramètre `observers_list_code` qui par défaut prend la valeur `OFS`. Renseigner la table de correspondance `cor_role_liste` pour associer des utilisateurs à cette liste.

## Désinstallation
**⚠️ ATTENTION :** la désinstallation du module implique la suppression de toutes les données associées. Assurez vous d'avoir fait une sauvegarde de votre base de données au préalable.

Suivez la procédure suivante (commandes à exécuter dans `venv`):
1. Rétrograder la base de données pour y enlever les données spécifiques au module :
    ```bash
    geonature db downgrade conservation_flora_exsitu@base
    ```
    ```bash
    geonature db stamp conservation_flora_exsitu@base
    ```
2. Désinstaller le package du virtual env: 
    ```
    pip uninstall -y gn_module_conservation_flora_exsitu
    ```
    - Possibilité de voir le nom du module avec : `pip list`

3. Supprimer le lien symbolique du module (`conservation_flora_exsitu`) dans le dossier :
    - `geonature/frontend/external_modules`
3. Supprimer le lien symbolique du fichier de config dans le dossier :
    - `geonature/config`
