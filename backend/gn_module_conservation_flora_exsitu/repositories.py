from geonature.utils.env import db
from sqlalchemy.exc import SQLAlchemyError
from pypnusershub.db.models import User
from datetime import datetime, date
from shapely.geometry import shape
from geoalchemy2.shape import from_shape
from pypn_habref_api.models import Habref
from pypnnomenclature.models import TNomenclatures
from sqlalchemy.orm import aliased
from flask import jsonify
from ref_geo.models import LAreas, BibAreasTypes
from apptax.taxonomie.models import Taxref
from sqlalchemy import func
import json
from sqlalchemy import and_


from .models import(
    THarvest,
    TSeed,
    THarvestMaterial,
    CorHarvestObserver,
    TSeedStock,
    TSeedStockMouvement,
    TSeedTablet,
    CorMaterialTaxon,
)


class HarvestRepository:
    date_fmt = "%Y-%m-%d"
    date_time_fmt = "%Y-%m-%d %H:%M:%S"
    def _convert_geojson_to_ewkt(self, geojson):
        if not geojson:
            return None
        
        try:
            geometry = shape(geojson)
            ewkt = from_shape(geometry, srid=2154)
            return ewkt
        except Exception as e:
            raise ValueError(f"Erreur de conversion GeoJSON -> EWKT : {e}")

    def get_one(self, harvest_id):
        NomenclatureType = aliased(TNomenclatures) 
        NomenclatureExpo = aliased(TNomenclatures)

        query = (
            db.session.query(
                THarvest.id_harvest,
                THarvest.date_start,
                Habref.lb_hab_fr.label("cd_hab_label"),
                NomenclatureType.label_default.label("harvest_type_label"),
                NomenclatureExpo.label_default.label("exposition_label"),
                THarvestMaterial
            )
            .outerjoin(Habref, THarvest.cd_hab == Habref.cd_hab)
            .outerjoin(NomenclatureType, THarvest.id_harvest_type == NomenclatureType.id_nomenclature) 
            .outerjoin(NomenclatureExpo, THarvest.id_exposition == NomenclatureExpo.id_nomenclature)
            .outerjoin(THarvestMaterial, THarvest.id_harvest == THarvestMaterial.id_harvest)
            .filter(THarvest.id_harvest == harvest_id)
        )

        return query.all() 
    
    
    def get_all(self, limit=100, offset=0):
        NomenclatureType = aliased(TNomenclatures) 
        NomenclatureExpo = aliased(TNomenclatures)

        query = (
            db.session.query(
                THarvest.id_harvest,
                THarvest.date_start,
                Habref.lb_hab_fr.label("cd_hab_label"),
                NomenclatureType.label_default.label("harvest_type_label"),
                NomenclatureExpo.label_default.label("exposition_label"),
                THarvestMaterial
            )
            .outerjoin(Habref, THarvest.cd_hab == Habref.cd_hab)
            .outerjoin(NomenclatureType, THarvest.id_harvest_type == NomenclatureType.id_nomenclature) 
            .outerjoin(NomenclatureExpo, THarvest.id_exposition == NomenclatureExpo.id_nomenclature)
            .outerjoin(THarvestMaterial, THarvest.id_harvest == THarvestMaterial.id_harvest)
            .limit(limit)
            .offset(offset)
        )
        return query.all()


    def create(self, data):
        try:
            if not data.get("meta_create_date"):
                data["meta_create_date"] = datetime.utcnow()

            if data.get("date_end") == "":
                data["date_end"] = data["date_start"]
            
            if data.get('geom'):
                # Convertir le GeoJSON en chaîne JSON valide
                geom_json = json.dumps(data['geom'])
                # Conversion en géométrie avec ST_GeomFromGeoJSON
                geom = func.ST_GeomFromGeoJSON(geom_json)
                # Si la géométrie est en WGS84 (SRID 4326), la transformer en Lambert-93 (SRID 2154)
                geom_transformed = func.ST_Transform(geom, 2154)
                data['geom'] = geom_transformed
            
            if data["location_type"] and not data.get('geom'):
                if data["location_type"] == 25:  # Commune
                    data["location_code"] = data.get("location_code_muni", [None])[0]
                elif data["location_type"] == 26:  # Département
                    data["location_code"] = data.get("location_code_dept", [None])[0]
    
                if data["location_code"]:
                    area = LAreas.query.get(data["location_code"])

                    if area and area.centroid :
                        data["geom"] = area.centroid

            data.pop("location_code_muni", None)
            data.pop("location_code_dept", None)

            observers_ids = data.pop("observers", [])
            additional_data = data.pop("additional_data", None)
                     
            if additional_data:
                harvest = THarvest(**data, additional_data=additional_data)
            else:
                harvest = THarvest(**data)

            db.session.add(harvest)
            db.session.commit()

            if observers_ids:
                observers = User.query.filter(User.id_role.in_(observers_ids)).all()
                
                for i, observer in enumerate(observers):
                    is_main = (i == 0)
                    association = CorHarvestObserver(
                        id_observer=observer.id_role, 
                        id_harvest=harvest.id_harvest,
                        is_main_observer=is_main
                    )
                    db.session.add(association)

            db.session.commit()
            return harvest
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    def update(self, id_harvest, data):
        try:
            data.pop("id_harvest", None)
            harvest = THarvest.query.get(id_harvest)
            if not harvest:
                raise Exception("Harvest not found")

            if not data.get("meta_update_date"):
                data["meta_update_date"] = datetime.utcnow()

            if data.get('geom'):
                geom_json = json.dumps(data['geom'])
                geom = func.ST_GeomFromGeoJSON(geom_json)
                geom_transformed = func.ST_Transform(geom, 2154)
                data['geom'] = geom_transformed
                harvest.location_code = None
                harvest.location_type = None

            if data["location_type"] and not data.get('geom'):
                if data["location_type"] == 25:
                    data["location_code"] = data.get("location_code_muni", [None])[0]
                elif data["location_type"] == 26:
                    data["location_code"] = data.get("location_code_dept", [None])[0]

                if data["location_code"]:
                    area = LAreas.query.get(data["location_code"])
                    if area and area.centroid:
                        data["geom"] = area.centroid

            data.pop("location_code_muni", None)
            data.pop("location_code_dept", None)

            additional_data = data.pop("additional_data", None)
            if additional_data:
                harvest.additional_data = additional_data
    
            observers_ids = data.pop("observers", [])

            for key, value in data.items():
                setattr(harvest, key, value)

            db.session.commit()

            if observers_ids:
                CorHarvestObserver.query.filter(CorHarvestObserver.id_harvest == harvest.id_harvest).delete()

                observers = User.query.filter(User.id_role.in_(observers_ids)).all()
                for i, observer in enumerate(observers):
                    is_main = (i == 0)
                    association = CorHarvestObserver(
                        id_observer=observer.id_role, 
                        id_harvest=harvest.id_harvest,
                        is_main_observer=is_main
                    )
                    db.session.add(association)

            db.session.commit()

            return harvest

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    
    def build_harvest_query(self, 
                            cd_nom_list, 
                            cd_hab, 
                            date_start, 
                            date_end, 
                            observers, 
                            municipalites, 
                            departements, 
                            id_harvest_type, 
                            code_material,
                        ):
        l_areas_dept = aliased(LAreas)
        l_areas_commune = aliased(LAreas)
        Taxref_valid = aliased(Taxref)

        query = db.session.query(
            THarvest.id_harvest,
            THarvest.date_start,
            THarvestMaterial.code_material,
            func.string_agg(Taxref_valid.lb_nom, ', ').label('taxons'),
            l_areas_dept.area_name.label('departement_name'),
            l_areas_dept.area_code.label('departement_code'),
            l_areas_commune.area_name.label('commune'),
            func.json_agg(
                func.json_build_object(
                    "prenom_role", User.prenom_role,
                    "nom_role", User.nom_role
                )
            ).label("observateurs")
        ).outerjoin(THarvestMaterial, THarvest.id_harvest == THarvestMaterial.id_harvest) \
        .outerjoin(CorMaterialTaxon, THarvestMaterial.id_material == CorMaterialTaxon.id_material) \
        .outerjoin(Taxref, CorMaterialTaxon.cd_nom == Taxref.cd_nom) \
        .outerjoin(Taxref_valid, Taxref.cd_ref == Taxref_valid.cd_nom) \
        .outerjoin(l_areas_dept, and_(THarvest.location_code == l_areas_dept.id_area, l_areas_dept.id_type == 26)) \
        .outerjoin(l_areas_commune, and_(THarvest.location_code == l_areas_commune.id_area, l_areas_commune.id_type == 25)) \
        .outerjoin(CorHarvestObserver, THarvest.id_harvest == CorHarvestObserver.id_harvest) \
        .outerjoin(User, CorHarvestObserver.id_observer == User.id_role)\
        .group_by(
            THarvest.id_harvest,
            THarvestMaterial.id_material,
            THarvest.date_start,
            THarvestMaterial.code_material,
            l_areas_dept.area_name,
            l_areas_dept.area_code,
            l_areas_commune.area_name,
        )

        if cd_nom_list:
            cd_ref_list = db.session.query(Taxref.cd_ref).filter(Taxref.cd_nom.in_(cd_nom_list)).distinct().all()
            cd_ref_list = [cd_ref[0] for cd_ref in cd_ref_list]
            cd_nom_list = db.session.query(Taxref.cd_nom).filter(Taxref.cd_ref.in_(cd_ref_list)).distinct().all()
            cd_nom_list = [cd_nom[0] for cd_nom in cd_nom_list]
            query = query.filter(CorMaterialTaxon.cd_nom.in_(cd_nom_list))

        if cd_hab:
            query = query.filter(THarvest.cd_hab == cd_hab)

        if date_start:
            query = query.filter(THarvest.date_start >= date_start)

        if date_end:
            query = query.filter(THarvest.date_start <= date_end)

        if observers:
            query = query.filter(User.id_role.in_(observers))

        if municipalites:
            query = query.filter(THarvest.location_code.in_(municipalites))

        if departements:
            query = query.filter(THarvest.location_code.in_(departements))

        if id_harvest_type:
            query = query.filter(THarvest.id_harvest_type == id_harvest_type)

        if code_material:
            query = query.filter(THarvestMaterial.code_material.ilike(f"%{code_material}%"))

        return query
    
    def delete(self, harvest):
        try:
            db.session.delete(harvest) 
            db.session.commit()
        except SQLAlchemyError as e:
            db.session.rollback()  
            raise e



                        

class HarvestMaterialRepository:
    def get_one(self, id_material):
        # query = db.session.query(THarvestMaterial).filter(THarvestMaterial.id_material == id_material)
        material = THarvestMaterial.query.get(id_material)
        return material
    
    def create(self, data):
        try:
            existing_material = THarvestMaterial.query.filter_by(code_material=data["code_material"]).first()
            if existing_material:
                return jsonify({"error": "Ce code matériel existe déjà."}), 400
            
            # Récupérer id_parent depuis code_parent s'il est présent
            code_parent = data.pop("code_parent", None)  # Supprime et récupère code_parent
            if code_parent:
                parent = THarvestMaterial.query.filter_by(code_material=code_parent).first()
                data["id_parent"] = parent.id_material if parent else None  # Assigner l'id du parent

            material = THarvestMaterial(**data)
            db.session.add(material)
            db.session.commit()
            return material
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
        
    def materials_by_id_harvest(self, id_harvest):
        NomenclatureClassCouting = aliased(TNomenclatures) 
        NomenclatureHarvestMateriel = aliased(TNomenclatures)
        NomenclatureSampleMethod = aliased(TNomenclatures)
        NomenclaturePhenology1 = aliased(TNomenclatures)
        NomenclaturePhenology2 = aliased(TNomenclatures)
        query = (
            db.session.query(
                THarvestMaterial.id_harvest,
                THarvestMaterial.code_cultural_bank,
                THarvestMaterial.code_material,
                THarvestMaterial.protocole_note,
                THarvestMaterial.comment,
                THarvestMaterial.id_parent,
                THarvestMaterial.is_soil_sampling,
                THarvestMaterial.id_material,
                NomenclatureClassCouting.label_default.label("class_conting"),
                NomenclatureHarvestMateriel.label_default.label("harvest_material"),
                NomenclatureSampleMethod.label_default.label('sample_method'),
                NomenclaturePhenology1.label_default.label('phenology_1'),
                NomenclaturePhenology2.label_default.label('phenology_2')
            )
            .outerjoin(NomenclatureClassCouting, THarvestMaterial.id_foot_counting_class == NomenclatureClassCouting.id_nomenclature) 
            .outerjoin(NomenclatureHarvestMateriel, THarvestMaterial.id_harvest_material == NomenclatureHarvestMateriel.id_nomenclature)
            .outerjoin(NomenclatureSampleMethod, THarvestMaterial.id_method_sample == NomenclatureSampleMethod.id_nomenclature)
            .outerjoin(NomenclaturePhenology1, THarvestMaterial.id_phenology_1 == NomenclaturePhenology1.id_nomenclature)
            .outerjoin(NomenclaturePhenology2, THarvestMaterial.id_phenology_2 == NomenclaturePhenology2.id_nomenclature)
            .filter(THarvestMaterial.id_harvest == id_harvest)
        )
        return query.all()
        
    def update(self, id_material, data):
        try:
            material = self.get_one(id_material)
            if not material:
                return None

            if "code_material" in data:
                existing_material = THarvestMaterial.query.filter_by(code_material=data["code_material"]).first()
                if existing_material and existing_material.id_material != id_material:
                    return jsonify({"error": "Ce code matériel existe déjà."}), 400

            code_parent = data.pop("code_parent", None)
            if code_parent:
                parent = THarvestMaterial.query.filter_by(code_material=code_parent).first()
                data["id_parent"] = parent.id_material if parent else None

            for key, value in data.items():
                if hasattr(material, key):
                    setattr(material, key, value)

            db.session.commit()
            return material
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    
    def delete(self, id_material):
        try:
            material = self.get_one(id_material)
            if not material:
                return jsonify({"error": "Matériel non trouvé."}), 404
            db.session.delete(material)
            db.session.commit()
            return jsonify({"message": "Matériel supprimé avec succès."}), 200
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    def get_all(self, page=1, per_page=10):
    # Alias pour les différentes tables
        Taxref = aliased(Taxref)
        CorMaterialTaxon = aliased(CorMaterialTaxon)
        CorHarvestObserver = aliased(CorHarvestObserver)
        l_areas_dept = aliased(LAreas)
        l_areas_commune = aliased(LAreas)

        # Calcul de l'offset à partir de la page et du nombre d'éléments par page
        offset = (page - 1) * per_page

        query = (
            db.session.query(
                THarvest.date_start,
                THarvestMaterial.num_recolte,
                db.func.group_concat(Taxref.lb_nom).label('taxons'),
                l_areas_dept.lb_area.label('departement'),
                l_areas_commune.lb_area.label('commune'),
                db.func.group_concat(CorHarvestObserver.observer_name).label('observateurs')
            )
            .join(THarvestMaterial, THarvest.id_harvest == THarvestMaterial.id_harvest)
            .outerjoin(CorMaterialTaxon, THarvestMaterial.id_harvest_material == CorMaterialTaxon.id_harvest_material)
            .outerjoin(Taxref, CorMaterialTaxon.cd_nom == Taxref.cd_nom)
            .outerjoin(l_areas_dept, THarvest.location_code == l_areas_dept.code_area)
            .outerjoin(l_areas_commune, THarvest.location_code == l_areas_commune.code_area)
            .outerjoin(CorHarvestObserver, THarvest.id_harvest == CorHarvestObserver.id_harvest)
            .filter(l_areas_dept.id_type == 26)  # Département
            .filter(l_areas_commune.id_type == 25)  # Commune
            .group_by(THarvest.id_harvest)
            .limit(per_page)
            .offset(offset)
            .order_by(THarvest.date_start)
        )
        
        results = query.all()

        # Pour connaître le nombre total de récoltes disponibles sans la pagination
        total = (
            db.session.query(db.func.count(THarvest.id_harvest))
            .join(THarvestMaterial, THarvest.id_harvest == THarvestMaterial.id_harvest)
            .outerjoin(CorMaterialTaxon, THarvestMaterial.id_harvest_material == CorMaterialTaxon.id_harvest_material)
            .outerjoin(Taxref, CorMaterialTaxon.id_taxon == Taxref.id_taxon)
            .outerjoin(l_areas_dept, THarvest.location_code == l_areas_dept.code_area)
            .outerjoin(l_areas_commune, THarvest.location_code == l_areas_commune.code_area)
            .outerjoin(CorHarvestObserver, THarvest.id_harvest == CorHarvestObserver.id_harvest)
            .filter(l_areas_dept.id_type == 26)  # Département
            .filter(l_areas_commune.id_type == 25)  # Commune
        ).scalar()

        # Calcul du nombre total de pages
        total_pages = (total + per_page - 1) // per_page

        return {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': total_pages,
            'results': results
        }

