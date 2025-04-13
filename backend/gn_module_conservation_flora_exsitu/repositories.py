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
from sqlalchemy.sql import text


from .models import(
    THarvest,
    TMaterial,
    CorHarvestObserver,
    CorMaterialTaxon,
    TMaterielSeed
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


    def create(self, data):
        try:
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
            
            if data["id_area_type"] and not data.get('geom'):
                commune_id = db.session.execute(text("SELECT ref_geo.get_id_area_type('COM')")).scalar()
                departement_id = db.session.execute(text("SELECT ref_geo.get_id_area_type('DEP')")).scalar()
                if data["id_area_type"] == commune_id:  # Commune
                    data["id_area"] = data.get("id_area_muni", [None])[0]
                elif data["id_area_type"] == departement_id:  # Département
                    data["id_area"] = data.get("id_area_dept", [None])[0]
    
                if data["id_area"]:
                    area = LAreas.query.get(data["id_area"])

                    if area and area.centroid :
                        data["geom"] = area.centroid

            data.pop("id_area_muni", None)
            data.pop("id_area_dept", None)

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
                harvest.id_area = None
                harvest.id_area_type = None

            if data["id_area_type"] and not data.get('geom'):
                commune_id = db.session.execute(text("SELECT ref_geo.get_id_area_type('COM')")).scalar()
                departement_id = db.session.execute(text("SELECT ref_geo.get_id_area_type('DEP')")).scalar()
                if data["id_area_type"] == commune_id:
                    data["id_area"] = data.get("id_area_muni", [None])[0]
                elif data["id_area_type"] == departement_id:
                    data["id_area"] = data.get("id_area_dept", [None])[0]

                if data["id_area"]:
                    area = LAreas.query.get(data["id_area"])
                    if area and area.centroid:
                        data["geom"] = area.centroid

            data.pop("id_area_muni", None)
            data.pop("id_area_dept", None)

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


    def build_harvest_geometry_query(self, 
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
            func.ST_AsGeoJSON(func.ST_Transform(THarvest.geom, 4326)).label("geom"),
        ).outerjoin(TMaterial, THarvest.id_harvest == TMaterial.id_harvest) \
        .outerjoin(CorMaterialTaxon, TMaterial.id_material == CorMaterialTaxon.id_material) \
        .outerjoin(Taxref, CorMaterialTaxon.cd_nom == Taxref.cd_nom) \
        .outerjoin(Taxref_valid, Taxref.cd_ref == Taxref_valid.cd_nom) \
        .outerjoin(l_areas_dept, and_(THarvest.id_area == l_areas_dept.id_area, l_areas_dept.id_type == 26)) \
        .outerjoin(l_areas_commune, and_(THarvest.id_area == l_areas_commune.id_area, l_areas_commune.id_type == 25)) \
        .outerjoin(CorHarvestObserver, THarvest.id_harvest == CorHarvestObserver.id_harvest) \
        .outerjoin(User, CorHarvestObserver.id_observer == User.id_role)\
        .group_by(
            THarvest.id_harvest, THarvest.geom
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
            query = query.filter(THarvest.id_area.in_(municipalites))

        if departements:
            query = query.filter(THarvest.id_area.in_(departements))

        if id_harvest_type:
            query = query.filter(THarvest.id_harvest_type == id_harvest_type)

        if code_material:
            query = query.filter(TMaterial.code_material.ilike(f"%{code_material}%"))

        return query

    
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
            TMaterial.code_material,
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
        ).outerjoin(TMaterial, THarvest.id_harvest == TMaterial.id_harvest) \
        .outerjoin(CorMaterialTaxon, TMaterial.id_material == CorMaterialTaxon.id_material) \
        .outerjoin(Taxref, CorMaterialTaxon.cd_nom == Taxref.cd_nom) \
        .outerjoin(Taxref_valid, Taxref.cd_ref == Taxref_valid.cd_nom) \
        .outerjoin(l_areas_dept, and_(THarvest.id_area == l_areas_dept.id_area, l_areas_dept.id_type == 26)) \
        .outerjoin(l_areas_commune, and_(THarvest.id_area == l_areas_commune.id_area, l_areas_commune.id_type == 25)) \
        .outerjoin(CorHarvestObserver, THarvest.id_harvest == CorHarvestObserver.id_harvest) \
        .outerjoin(User, CorHarvestObserver.id_observer == User.id_role)\
        .group_by(
            THarvest.id_harvest,
            TMaterial.id_material,
            THarvest.date_start,
            TMaterial.code_material,
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
            query = query.filter(THarvest.id_area.in_(municipalites))

        if departements:
            query = query.filter(THarvest.id_area.in_(departements))

        if id_harvest_type:
            query = query.filter(THarvest.id_harvest_type == id_harvest_type)

        if code_material:
            query = query.filter(TMaterial.code_material.ilike(f"%{code_material}%"))

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
        material = TMaterial.query.get(id_material)
        return material
    
    def create(self, data):
        try:
            existing_material = TMaterial.query.filter_by(
                code_material=data["code_material"]
            ).first()

            if existing_material:
                return False, "Ce code matériel existe déjà."

            code_parent = data.pop("code_parent", None)
            code_cultural_bank = data.pop("code_cultural_bank", None)

            if code_parent:
                parent = TMaterial.query.filter_by(code_material=code_parent).first()
                data["id_material_parent"] = parent.id_material if parent else None

            if code_cultural_bank:
                bank = TMaterial.query.filter_by(code_material=code_cultural_bank).first()
                data["code_cultural_bank"] = bank.id_material if bank else None

            material = TMaterial(**data)
            db.session.add(material)
            db.session.commit()
            return True, material

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    def update(self, id_material, data):
        try:
            material = self.get_one(id_material)
            if not material:
                return None

            if "code_material" in data:
                existing_material = TMaterial.query.filter_by(code_material=data["code_material"]).first()
                if existing_material and existing_material.id_material != id_material:
                    return False

            code_parent = data.pop("code_parent", None)
            code_cultural_bank = data.pop("code_cultural_bank", None)
            if code_parent:
                parent = TMaterial.query.filter_by(code_material=code_parent).first()
                data["id_material_parent"] = parent.id_material if parent else None
            if code_cultural_bank:
                parent = TMaterial.query.filter_by(code_material=code_cultural_bank).first()
                data["code_cultural_bank"] = parent.id_material if parent else None

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
                return False

            db.session.query(CorMaterialTaxon).filter_by(id_material=id_material).delete()
            db.session.delete(material)
            db.session.commit()
            return True

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    

class TMaterielSeedRepository:
    def create(self, data):
        try:
            seed = TMaterielSeed(**data)
            db.session.add(seed)
            db.session.commit()
            return seed 

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    
    def update(self, id_seed, data):
        seed = TMaterielSeed.query.get(id_seed)
        if not seed:
            return None

        try:
            for key, value in data.items():
                if hasattr(seed, key):
                    setattr(seed, key, value)

            db.session.commit()
            return seed
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
