from urllib import request
from geonature.utils.env import db
from sqlalchemy.exc import SQLAlchemyError
from pypnusershub.db.models import User
from datetime import datetime, date
from dateutil.parser import isoparse
from shapely.geometry import shape
from geoalchemy2.shape import from_shape
from pypn_habref_api.models import Habref
from pypnnomenclature.models import TNomenclatures
from sqlalchemy.orm import aliased
from flask import jsonify
from ref_geo.models import LAreas, BibAreasTypes
from apptax.taxonomie.models import Taxref
from sqlalchemy import func, cast, Integer
import json
from sqlalchemy import and_
from sqlalchemy.sql import text
from functools import cached_property
from sqlalchemy import Boolean


from .models import(
    TAction,
    TActionReplicate,
    THarvest,
    TMaterial,
    CorHarvestObserver,
    CorMaterialTaxon,
    TMaterielSeed,
    TSowing,
    TStorage,
    TTest,
    TCulture,
    TCultureActionTransplantation,
    TCultureActionObservation,
    TCultureActionTreatment,
    TCultureActionSampling
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
    
    @cached_property
    def commune_id(self):
        return db.session.execute(text("SELECT ref_geo.get_id_area_type('COM')")).scalar()

    @cached_property
    def departement_id(self):
        return db.session.execute(text("SELECT ref_geo.get_id_area_type('DEP')")).scalar()


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
                commune_id = self.commune_id
                departement_id = self.departement_id
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
                commune_id = self.commune_id
                departement_id = self.departement_id
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
                            cd_hab_list, 
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
        commune_id = self.commune_id
        departement_id = self.departement_id

        query = db.session.query(
            THarvest.id_harvest,
            func.ST_AsGeoJSON(func.ST_Transform(THarvest.geom, 4326)).label("geom"),
        ).outerjoin(TMaterial, THarvest.id_harvest == TMaterial.id_harvest) \
        .outerjoin(CorMaterialTaxon, TMaterial.id_material == CorMaterialTaxon.id_material) \
        .outerjoin(Taxref, CorMaterialTaxon.cd_nom == Taxref.cd_nom) \
        .outerjoin(Taxref_valid, Taxref.cd_ref == Taxref_valid.cd_nom) \
        .outerjoin(l_areas_dept, and_(THarvest.id_area == l_areas_dept.id_area, l_areas_dept.id_type == departement_id)) \
        .outerjoin(l_areas_commune, and_(THarvest.id_area == l_areas_commune.id_area, l_areas_commune.id_type == commune_id)) \
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

        if cd_hab_list:
            query = query.filter(THarvest.cd_hab.in_(cd_hab_list))

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
                            cd_hab_list, 
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
        commune_id = self.commune_id
        departement_id = self.departement_id

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
        .outerjoin(l_areas_dept, and_(THarvest.id_area == l_areas_dept.id_area, l_areas_dept.id_type == departement_id)) \
        .outerjoin(l_areas_commune, and_(THarvest.id_area == l_areas_commune.id_area, l_areas_commune.id_type == commune_id)) \
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

        if cd_hab_list:
            query = query.filter(THarvest.cd_hab.in_(cd_hab_list))

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
            # code_cultural_bank = data.pop("code_cultural_bank", None)

            if code_parent:
                parent = TMaterial.query.filter_by(code_material=code_parent).first()
                data["id_material_parent"] = parent.id_material if parent else None

            # if code_cultural_bank:
            #     bank = TMaterial.query.filter_by(code_material=code_cultural_bank).first()
            #     data["code_cultural_bank"] = bank.id_material if bank else None

            additional_data = data.pop("additional_data", None)
                     
            if additional_data:
                material = TMaterial(**data, additional_data=additional_data)
            else:
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
            # code_cultural_bank = data.pop("code_cultural_bank", None)
            if code_parent:
                parent = TMaterial.query.filter_by(code_material=code_parent).first()
                data["id_material_parent"] = parent.id_material if parent else None
            # if code_cultural_bank:
            #     parent = TMaterial.query.filter_by(code_material=code_cultural_bank).first()
            #     data["code_cultural_bank"] = parent.id_material if parent else None

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
            additional_data = data.pop("additional_data", None)
                     
            if additional_data:
                seed = TMaterielSeed(**data, additional_data=additional_data)
            else:
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

         
class StorageRepository:
    def create(self, data):
        try:
            code_place = data.pop("code_place", None)
            id_place = None
            if code_place:
                id_place = self.get_id_nomenclature("CFE_PLACE", code_place)
                if id_place:
                    data["id_place"] = id_place

            id_material = data["id_material"]
            id_storage_action = data["id_storage_action"]
            quantity = data.get("quantity") or 0

            # Stockage initial
            id_action_initial_storage = self.get_id_nomenclature("CFE_STORAGE_ACTION", "sti")

            # Vérifie qu'un stockage initial existe si l'action n'est pas un "stockage initial"
            if id_storage_action != id_action_initial_storage:
                initial_storage = db.session.query(TStorage).filter_by(
                    id_material=id_material,
                    id_place=id_place,
                    id_storage_action=id_action_initial_storage
                ).first()

                if not initial_storage:
                    raise ValueError("Un stockage initial est requis avant d'effectuer cette action.")
                
                id_dry_type = data.get("id_destock")
                dry_type_total = self.get_id_nomenclature("CFE_DESTOCK", "total")

                if id_storage_action == self.get_id_nomenclature("CFE_STORAGE_ACTION", "dest") and id_dry_type == dry_type_total:
                    quantity = self.get_current_quantity(id_material, id_place)
                    data["quantity"] = quantity

                # Vérifie la quantité pour les actions qui en consomment
                action_codes_needing_quantity = ["depl", "dest"]
                id_actions_need_quantity = [
                    self.get_id_nomenclature("CFE_STORAGE_ACTION", c) for c in action_codes_needing_quantity
                ]

                if id_storage_action in id_actions_need_quantity:
                    current_quantity = self.get_current_quantity(id_material, id_place)
    
                    if quantity > current_quantity:
                        raise ValueError(
                            f"Quantité demandée ({quantity}) supérieure au stock disponible ({current_quantity})."
                        )

            additional_data = data.pop("additional_data", None)

            if additional_data:
                action = TStorage(**data, additional_data=additional_data)
            else:
                action = TStorage(**data)

            db.session.add(action)
            db.session.commit()
            return action

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

        except Exception as e:
            db.session.rollback()
            raise e

    def get_id_nomenclature(self, type_code, code_nomenclature):
        return db.session.execute(
            text("SELECT ref_nomenclatures.get_id_nomenclature(:mytype, :mycdnomenclature)"),
            {"mytype": type_code, "mycdnomenclature": code_nomenclature}
        ).scalar()

    def get_current_quantity(self, id_material, id_place):
        """Calcule la quantité actuelle restante dans un lieu pour un matériel donné."""
        id_action_initial_storage = self.get_id_nomenclature("CFE_STORAGE_ACTION", "sti")
        id_action_destock = self.get_id_nomenclature("CFE_STORAGE_ACTION", "dest")
        id_action_deplacement = self.get_id_nomenclature("CFE_STORAGE_ACTION", "depl")

        # Somme des quantités entrées
        initial_storage = db.session.query(
            db.func.sum(TStorage.quantity)
        ).filter_by(
            id_material=id_material,
            id_place=id_place,
            id_storage_action=id_action_initial_storage
        ).scalar() or 0

        # Quantités outputs : déstockages + déplacements
        exits = db.session.query(
            db.func.sum(TStorage.quantity)
        ).filter(
            TStorage.id_material == id_material,
            TStorage.id_place == id_place,
            TStorage.id_storage_action.in_([id_action_destock, id_action_deplacement])
        ).scalar() or 0

        return initial_storage - exits
    

    def has_initial_stockage(self, id_material: int, code_place: str) -> bool:
        id_place = self.get_id_nomenclature("CFE_PLACE", code_place)
        if not id_place:
            return False
        return db.session.query(
            db.exists().where(
                and_(
                    TStorage.id_material == id_material,
                    TStorage.id_place == id_place,
                    TStorage.id_storage_action == self.get_id_nomenclature("CFE_STORAGE_ACTION", "sti")
                )
            )
        ).scalar()
    

    def get_current_quantities(self, id_material: int) -> dict:
        """Retourne un dict {id_place: current_quantity}"""
        initial_storage = db.session.query(
            TStorage.id_place,
            func.sum(TStorage.quantity).label("quantity")
        ).filter(
            TStorage.id_material == id_material,
            TStorage.id_storage_action == self.get_id_nomenclature("CFE_STORAGE_ACTION", "sti"),
            TStorage.quantity != None
        ).group_by(TStorage.id_place).all()

        outputs = db.session.query(
            TStorage.id_place,
            func.sum(TStorage.quantity).label("quantity")
        ).filter(
            TStorage.id_material == id_material,
            TStorage.id_storage_action.in_([
                self.get_id_nomenclature("CFE_STORAGE_ACTION", "depl"),
                self.get_id_nomenclature("CFE_STORAGE_ACTION", "dest")
            ]),
            TStorage.quantity != None
        ).group_by(TStorage.id_place).all()

        result = {}
        # Ajout des quantités initiales
        for row in initial_storage:
            result[row.id_place] = row.quantity or 0

        # Retrait des quantités outputs
        for row in outputs:
            if row.id_place in result:
                result[row.id_place] -= row.quantity or 0

        # Nettoyage des quantités <= 0
        # result = {k: v for k, v in result.items() if v > 0}
        return result
    
    def get_place_code_mapping(self) -> dict:
        """Retourne un mapping des codes de lieu vers leurs IDs (ex: 'cf' -> 12)"""
        id_type_nomenclature = db.session.execute(text("SELECT ref_nomenclatures.get_id_nomenclature_type('CFE_PLACE')")).scalar()
        rows = db.session.query(
            TNomenclatures.cd_nomenclature,
            TNomenclatures.id_nomenclature
        ).filter(
            TNomenclatures.id_type == id_type_nomenclature,
            TNomenclatures.cd_nomenclature.in_(["cf", "sds", "sdps", "cong"])
        ).all()

        return {row.cd_nomenclature: row.id_nomenclature for row in rows}
    
    def get_actions_by_place(self, id_material: int, code_place: str, page: int = 1, limit: int = 10):
        id_place = self.get_id_nomenclature("CFE_PLACE", code_place)
        if not id_place:
            raise ValueError("Lieu inconnu")
        
        ActionType = aliased(TNomenclatures)
        Destination = aliased(TNomenclatures)
        Actor = aliased(User)

        query = (
            db.session.query(
                TStorage,
                ActionType.label_default.label("action_type_label"),
                Destination.label_default.label("destination"),
                Actor.prenom_role.label("prenom_actor"),
                Actor.nom_role.label("nom_actor"),
            )
            .outerjoin(ActionType, TStorage.id_storage_action == ActionType.id_nomenclature)
            .outerjoin(Destination, TStorage.id_destination == Destination.id_nomenclature)
            .outerjoin(Actor, TStorage.id_actor == Actor.id_role)
            .filter(TStorage.id_material == id_material)
            .filter(TStorage.id_place == id_place)
            .order_by(TStorage.date_start.desc(), TStorage.id_storage.desc())
        )

        total = query.count()
        offset = (page - 1) * limit
        actions = query.offset(offset).limit(limit).all()

        return actions, total

    def get_stock_summary(self, id_material):
        id_sti = self.get_id_nomenclature("CFE_STORAGE_ACTION", "sti")  # stockage initial
        id_dest = self.get_id_nomenclature("CFE_STORAGE_ACTION", "dest")  # déstockage
        id_depl = self.get_id_nomenclature("CFE_STORAGE_ACTION", "depl")  # déplacement

        # Récupérer le total_count du TMaterielSeed (s'il existe)
        seed_data = db.session.query(TMaterielSeed.total_count).filter_by(id_material=id_material).one_or_none()

        # Déterminer initial_storage
        if seed_data and seed_data.total_count and seed_data.total_count > 0:
            initial_storage = seed_data.total_count
        else:
            initial_storage = db.session.query(func.coalesce(func.sum(TStorage.quantity), 0)) \
                .filter(
                    TStorage.id_material == id_material,
                    TStorage.id_storage_action == id_sti
                ).scalar()

        # Calcul du total des quantités sorties (déstockage + déplacement)
        quantity_output = db.session.query(func.coalesce(func.sum(TStorage.quantity), 0)) \
            .filter(
                TStorage.id_material == id_material,
                TStorage.id_storage_action.in_([id_dest, id_depl])
            ).scalar()

        current_quantity = initial_storage - quantity_output

        return {
            "initial_storage": initial_storage,
            "current_quantity": current_quantity
        }
    
    def update(self, id_storage, data):
        try:
            action = TStorage.query.get(id_storage)

            code_place = data.pop("code_place", None)
            if code_place:
                id_place = self.get_id_nomenclature("CFE_PLACE", code_place)
                if id_place:
                    action.id_place = id_place

            additional_data = data.get("additional_data")
            if additional_data:
                action.additional_data = additional_data

            if data.get("quantity"):
                self.verify_quantity(action, data["quantity"])
            
            for key, value in data.items():
                if hasattr(action, key):
                    setattr(action, key, value)

            db.session.commit()
            return action
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
        except Exception as e:
            db.session.rollback()
            raise e
        
    def verify_quantity(self, action, new_quantity):
        id_material = action.id_material
        id_place = action.id_place
        id_storage_action = action.id_storage_action

        current_quantity = self.get_current_quantity(id_material, id_place)

        action_codes_needing_quantity = ["depl", "dest"]
        id_actions_need_quantity = [
            self.get_id_nomenclature("CFE_STORAGE_ACTION", c) for c in action_codes_needing_quantity
        ]

        if id_storage_action in id_actions_need_quantity:
            if action.quantity:
                current_quantity += action.quantity
            
            if new_quantity > current_quantity:
                raise ValueError(f"Quantité demandée ({new_quantity}) supérieure au stock disponible ({current_quantity}).")


class SowingRepository:

    def get_all_by_material(self, id_material: int):
        try:
            return TSowing.query.filter_by(id_material=id_material).all()
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    def get_by_id(self, id_sowing: int):
        try:
            return TSowing.query.get(id_sowing)
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    def create(self, id_material: int, data: dict):
        try:
            data["id_material"] = id_material

            container = data.pop("container", None)
            substrate = data.pop("substrate", None)
            additional_data = data.pop("additional_data", None)

            sowing = TSowing(
                **data,
                container={"value": container} if isinstance(container, str) else container,
                substrate={"value": substrate} if isinstance(substrate, str) else substrate,
                additional_data=additional_data or {},
                meta_create_date=datetime.utcnow()
            )

            db.session.add(sowing)
            db.session.commit()

            return sowing

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    def update(self, id_sowing: int, data: dict):
        try:
            sowing = TSowing.query.get(id_sowing)
            if not sowing:
                raise ValueError("Semis non trouvé")

            container = data.pop("container", None)
            substrate = data.pop("substrate", None)
            additional_data = data.pop("additional_data", None)

            for key, value in data.items():
                setattr(sowing, key, value)

            sowing.container = {"value": container} if isinstance(container, str) else container
            sowing.substrate = {"value": substrate} if isinstance(substrate, str) else substrate
            sowing.additional_data = additional_data or {}
            sowing.meta_update_date = datetime.utcnow()

            db.session.commit()
            return sowing

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    def delete(self, id_sowing: int):
        try:
            sowing = TSowing.query.get(id_sowing)
            if not sowing:
                return {
                    "deleted": False,
                    "not_found": True,
                    "action_count": 0
                }

            action_count = TAction.query.filter_by(id_sowing=id_sowing).count()

            if action_count > 0:
                return {
                    "deleted": False,
                    "blocked": True,
                    "action_count": action_count
                }

            db.session.delete(sowing)
            db.session.commit()

            return {
                "deleted": True,
                "action_count": 0
            }

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    def get_with_labels_by_material(self, id_material: int):
        try:
            Location = aliased(TNomenclatures)
            WateringMethod = aliased(TNomenclatures)
            SowingMethod = aliased(TNomenclatures)
            Substrate = aliased(TNomenclatures)
            Actor = aliased(User)
            Material = aliased(TMaterial)

            query = (
                db.session.query(
                    TSowing,
                    Location.label_default.label("label_location"),
                    WateringMethod.label_default.label("label_watering"),
                    SowingMethod.label_default.label("label_sowing"),
                    Substrate.label_default.label("label_substrate"),
                    Actor.nom_role.label("nom_actor"),
                    Actor.prenom_role.label("prenom_actor"),
                    Material.code_material.label("code_material")
                )
                .outerjoin(Location, TSowing.id_location == Location.id_nomenclature)
                .outerjoin(WateringMethod, TSowing.id_watering_method == WateringMethod.id_nomenclature)
                .outerjoin(SowingMethod, TSowing.id_sowing_method == SowingMethod.id_nomenclature)
                .outerjoin(
                    Substrate,
                    cast(TSowing.substrate["id_nomenclature"].astext, Integer) == Substrate.id_nomenclature
                )
                .outerjoin(Actor, TSowing.id_actor == Actor.id_role)
                .outerjoin(Material, TSowing.id_material == Material.id_material)
                .filter(TSowing.id_material == id_material)
                .order_by(TSowing.meta_create_date.desc())
            )

            emergence_rates_by_sowing = self.get_average_emergence_rate_by_sowing(id_material)
            results = query.all()

            return [
                {
                    **sowing.to_dic(),
                    "label_location": label_location,
                    "label_watering": label_watering,
                    "label_sowing": label_sowing,
                    "label_substrate": label_substrate,
                    "nom_actor": nom_actor,
                    "prenom_actor": prenom_actor,
                    "code_material": code_material,
                    "emergence_rate_action": emergence_rates_by_sowing.get(sowing.id_sowing)
                }
                for sowing, label_location, label_watering, label_sowing, label_substrate, nom_actor, prenom_actor, code_material in results
            ]

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

    
        
    def list_by_material(self, id_material: int):
        try:
            return TSowing.query.filter_by(id_material=id_material).all()
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
        
    def get_average_emergence_rate_by_sowing(self, id_material: int):
        rows = (
            db.session.query(
                TAction.id_sowing,
                TAction.id_action,
                TAction.date_start,
                TActionReplicate.code,
                TActionReplicate.count_germinated,
                TActionReplicate.count_dead,
                TActionReplicate.count_viable
            )
            .join(TSowing, TAction.id_sowing == TSowing.id_sowing)
            .join(TActionReplicate, TActionReplicate.id_action == TAction.id_action)
            .filter(
                TSowing.id_material == id_material,
                TAction.id_sowing.isnot(None),
                TActionReplicate.code.isnot(None),
                TActionReplicate.code != "synth"
            )
            .order_by(
                TAction.id_sowing,
                TAction.id_action,
                TActionReplicate.code
            )
            .all()
        )

        rows_by_sowing = {}

        for row in rows:
            id_sowing = row.id_sowing
            date_key = row.date_start.isoformat() if row.date_start else "inconnue"

            rows_by_sowing.setdefault(id_sowing, {})
            rows_by_sowing[id_sowing].setdefault(date_key, {})

            rows_by_sowing[id_sowing][date_key][row.code] = row

        result = {}

        for id_sowing, rows_by_date in rows_by_sowing.items():
            totals_by_code = {}

            for rows_by_code in rows_by_date.values():
                for code, row in rows_by_code.items():
                    totals_by_code.setdefault(code, {
                        "germinated": 0,
                        "dead": 0,
                        "viable": 0
                    })

                    totals_by_code[code]["germinated"] += row.count_germinated or 0
                    totals_by_code[code]["dead"] += row.count_dead or 0
                    totals_by_code[code]["viable"] += row.count_viable or 0

            percentages = []

            for counts in totals_by_code.values():
                total = counts["germinated"] + counts["dead"] + counts["viable"]

                if total <= 0:
                    continue

                percentages.append(round((counts["germinated"] / total) * 100))

            if percentages:
                result[id_sowing] = round(sum(percentages) / len(percentages), 1)

        return result

class CultureRepository:

    @staticmethod
    def _parse_datetime(value, field_name: str, required: bool = False):
        if value in (None, ""):
            if required:
                raise ValueError(f"Le champ {field_name} est obligatoire")
            return None

        if isinstance(value, datetime):
            return value

        try:
            return isoparse(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"Le champ {field_name} doit contenir une date valide"
            ) from exc

    @staticmethod
    def _validate_source(id_material: int, id_sowing=None, id_test=None):
        if id_sowing and id_test:
            raise ValueError(
                "Une culture ne peut pas être liée à la fois "
                "à un semis et à un test de germination"
            )

        if id_sowing:
            sowing = TSowing.query.filter_by(
                id_sowing=id_sowing,
                id_material=id_material
            ).first()

            if not sowing:
                raise ValueError(
                    "Le semis sélectionné n'existe pas "
                    "ou n'appartient pas à ce matériel"
                )

        if id_test:
            test = TTest.query.filter_by(
                id_test=id_test,
                id_material=id_material
            ).first()

            if not test:
                raise ValueError(
                    "Le test sélectionné n'existe pas "
                    "ou n'appartient pas à ce matériel"
                )

    @staticmethod
    def _validate_code(code_culture, id_culture=None):
        code_culture = str(
            code_culture or ""
        ).strip()

        if not code_culture:
            raise ValueError(
                "Le numéro de culture est obligatoire"
            )

        query = TCulture.query.filter(
            TCulture.code_culture == code_culture
        )

        if id_culture is not None:
            query = query.filter(
                TCulture.id_culture != id_culture
            )

        if query.first():
            raise ValueError(
                "Ce numéro de culture est déjà utilisé"
            )

        return code_culture

    def create(self, id_material: int, data: dict):
        try:
            payload = dict(data or {})

            payload.pop("id_culture", None)
            payload.pop("id_material", None)
            payload.pop("meta_create_date", None)
            payload.pop("meta_update_by", None)
            payload.pop("meta_update_date", None)
            code_culture = self._validate_code(
                payload.pop("code_culture", None)
            )

            date_start = self._parse_datetime(
                payload.pop("date_start", None),
                "date_start",
                required=True
            )

            date_end = self._parse_datetime(
                payload.pop("date_end", None),
                "date_end"
            )

            if date_end and date_end < date_start:
                raise ValueError(
                    "La date de fin doit être supérieure "
                    "ou égale à la date de début"
                )

            id_sowing = payload.get("id_sowing")
            id_test = payload.get("id_test")

            self._validate_source(
                id_material,
                id_sowing,
                id_test
            )

            additional_data = (
                payload.pop("additional_data", None) or {}
            )

            culture = TCulture(
                **payload,
                id_material=id_material,
                code_culture=code_culture,
                date_start=date_start,
                date_end=date_end,
                additional_data=additional_data,
                meta_create_date=datetime.utcnow()
            )

            db.session.add(culture)
            db.session.commit()

            return culture

        except (SQLAlchemyError, ValueError):
            db.session.rollback()
            raise

    def get_by_id(self, id_culture: int):
        return TCulture.query.get(id_culture)

    def get_with_labels_by_id(self, id_culture: int):
        Actor = aliased(User)
        Creator = aliased(User)
        Updater = aliased(User)
        Material = aliased(TMaterial)
        Sowing = aliased(TSowing)
        Test = aliased(TTest)

        result = (
            db.session.query(
                TCulture,

                Actor.nom_role.label(
                    "actor_last_name"
                ),
                Actor.prenom_role.label(
                    "actor_first_name"
                ),

                Creator.nom_role.label(
                    "creator_last_name"
                ),
                Creator.prenom_role.label(
                    "creator_first_name"
                ),

                Updater.nom_role.label(
                    "updater_last_name"
                ),
                Updater.prenom_role.label(
                    "updater_first_name"
                ),

                Material.code_material.label(
                    "code_material"
                ),
                Sowing.code.label(
                    "code_sowing"
                ),
                Test.code.label(
                    "code_test"
                )
            )
            .outerjoin(
                Actor,
                TCulture.id_actor == Actor.id_role
            )
            .outerjoin(
                Creator,
                TCulture.meta_create_by == Creator.id_role
            )
            .outerjoin(
                Updater,
                TCulture.meta_update_by == Updater.id_role
            )
            .outerjoin(
                Material,
                TCulture.id_material == Material.id_material
            )
            .outerjoin(
                Sowing,
                TCulture.id_sowing == Sowing.id_sowing
            )
            .outerjoin(
                Test,
                TCulture.id_test == Test.id_test
            )
            .filter(
                TCulture.id_culture == id_culture
            )
            .first()
        )

        if not result:
            return None

        (
            culture,
            actor_last_name,
            actor_first_name,
            creator_last_name,
            creator_first_name,
            updater_last_name,
            updater_first_name,
            code_material,
            code_sowing,
            code_test
        ) = result

        data = culture.to_dic()

        data.update({
            "actor_label": (
                f"{actor_first_name or ''} "
                f"{actor_last_name or ''}"
            ).strip() or None,

            "created_by_label": (
                f"{creator_first_name or ''} "
                f"{creator_last_name or ''}"
            ).strip() or None,

            "updated_by_label": (
                f"{updater_first_name or ''} "
                f"{updater_last_name or ''}"
            ).strip() or None,

            "code_material": code_material,
            "code_sowing": code_sowing,
            "code_test": code_test,

            "source_type": (
                "sowing"
                if culture.id_sowing
                else "test"
                if culture.id_test
                else None
            ),

            "source_code": code_sowing or code_test
        })

        return data

    def get_all_by_material(self, id_material: int):
        culture_ids = (
            db.session.query(
                TCulture.id_culture
            )
            .filter(
                TCulture.id_material == id_material
            )
            .order_by(
                TCulture.date_start.desc(),
                TCulture.id_culture.desc()
            )
            .all()
        )

        return [
            self.get_with_labels_by_id(id_culture)
            for (id_culture,) in culture_ids
        ]

    def get_direct_by_material(
        self,
        id_material: int
    ):
        """
        Cultures créées directement depuis
        le matériel récolté.

        id_material = matériel courant
        id_sowing = NULL
        id_test = NULL
        """

        culture_ids = (
            db.session.query(
                TCulture.id_culture
            )
            .filter(
                TCulture.id_material == id_material,
                TCulture.id_sowing.is_(None),
                TCulture.id_test.is_(None)
            )
            .order_by(
                TCulture.date_start.desc(),
                TCulture.id_culture.desc()
            )
            .all()
        )

        return [
            self.get_with_labels_by_id(id_culture)
            for (id_culture,) in culture_ids
        ]


    def get_all_by_sowing(
        self,
        id_material: int,
        id_sowing: int
    ):
        """
        Cultures associées à un Semis précis.

        id_material = matériel courant
        id_sowing = semis courant
        id_test = NULL
        """

        self._validate_source(
            id_material,
            id_sowing=id_sowing,
            id_test=None
        )

        culture_ids = (
            db.session.query(
                TCulture.id_culture
            )
            .filter(
                TCulture.id_material == id_material,
                TCulture.id_sowing == id_sowing,
                TCulture.id_test.is_(None)
            )
            .order_by(
                TCulture.date_start.desc(),
                TCulture.id_culture.desc()
            )
            .all()
        )

        return [
            self.get_with_labels_by_id(id_culture)
            for (id_culture,) in culture_ids
        ]

    def get_all_by_test(
        self,
        id_material: int,
        id_test: int
    ):
        """
        Cultures associées à un Test
        de germination précis.

        id_material = matériel courant
        id_sowing = NULL
        id_test = test courant
        """

        self._validate_source(
            id_material,
            id_sowing=None,
            id_test=id_test
        )

        culture_ids = (
            db.session.query(
                TCulture.id_culture
            )
            .filter(
                TCulture.id_material == id_material,
                TCulture.id_sowing.is_(None),
                TCulture.id_test == id_test
            )
            .order_by(
                TCulture.date_start.desc(),
                TCulture.id_culture.desc()
            )
            .all()
        )

        return [
            self.get_with_labels_by_id(id_culture)
            for (id_culture,) in culture_ids
        ]

    def update(
        self,
        id_material: int,
        id_culture: int,
        data: dict
    ):
        try:
            culture = TCulture.query.filter_by(
                id_culture=id_culture,
                id_material=id_material
            ).first()

            if not culture:
                return None

            payload = dict(data or {})

            for protected_field in (
                "id_culture",
                "id_material",
                "meta_create_by",
                "meta_create_date",
                "meta_update_date"
            ):
                payload.pop(protected_field, None)

            code_culture = self._validate_code(
                payload.pop(
                    "code_culture",
                    culture.code_culture
                ),
                id_culture=id_culture
            )

            date_start = self._parse_datetime(
                payload.pop(
                    "date_start",
                    culture.date_start
                ),
                "date_start",
                required=True
            )

            if "date_end" in payload:
                date_end = self._parse_datetime(
                    payload.pop("date_end"),
                    "date_end"
                )
            else:
                date_end = culture.date_end

            if date_end and date_end < date_start:
                raise ValueError(
                    "La date de fin doit être supérieure "
                    "ou égale à la date de début"
                )

            id_sowing = payload.get(
                "id_sowing",
                culture.id_sowing
            )

            id_test = payload.get(
                "id_test",
                culture.id_test
            )

            self._validate_source(
                id_material,
                id_sowing,
                id_test
            )

            culture.code_culture = code_culture
            culture.date_start = date_start
            culture.date_end = date_end
            culture.id_sowing = id_sowing
            culture.id_test = id_test

            if "additional_data" in payload:
                culture.additional_data = (
                    payload.pop("additional_data") or {}
                )

            for key, value in payload.items():
                if hasattr(culture, key):
                    setattr(culture, key, value)

            culture.meta_update_date = datetime.utcnow()

            db.session.commit()

            return culture

        except (SQLAlchemyError, ValueError):
            db.session.rollback()
            raise

    def delete(
        self,
        id_material: int,
        id_culture: int
    ):
        try:
            culture = TCulture.query.filter_by(
                id_culture=id_culture,
                id_material=id_material
            ).first()

            if not culture:
                return False

            db.session.delete(culture)
            db.session.commit()

            return True

        except SQLAlchemyError:
            db.session.rollback()
            raise

class TestRepository:
    def create(self, data):
        try:
            # Extraire le code parent, s’il est fourni
            code_parent = data.pop("code_parent", None)

            if code_parent:
                parent_test = TTest.query.filter_by(code=code_parent).first()
                data["code_parent"] = parent_test.code if parent_test else None

            # Extraire et isoler les données additionnelles
            additional_data = data.pop("additional_data", None)

            # Créer l’instance du test
            if additional_data:
                test = TTest(**data, additional_data=additional_data)
            else:
                print("Data reçue pour TTest :", data)

                test = TTest(**data)

            # Ajouter à la session et commit
            db.session.add(test)
            db.session.commit()

            return True, test

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e
    def get_test_by_id(self, id_test):
        test = TTest.query.get(id_test)
        return test
    def get_test_by_mnemonique(self, mnemonique):
        test = TTest.query.get(mnemonique)
        return test
    
    def get_test_with_labels_by_id(self,id_test: int):
        TestType = aliased(TNomenclatures)
        Substrate = aliased(TNomenclatures)
        Support = aliased(TNomenclatures)
        Actor = aliased(User)
        Creator = aliased(User)
        Material = aliased(TMaterial)
        Storage = aliased(TStorage)
        Place = aliased(TNomenclatures)


        query = (
            db.session.query(
                TTest,
                TestType.label_default.label("test_type_label"),
                Substrate.label_default.label("substrate_label"),
                Support.label_default.label("support_label"),
                Actor.nom_role.label("nom_actor"),
                Actor.prenom_role.label("prenom_actor"),
                Creator.nom_role.label("nom_creator"),
                Creator.prenom_role.label("prenom_creator"),
                Material.code_material.label("material_label"),
                Place.label_default.label("place_label"),
                Storage.quantity.label("storage_quantity"),

            )
            .outerjoin(TestType, TTest.id_test_type == TestType.id_nomenclature)
            .outerjoin(Substrate, TTest.id_substrate == Substrate.id_nomenclature)
            .outerjoin(Support, TTest.id_support == Support.id_nomenclature)
            .outerjoin(Actor, TTest.id_actor == Actor.id_role)
            .outerjoin(Creator, TTest.meta_create_by == Creator.id_role)
            .outerjoin(Material, TTest.id_material == Material.id_material)
            .outerjoin(Storage, TTest.id_storage == Storage.id_storage)
            .outerjoin(Place, Storage.id_place == Place.id_nomenclature)

            .filter(TTest.id_test == id_test)
            .first()
        )

        if not query:
            return None

        (
            test,
            test_type_label,
            substrate_label,
            support_label,
            nom_actor,
            prenom_actor,
            nom_creator,
            prenom_creator,
            material_label,
            place_label,

            storage_quantity


        ) = query

        data = test.to_dic()
        data["test_type_label"] = test_type_label
        data["substrate_label"] = substrate_label
        data["support_label"] = support_label
        data["actor_label"] = f"{prenom_actor} {nom_actor}".strip() if nom_actor else None
        data["created_by_label"] = f"{prenom_creator} {nom_creator}".strip() if nom_creator else None
        data["material_label"] = material_label
        data["storage_label"] = (
            f"{place_label} – {storage_quantity} graines"
            if place_label and storage_quantity is not None else None
        )
        return data
    


    def get_test_by_cd_nomenclature(self, cd_nomenclature: str):
        return (
            db.session.query(TTest)
            .join(TNomenclatures, TTest.id_test_type == TNomenclatures.id_nomenclature)
            .filter(TNomenclatures.cd_nomenclature == cd_nomenclature)
            .first()
        )
    def update(self, id_test, data):
        test = TTest.query.get(id_test)
        if not test:
            raise ValueError("Test non trouvé")

        code_parent = data.pop("code_parent", None)
        if code_parent:
            parent = TTest.query.filter_by(code=code_parent).first()
            test.code_parent = parent.code if parent else None

        additional_data = data.get("additional_data")
        if additional_data:
            test.additional_data = additional_data

        for key, value in data.items():
            if hasattr(test, key):
                setattr(test, key, value)

        db.session.commit()
        return test   
    
    def update_pre_treatment(id_test):
        body = request.get_json()
        value = body.get("pre_treatment")
        test = db.session.get(TTest, id_test)
        if not test:
            return {"error": "Test introuvable"}, 404
        if not test.additional_data:
            test.additional_data = {}
        test.additional_data["pre_treatment"] = value
        db.session.commit()
        return {"success": True}
    
    def get_tests_by_material(id_material: int):
        ActionType = aliased(TNomenclatures)
        Liquid = aliased(TNomenclatures)

        subquery_treatment = (
            db.session.query(
                TAction.id_test.label("id_test"),
                Liquid.label_default.label("treatment_label"),
                db.func.row_number().over(
                    partition_by=TAction.id_test,
                    order_by=TAction.meta_create_date.desc()
                ).label("row_num")
            )
            .join(ActionType, TAction.id_action_type == ActionType.id_nomenclature)
            .outerjoin(Liquid, TAction.id_liquid_treatment == Liquid.id_nomenclature)
            .filter(ActionType.cd_nomenclature == "tra")
            .subquery()
        )

        query = (
            db.session.query(
                TTest,
                TMaterial.code_material.label("code_material"),
                subquery_treatment.c.treatment_label
            )
            .join(TMaterial, TMaterial.id_material == TTest.id_material)
            .outerjoin(
                subquery_treatment,
                db.and_(
                    TTest.id_test == subquery_treatment.c.id_test,
                    subquery_treatment.c.row_num == 1  
                )
            )
            .filter(TTest.id_material == id_material)
        )

        results = []
        for test, code_material, treatment in query.all():
            test_dict = test.to_dic()
            test_dict["code_material"] = code_material
            test_dict["germination_rate"] = test.germination_rate
            test_dict["treatment_label"] = treatment  # ✅ ajout indispensable

            results.append(test_dict)

        return results

            





class ActionRepository:
   
    def create(self, data):
        try:
            # Extraire le code parent s’il existe
            code_parent = data.pop("code_parent", None)
            if code_parent:
                parent_test = TAction.query.filter_by(code=code_parent).first()
                data["code_parent"] = parent_test.code if parent_test else None

            # Séparer les données de réplicats et données additionnelles
            replicates = data.pop("replicates", None)
            additional_data = data.pop("additional_data", None)

            # Créer l'action principale
            action = TAction(**data, additional_data=additional_data or {})
            db.session.add(action)
            db.session.flush()  # Nécessaire pour récupérer action.id_action

            # Récupérer le type d'action
            action_type = TNomenclatures.query.get(data["id_action_type"])
            action_code = action_type.cd_nomenclature if action_type else None

            # 📌 Réplicats individuels (svr)
            if action_code == 'svr' and isinstance(replicates, dict):
                for i in range(len(replicates.get("germes", []))):
                    rep = TActionReplicate(
                        id_action=action.id_action,
                        code=chr(65 + i),  # A, B, C...
                        count_germinated=replicates["germes"][i],
                        count_dead=replicates["mortes"][i],
                        count_viable=replicates["non_germes"][i],
                        count_transplanted=None,
                        total_count_germinated=None,
                        total_count_dead=None,
                        total_count_viable=None,
                        total_count_transplanted=None
                    )
                    db.session.add(rep)


            # 📌 Synthèse de suivi (synth)
            elif action_code == 'synth' and isinstance(replicates, dict):
                rep = TActionReplicate(
                    id_action=action.id_action,
                    code='synth',
                    count_germinated=None,
                    count_dead=None,
                    count_viable=None,
                    count_transplanted=None,
                    total_count_germinated=replicates.get("total_count_germinated"),
                    total_count_dead=replicates.get("total_count_dead"),
                    total_count_viable=replicates.get("total_count_viable"),
                    total_count_transplanted=None
                )
                db.session.add(rep)

            db.session.commit()
            return True, action

        except SQLAlchemyError as e:
            db.session.rollback()
            raise e


    def get_nomenclature_details_by_id(self, id_nomenclature: int):
        n = (
            db.session.query(TNomenclatures)
            .filter(TNomenclatures.id_nomenclature == id_nomenclature)
            .first()
        )

        if not n:
            return None

        return {
            "id_nomenclature": n.id_nomenclature,
            "cd_nomenclature": n.cd_nomenclature,
            "mnemonique": n.mnemonique,
            "id_type": n.id_type,
            "label_default": n.label_default
        }
    
    def get_actions_by_id_test(self, id_test: int):
        ActionType = aliased(TNomenclatures)
        ScarificationType = aliased(TNomenclatures)
        Actor = aliased(User)
        

        query = (
            db.session.query(
                TAction.id_action,
                TAction.date_start,
                TAction.date_end,
                TAction.meta_create_date,
                ActionType.label_default.label("label_action_type"),
                ScarificationType.label_default.label("label_scarification_type"),
                Actor.nom_role.label("nom_actor"),
                Actor.prenom_role.label("prenom_actor")
            )
            .outerjoin(ActionType, TAction.id_action_type == ActionType.id_nomenclature)
            .outerjoin(ScarificationType, TAction.id_scarification_type == ScarificationType.id_nomenclature)
            .outerjoin(Actor, TAction.id_actor == Actor.id_role)
            .filter(TAction.id_test == id_test)
            .order_by(TAction.meta_create_date.desc())
        )

        results = query.all()

        return [
            {
                "id_action": row.id_action,
                "date_start": row.date_start.isoformat() if row.date_start else None,
                "date_end": row.date_end.isoformat() if row.date_end else None,
                "meta_create_date": row.meta_create_date.isoformat() if row.meta_create_date else None,
                "label_action_type": row.label_action_type,
                "label_scarification_type": row.label_scarification_type,
                "label_actor": f"{row.prenom_actor or ''} {row.nom_actor or ''}".strip()
            }
            for row in results
        ]

    def get_actions_by_id_culture(
        self,
        id_culture: int
    ):
        ActionType = aliased(
            TNomenclatures
        )

        Actor = aliased(
            User
        )

        results = (
            db.session.query(
                TAction.id_action,
                TAction.date_start,
                TAction.date_end,
                TAction.meta_create_date,
                ActionType.cd_nomenclature.label(
                    "code_action_type"
                ),
                ActionType.label_default.label(
                    "label_action_type"
                ),
                Actor.nom_role.label(
                    "nom_actor"
                ),
                Actor.prenom_role.label(
                    "prenom_actor"
                )
            )
            .outerjoin(
                ActionType,
                TAction.id_action_type ==
                ActionType.id_nomenclature
            )
            .outerjoin(
                Actor,
                TAction.id_actor ==
                Actor.id_role
            )
            .filter(
                TAction.id_culture ==
                id_culture
            )
            .order_by(
                TAction.date_start.desc(),
                TAction.id_action.desc()
            )
            .all()
        )

        return [
            {
                "id_action":
                    row.id_action,

                "date_start": (
                    row.date_start.isoformat()
                    if row.date_start
                    else None
                ),

                "date_end": (
                    row.date_end.isoformat()
                    if row.date_end
                    else None
                ),

                "meta_create_date": (
                    row.meta_create_date.isoformat()
                    if row.meta_create_date
                    else None
                ),

                "code_action_type":
                    row.code_action_type,

                "label_action_type":
                    row.label_action_type,

                "label_actor": (
                    f"{row.prenom_actor or ''} "
                    f"{row.nom_actor or ''}"
                ).strip()
            }
            for row in results
        ]
    
    def get_action_with_labels_by_id(self, id_action: int):
        ActionType = aliased(TNomenclatures)
        Scarification = aliased(TNomenclatures)
        ScarificationMec = aliased(TNomenclatures)
        Tool = aliased(TNomenclatures)
        WaterType = aliased(TNomenclatures)
        Chemical = aliased(TNomenclatures)
        Actor = aliased(User)
        SterilizationLiquid = aliased(TNomenclatures)
        SterilizationProduct = aliased(TNomenclatures)
        LiquidTreatment = aliased(TNomenclatures)

        query = (
            db.session.query(
                TAction,
                ActionType.cd_nomenclature.label("code_action"),
                ActionType.label_default.label("label_action_type"),
                Scarification.label_default.label("label_scarification_type"),
                ScarificationMec.label_default.label("label_scarification_mecanique"),
                Tool.label_default.label("label_tool"),
                WaterType.label_default.label("label_water_type"),
                Chemical.label_default.label("label_chemical_liquid"),
                Actor.nom_role.label("nom_actor"),
                SterilizationLiquid.label_default.label("label_sterilization_liquid"),
                SterilizationProduct.label_default.label("label_sterilization_product"),
                LiquidTreatment.label_default.label("label_liquid_treatment"),
                Actor.prenom_role.label("prenom_actor")
            )
            .outerjoin(ActionType, TAction.id_action_type == ActionType.id_nomenclature)
            .outerjoin(Scarification, TAction.id_scarification_type == Scarification.id_nomenclature)
            .outerjoin(ScarificationMec, TAction.id_scarification_mecanique == ScarificationMec.id_nomenclature)
            .outerjoin(Tool, TAction.id_tool == Tool.id_nomenclature)
            .outerjoin(WaterType, TAction.id_water_type == WaterType.id_nomenclature)
            .outerjoin(Chemical, TAction.id_chemical_liquid == Chemical.id_nomenclature)
            .outerjoin(SterilizationLiquid, TAction.id_sterilization_liquid == SterilizationLiquid.id_nomenclature)
            .outerjoin(SterilizationProduct, TAction.id_sterilization_product == SterilizationProduct.id_nomenclature)
            .outerjoin(LiquidTreatment, TAction.id_liquid_treatment == LiquidTreatment.id_nomenclature)
            .outerjoin(Actor, TAction.id_actor == Actor.id_role)
            .filter(TAction.id_action == id_action)
            .first()
        )

        if not query:
            return None

        (
            action,
            code_action,
            label_action_type,
            label_scarification_type,
            label_scarification_mecanique,
            label_tool,
            label_water_type,
            label_chemical_liquid,
            nom_actor,
            label_sterilization_liquid,
            label_sterilization_product,
            label_liquid_treatment,
            prenom_actor,
        ) = query

        data = action.to_dic()
        data["label_action_type"] = label_action_type
        data["label_scarification_type"] = label_scarification_type
        data["label_scarification_mecanique"] = label_scarification_mecanique
        data["label_tool"] = label_tool
        data["label_water_type"] = label_water_type
        data["label_chemical_liquid"] = label_chemical_liquid
        data["label_sterilization_liquid"] = label_sterilization_liquid
        data["label_sterilization_product"] = label_sterilization_product
        data["label_liquid_treatment"] = label_liquid_treatment
        actor_label = f"{prenom_actor or ''} {nom_actor or ''}".strip()
        data["label_actor"] = actor_label or None

        code = code_action

        # ✅ 1. Si action = synth, récupérer SEULEMENT le réplicat synth de cette action
        if code == 'synth':
            synth_replicate = (
                db.session.query(TActionReplicate)
                .filter(
                    TActionReplicate.id_action == id_action,
                    TActionReplicate.code == 'synth'
                )
                .first()
            )
            if synth_replicate:
                data["total_count_germinated"] = synth_replicate.count_germinated
                data["total_count_dead"] = synth_replicate.count_dead
                data["total_count_viable"] = synth_replicate.count_viable
                data["replicates"] = [synth_replicate.to_dict()]
            else:
                data["replicates"] = []

        else:
            # ✅ Pour un semis : récupérer les réplicats des actions du même semis
            if action.id_sowing:
                actions_same_context = (
                    db.session.query(TAction.id_action, TAction.date_start)
                    .filter(TAction.id_sowing == action.id_sowing)
                    .all()
                )

            # ✅ Pour un test : conserver le comportement existant
            else:
                actions_same_context = (
                    db.session.query(TAction.id_action, TAction.date_start)
                    .filter(TAction.id_test == action.id_test)
                    .all()
                )

            actions_by_id = {a.id_action: a.date_start for a in actions_same_context}

            all_replicates = (
                db.session.query(TActionReplicate)
                .filter(TActionReplicate.id_action.in_(actions_by_id.keys()))
                .order_by(TActionReplicate.id_action, TActionReplicate.code)
                .all()
            )

            replicates_with_dates = []
            for r in all_replicates:
                rep_dict = r.to_dict()
                date = actions_by_id.get(r.id_action)
                rep_dict["date"] = date.isoformat() if date else None
                replicates_with_dates.append(rep_dict)

            data["replicates"] = replicates_with_dates

        # ➕ Données pour édition
        replicate_data = self.get_replicate_data_for_edit(id_action)
        if replicate_data:
            if "replicates_for_form" in replicate_data:
                data["replicates_for_form"] = replicate_data["replicates_for_form"]
            else:
                data["total_count_germinated"] = replicate_data.get("total_count_germinated")
                data["total_count_dead"] = replicate_data.get("total_count_dead")
                data["total_count_viable"] = replicate_data.get("total_count_viable")

        return data

    def get_replicates_by_action(self, id_action: int):
        replicates = (
            db.session.query(TActionReplicate)
            .filter_by(id_action=id_action)
            .order_by(TActionReplicate.code)
            .all()
        )
        return [r.to_dict() for r in replicates]
    

    def get_thermo_photo_by_test(self, id_test: int):
        action = (
            db.session.query(TAction)
            .filter(
                TAction.id_test == id_test,
                TAction.temperature_light.isnot(None),
                TAction.temperature_shadow.isnot(None),
                TAction.hour_count_light.isnot(None),
                TAction.hour_count_shadow.isnot(None)
            )
            .order_by(TAction.meta_create_date.desc())  # ou date_start si besoin
            .first()
        )

        if not action:
            return None

        return {
            "temperature_light": action.temperature_light,
            "temperature_shadow": action.temperature_shadow,
            "hour_count_light": action.hour_count_light,
            "hour_count_shadow": action.hour_count_shadow
        }
    def get_replicate_dates_by_test(self, id_test: int):
        ActionType = aliased(TNomenclatures)

        results = (
            db.session.query(TAction.date_start)
            .join(ActionType, TAction.id_action_type == ActionType.id_nomenclature)
            .filter(
                TAction.id_test == id_test,
                ActionType.cd_nomenclature == "svr"
            )
            .all()
        )
        return [r.date_start.isoformat() for r in results if r.date_start]


    def get_tests_by_material(id_material: int):
        ActionType = aliased(TNomenclatures)
        Liquid = aliased(TNomenclatures)

        subquery_treatment = (
            db.session.query(
                TAction.id_test.label("id_test"),
                Liquid.label_default.label("treatment_label"),
                db.func.row_number().over(
                    partition_by=TAction.id_test,
                    order_by=TAction.meta_create_date.desc()
                ).label("row_num")
            )
            .join(ActionType, TAction.id_action_type == ActionType.id_nomenclature)
            .outerjoin(Liquid, TAction.id_liquid_treatment == Liquid.id_nomenclature)
            .filter(ActionType.cd_nomenclature == "tra")
            .subquery()
        )

        query = (
            db.session.query(
                TTest,
                TMaterial.code_material,
                subquery_treatment.c.treatment_label
            )
            .join(TMaterial, TMaterial.id_material == TTest.id_material)
            .outerjoin(
                subquery_treatment,
                db.and_(
                    TTest.id_test == subquery_treatment.c.id_test,
                    subquery_treatment.c.row_num == 1
                )
            )
            .filter(TTest.id_material == id_material)
        )

        results = []
        for test, code_material, treatment_label in query.all():
            test_dict = test.to_dic()
            test_dict["code_material"] = code_material
            test_dict["treatment_label"] = treatment_label  # 🟡 C’EST CETTE CLÉ QUI DOIT APPARAÎTRE
            print("🧪 Test:", test.code, "Traitement:", treatment_label)
            results.append(test_dict)

        return results
    

    def get_treatment_by_test(self, id_test: int):
        ActionType = aliased(TNomenclatures)
        Liquid = aliased(TNomenclatures)

        query = (
            db.session.query(
                TAction.id_action,
                TAction.meta_create_date,
                Liquid.label_default.label("treatment_label")
            )
            .join(ActionType, TAction.id_action_type == ActionType.id_nomenclature)
            .outerjoin(Liquid, TAction.id_liquid_treatment == Liquid.id_nomenclature)
            .filter(
                TAction.id_test == id_test,
                ActionType.cd_nomenclature == 'tra',
                TAction.id_liquid_treatment.isnot(None)
            )
            .order_by(TAction.meta_create_date.desc())
            .first()
        )

        if not query:
            return None

        return {
            "id_action": query.id_action,
            "treatment_label": query.treatment_label
        }
    
    def update(self, id_action: int, data: dict):
        action = TAction.query.get(id_action)
        if not action:
            raise ValueError("Action introuvable")

        # Récupérer le code de l'action (tra, scar, svr, etc.)
        action_type = TNomenclatures.query.get(data.get("id_action_type"))
        action_code = action_type.cd_nomenclature if action_type else None

        # Supprimer les anciens réplicats s’il y en a
        db.session.query(TActionReplicate).filter_by(id_action=id_action).delete()

        # Réplicats individuels (svr)
        if action_code == "svr":
            replicates = data.pop("replicates", None)
            if replicates and isinstance(replicates, dict):
                for i in range(len(replicates.get("germes", []))):
                    rep = TActionReplicate(
                        id_action=id_action,
                        code=chr(65 + i),  # A, B, C, ...
                        count_germinated=replicates["germes"][i],
                        count_dead=replicates["mortes"][i],
                        count_viable=replicates["non_germes"][i],
                        count_transplanted=None,
                        total_count_germinated=None,
                        total_count_dead=None,
                        total_count_viable=None,
                        total_count_transplanted=None
                    )
                    db.session.add(rep)

        # Synthèse (synth)
        elif action_code == "synth":
            replicates = data.pop("replicates", None)
            if replicates and isinstance(replicates, dict):
                rep = TActionReplicate(
                    id_action=id_action,
                    code="synth",
                    count_germinated=None,
                    count_dead=None,
                    count_viable=None,
                    count_transplanted=None,
                    total_count_germinated=replicates.get("total_count_germinated"),
                    total_count_dead=replicates.get("total_count_dead"),
                    total_count_viable=replicates.get("total_count_viable"),
                    total_count_transplanted=None
                )
                db.session.add(rep)

        # Données additionnelles
        additional_data = data.pop("additional_data", None)
        if additional_data is not None:
            action.additional_data = additional_data

        # Mise à jour des champs standards
        for key, value in data.items():
            if hasattr(action, key):
                setattr(action, key, value)

        db.session.commit()
        return action
        
    def get_replicate_data_for_edit(self, id_action: int):
        replicates = (
            db.session.query(TActionReplicate)
            .filter(TActionReplicate.id_action == id_action)
            .all()
        )

        if not replicates:
            return None

        # Distinction entre suivi réplicats et synthèse
        if len(replicates) > 1:
            # Type "svr"
            data = {
                "replicates_for_form": [
                    {
                        "count_germes": rep.count_germinated,
                        "count_mortes": rep.count_dead,
                        "count_non_germes": rep.count_viable,
                        "last_replicate": rep.last_replicate
                    }
                    for rep in replicates
                ]
            }
        else:
            # Type "synth"
            rep = replicates[0]
            data = {
                "total_count_germinated": rep.total_count_germinated,
                "total_count_dead": rep.total_count_dead,
                "total_count_viable": rep.total_count_viable
            }

        return data
    
    def get_actions_by_id_sowing(self, id_sowing: int):
        ActionType = aliased(TNomenclatures)
        ScarificationType = aliased(TNomenclatures)
        Actor = aliased(User)

        query = (
            db.session.query(
                TAction.id_action,
                TAction.date_start,
                TAction.date_end,
                TAction.meta_create_date,
                ActionType.label_default.label("label_action_type"),
                ScarificationType.label_default.label("label_scarification_type"),
                Actor.nom_role.label("nom_actor"),
                Actor.prenom_role.label("prenom_actor")
            )
            .outerjoin(ActionType, TAction.id_action_type == ActionType.id_nomenclature)
            .outerjoin(ScarificationType, TAction.id_scarification_type == ScarificationType.id_nomenclature)
            .outerjoin(Actor, TAction.id_actor == Actor.id_role)
            .filter(TAction.id_sowing == id_sowing)
            .order_by(TAction.meta_create_date.desc())
        )

        results = query.all()

        return [
            {
                "id_action": row.id_action,
                "date_start": row.date_start.isoformat() if row.date_start else None,
                "date_end": row.date_end.isoformat() if row.date_end else None,
                "meta_create_date": row.meta_create_date.isoformat() if row.meta_create_date else None,
                "label_action_type": row.label_action_type,
                "label_scarification_type": row.label_scarification_type,
                "label_actor": f"{row.prenom_actor or ''} {row.nom_actor or ''}".strip()
            }
            for row in results
        ]

class CultureActionTransplantationRepository:
    def create_with_action(
        self,
        id_culture: int,
        action_data: dict,
        transplantation_data: dict,
        meta_create_by: int
    ):
        try:
            id_action_type = db.session.execute(
                text("""
                    SELECT n.id_nomenclature
                    FROM ref_nomenclatures.t_nomenclatures n
                    JOIN ref_nomenclatures.bib_nomenclatures_types t
                        ON t.id_type = n.id_type
                    WHERE t.mnemonique = 'CFE_ACTION_TYPE'
                    AND n.cd_nomenclature = 'transp'
                """)
            ).scalar()

            if not id_action_type:
                raise ValueError(
                    "Le type d'action Transplantation est introuvable."
                )

            date_start = action_data.get(
                "date_start"
            )

            date_end = action_data.get(
                "date_end"
            )

            if isinstance(date_start, str):
                date_start = isoparse(
                    date_start
                )

            if isinstance(date_end, str):
                date_end = isoparse(
                    date_end
                )

            action = TAction(
                id_culture=id_culture,
                id_sowing=None,
                id_test=None,
                date_start=date_start,
                date_end=date_end,
                id_actor=action_data.get(
                    "id_actor"
                ),
                id_action_type=id_action_type,
                meta_create_by=meta_create_by
            )

            db.session.add(action)
            db.session.flush()

            specific_data = dict(
                transplantation_data or {}
            )

            specific_data.pop(
                "id_action",
                None
            )

            specific_data.pop(
                "meta_create_by",
                None
            )

            transplantation = (
                TCultureActionTransplantation(
                    id_action=action.id_action,
                    meta_create_by=meta_create_by,
                    **specific_data
                )
            )

            db.session.add(
                transplantation
            )

            db.session.commit()

            return {
                "action": action.to_dic(),
                "transplantation":
                    transplantation.to_dic()
            }

        except (
            SQLAlchemyError,
            ValueError
        ) as error:

            db.session.rollback()
            raise error
    def create(
        self,
        data: dict
    ):
        try:
            transplantation = (
                TCultureActionTransplantation(
                    **data
                )
            )

            db.session.add(
                transplantation
            )

            db.session.commit()

            return transplantation.to_dic()

        except SQLAlchemyError as error:
            db.session.rollback()
            raise error


    def get_by_action(
        self,
        id_action: int
    ):
        TransplantationType = aliased(
            TNomenclatures
        )

        PhysiologicalStage = aliased(
            TNomenclatures
        )

        MainLocation = aliased(
            TNomenclatures
        )

        Actor = aliased(
            User
        )

        row = (
            db.session.query(
                TCultureActionTransplantation,
                TAction.date_start,
                TAction.date_end,
                TAction.id_actor,

                TransplantationType.label_fr.label(
                    "transplantation_type_label_fr"
                ),
                TransplantationType.label_default.label(
                    "transplantation_type_label_default"
                ),

                PhysiologicalStage.label_fr.label(
                    "physiological_stage_label_fr"
                ),
                PhysiologicalStage.label_default.label(
                    "physiological_stage_label_default"
                ),

                MainLocation.label_fr.label(
                    "main_location_label_fr"
                ),
                MainLocation.label_default.label(
                    "main_location_label_default"
                ),

                Actor.prenom_role.label(
                    "actor_first_name"
                ),
                Actor.nom_role.label(
                    "actor_last_name"
                )
            )
            .join(
                TAction,
                TAction.id_action ==
                TCultureActionTransplantation.id_action
            )
            .outerjoin(
                TransplantationType,
                TransplantationType.id_nomenclature ==
                TCultureActionTransplantation.id_type
            )
            .outerjoin(
                PhysiologicalStage,
                PhysiologicalStage.id_nomenclature ==
                TCultureActionTransplantation
                .id_physiological_development_stage
            )
            .outerjoin(
                MainLocation,
                MainLocation.id_nomenclature ==
                TCultureActionTransplantation
                .id_main_location
            )
            .outerjoin(
                Actor,
                Actor.id_role ==
                TAction.id_actor
            )
            .filter(
                TCultureActionTransplantation.id_action ==
                id_action
            )
            .first()
        )

        if not row:
            return None

        transplantation = row[0]
        result = transplantation.to_dic()

        result.update({
            "date_start": (
                row.date_start.isoformat()
                if row.date_start
                else None
            ),

            "date_end": (
                row.date_end.isoformat()
                if row.date_end
                else None
            ),

            "id_actor": row.id_actor,

            "actor_label": (
                f"{row.actor_first_name or ''} "
                f"{row.actor_last_name or ''}"
            ).strip() or None,

            "transplantation_type_label": (
                row.transplantation_type_label_fr
                or row.transplantation_type_label_default
            ),

            "physiological_stage_label": (
                row.physiological_stage_label_fr
                or row.physiological_stage_label_default
            ),

            "main_location_label": (
                row.main_location_label_fr
                or row.main_location_label_default
            )
        })

        return result


    def update_with_action(
        self,
        id_action: int,
        action_data: dict,
        transplantation_data: dict,
        meta_update_by: int
    ):
        try:
            action = (
                db.session.query(TAction)
                .filter(
                    TAction.id_action ==
                    id_action,
                    TAction.id_culture.isnot(None)
                )
                .first()
            )

            transplantation = (
                db.session.query(
                    TCultureActionTransplantation
                )
                .filter(
                    TCultureActionTransplantation
                    .id_action ==
                    id_action
                )
                .first()
            )

            if (
                not action
                or not transplantation
            ):
                return None

            action_data = dict(
                action_data or {}
            )

            transplantation_data = dict(
                transplantation_data or {}
            )

            date_start = action_data.get(
                "date_start",
                action.date_start
            )

            date_end = action_data.get(
                "date_end",
                action.date_end
            )

            if isinstance(date_start, str):
                date_start = (
                    isoparse(date_start)
                    if date_start.strip()
                    else None
                )

            if isinstance(date_end, str):
                date_end = (
                    isoparse(date_end)
                    if date_end.strip()
                    else None
                )

            if not date_start:
                raise ValueError(
                    "La date de début est obligatoire."
                )

            if (
                date_end
                and date_end < date_start
            ):
                raise ValueError(
                    "La date de fin ne peut pas "
                    "précéder la date de début."
                )

            action.date_start = date_start
            action.date_end = date_end

            if "id_actor" in action_data:
                action.id_actor = (
                    action_data.get("id_actor")
                )

            action.meta_update_by = (
                meta_update_by
            )

            action.meta_update_date = (
                datetime.utcnow()
            )

            editable_fields = (
                "id_type",
                "intervention_quantity",
                "in_progress_quantity",
                "packaging",
                "substrat",
                "id_physiological_development_stage",
                "id_main_location",
                "precise_location",
                "remarks"
            )

            for field_name in editable_fields:
                if (
                    field_name
                    in transplantation_data
                ):
                    setattr(
                        transplantation,
                        field_name,
                        transplantation_data[
                            field_name
                        ]
                    )

            transplantation.meta_update_by = (
                meta_update_by
            )

            transplantation.meta_update_date = (
                datetime.utcnow()
            )

            db.session.commit()

            return self.get_by_action(
                id_action
            )

        except (
            SQLAlchemyError,
            ValueError
        ) as error:

            db.session.rollback()
            raise error


class CultureActionObservationRepository:
    def create_with_action(
        self,
        id_culture: int,
        action_data: dict,
        observation_data: dict,
        meta_create_by: int
    ):
        try:
            id_action_type = db.session.execute(
                text("""
                    SELECT n.id_nomenclature
                    FROM ref_nomenclatures.t_nomenclatures n
                    JOIN ref_nomenclatures.bib_nomenclatures_types t
                        ON t.id_type = n.id_type
                    WHERE t.mnemonique = 'CFE_ACTION_TYPE'
                    AND n.cd_nomenclature = 'obs'
                """)
            ).scalar()

            if not id_action_type:
                raise ValueError(
                    "Le type d'action Observation est introuvable."
                )

            action_data = dict(
                action_data or {}
            )

            date_start = action_data.get(
                "date_start"
            )

            date_end = action_data.get(
                "date_end"
            )

            if isinstance(date_start, str):
                date_start = (
                    isoparse(date_start)
                    if date_start.strip()
                    else None
                )

            if isinstance(date_end, str):
                date_end = (
                    isoparse(date_end)
                    if date_end.strip()
                    else None
                )

            if not date_start:
                raise ValueError(
                    "La date de début est obligatoire."
                )

            if (
                date_end
                and date_end < date_start
            ):
                raise ValueError(
                    "La date de fin ne peut pas "
                    "précéder la date de début."
                )

            action = TAction(
                id_culture=id_culture,
                id_sowing=None,
                id_test=None,
                date_start=date_start,
                date_end=date_end,
                id_actor=action_data.get(
                    "id_actor"
                ),
                id_action_type=id_action_type,
                meta_create_by=meta_create_by
            )

            db.session.add(action)
            db.session.flush()

            specific_data = dict(
                observation_data or {}
            )

            for protected_field in (
                "id_culture_action_observation",
                "id_action",
                "meta_create_by",
                "meta_create_date",
                "meta_update_by",
                "meta_update_date"
            ):
                specific_data.pop(
                    protected_field,
                    None
                )

            observation = (
                TCultureActionObservation(
                    id_action=action.id_action,
                    meta_create_by=meta_create_by,
                    **specific_data
                )
            )

            db.session.add(
                observation
            )

            db.session.commit()

            return {
                "action": action.to_dic(),
                "observation":
                    observation.to_dic()
            }

        except (
            SQLAlchemyError,
            ValueError
        ) as error:

            db.session.rollback()
            raise error


    def get_by_action(
        self,
        id_action: int
    ):
        PhenologicalStage = aliased(
            TNomenclatures
        )

        Actor = aliased(
            User
        )

        row = (
            db.session.query(
                TCultureActionObservation,
                TAction.date_start,
                TAction.date_end,
                TAction.id_actor,

                PhenologicalStage.label_fr.label(
                    "phenological_stage_label_fr"
                ),
                PhenologicalStage.label_default.label(
                    "phenological_stage_label_default"
                ),

                Actor.prenom_role.label(
                    "actor_first_name"
                ),
                Actor.nom_role.label(
                    "actor_last_name"
                )
            )
            .join(
                TAction,
                TAction.id_action ==
                TCultureActionObservation.id_action
            )
            .outerjoin(
                PhenologicalStage,
                PhenologicalStage.id_nomenclature ==
                TCultureActionObservation
                .id_phenological_stage
            )
            .outerjoin(
                Actor,
                Actor.id_role ==
                TAction.id_actor
            )
            .filter(
                TCultureActionObservation.id_action ==
                id_action
            )
            .first()
        )

        if not row:
            return None

        observation = row[0]

        result = (
            observation.to_dic()
        )

        result.update({
            "date_start": (
                row.date_start.isoformat()
                if row.date_start
                else None
            ),

            "date_end": (
                row.date_end.isoformat()
                if row.date_end
                else None
            ),

            "id_actor":
                row.id_actor,

            "actor_label": (
                f"{row.actor_first_name or ''} "
                f"{row.actor_last_name or ''}"
            ).strip() or None,

            "phenological_stage_label": (
                row.phenological_stage_label_fr
                or
                row.phenological_stage_label_default
            )
        })

        return result


    def update_with_action(
        self,
        id_action: int,
        action_data: dict,
        observation_data: dict,
        meta_update_by: int
    ):
        try:
            action = (
                db.session.query(
                    TAction
                )
                .filter(
                    TAction.id_action ==
                    id_action,
                    TAction.id_culture.isnot(
                        None
                    )
                )
                .first()
            )

            observation = (
                db.session.query(
                    TCultureActionObservation
                )
                .filter(
                    TCultureActionObservation
                    .id_action ==
                    id_action
                )
                .first()
            )

            if (
                not action
                or not observation
            ):
                return None

            action_data = dict(
                action_data or {}
            )

            observation_data = dict(
                observation_data or {}
            )

            date_start = action_data.get(
                "date_start",
                action.date_start
            )

            date_end = action_data.get(
                "date_end",
                action.date_end
            )

            if isinstance(
                date_start,
                str
            ):
                date_start = (
                    isoparse(date_start)
                    if date_start.strip()
                    else None
                )

            if isinstance(
                date_end,
                str
            ):
                date_end = (
                    isoparse(date_end)
                    if date_end.strip()
                    else None
                )

            if not date_start:
                raise ValueError(
                    "La date de début est obligatoire."
                )

            if (
                date_end
                and date_end < date_start
            ):
                raise ValueError(
                    "La date de fin ne peut pas "
                    "précéder la date de début."
                )

            action.date_start = (
                date_start
            )

            action.date_end = (
                date_end
            )

            if "id_actor" in action_data:
                action.id_actor = (
                    action_data.get(
                        "id_actor"
                    )
                )

            action.meta_update_by = (
                meta_update_by
            )

            action.meta_update_date = (
                datetime.utcnow()
            )

            editable_fields = (
                "individual_count",
                "id_phenological_stage",
                "remarks"
            )

            for field_name in editable_fields:
                if (
                    field_name
                    in observation_data
                ):
                    setattr(
                        observation,
                        field_name,
                        observation_data[
                            field_name
                        ]
                    )

            observation.meta_update_by = (
                meta_update_by
            )

            observation.meta_update_date = (
                datetime.utcnow()
            )

            db.session.commit()

            return self.get_by_action(
                id_action
            )

        except (
            SQLAlchemyError,
            ValueError
        ) as error:

            db.session.rollback()
            raise error


class CultureActionTreatmentRepository:
    def create_with_action(
        self,
        id_culture: int,
        action_data: dict,
        treatment_data: dict,
        meta_create_by: int
    ):
        try:
            id_action_type = db.session.execute(
                text("""
                    SELECT n.id_nomenclature
                    FROM ref_nomenclatures.t_nomenclatures n
                    JOIN ref_nomenclatures.bib_nomenclatures_types t
                        ON t.id_type = n.id_type
                    WHERE t.mnemonique = 'CFE_ACTION_TYPE'
                    AND n.cd_nomenclature = 'tracult'
                """)
            ).scalar()

            if not id_action_type:
                raise ValueError(
                    "Le type d'action Traitement Culture est introuvable."
                )

            action_data = dict(
                action_data or {}
            )

            date_start = action_data.get(
                "date_start"
            )

            date_end = action_data.get(
                "date_end"
            )

            if isinstance(
                date_start,
                str
            ):
                date_start = (
                    isoparse(date_start)
                    if date_start.strip()
                    else None
                )

            if isinstance(
                date_end,
                str
            ):
                date_end = (
                    isoparse(date_end)
                    if date_end.strip()
                    else None
                )

            if not date_start:
                raise ValueError(
                    "La date de début est obligatoire."
                )

            if (
                date_end
                and date_end < date_start
            ):
                raise ValueError(
                    "La date de fin ne peut pas "
                    "précéder la date de début."
                )

            action = TAction(
                id_culture=id_culture,
                id_sowing=None,
                id_test=None,
                date_start=date_start,
                date_end=date_end,
                id_actor=action_data.get(
                    "id_actor"
                ),
                id_action_type=id_action_type,
                meta_create_by=meta_create_by
            )

            db.session.add(
                action
            )

            db.session.flush()

            specific_data = dict(
                treatment_data or {}
            )

            for protected_field in (
                "id_culture_action_treatment",
                "id_action",
                "meta_create_by",
                "meta_create_date",
                "meta_update_by",
                "meta_update_date"
            ):
                specific_data.pop(
                    protected_field,
                    None
                )

            treatment = (
                TCultureActionTreatment(
                    id_action=action.id_action,
                    meta_create_by=meta_create_by,
                    **specific_data
                )
            )

            db.session.add(
                treatment
            )

            db.session.commit()

            return {
                "action": action.to_dic(),
                "treatment":
                    treatment.to_dic()
            }

        except (
            SQLAlchemyError,
            ValueError
        ) as error:

            db.session.rollback()
            raise error


    def get_by_action(
        self,
        id_action: int
    ):
        PhysiologicalStage = aliased(
            TNomenclatures
        )

        Actor = aliased(
            User
        )

        row = (
            db.session.query(
                TCultureActionTreatment,
                TAction.date_start,
                TAction.date_end,
                TAction.id_actor,

                PhysiologicalStage.label_fr.label(
                    "physiological_stage_label_fr"
                ),
                PhysiologicalStage.label_default.label(
                    "physiological_stage_label_default"
                ),

                Actor.prenom_role.label(
                    "actor_first_name"
                ),
                Actor.nom_role.label(
                    "actor_last_name"
                )
            )
            .join(
                TAction,
                TAction.id_action ==
                TCultureActionTreatment.id_action
            )
            .outerjoin(
                PhysiologicalStage,
                PhysiologicalStage.id_nomenclature ==
                TCultureActionTreatment
                .id_physiological_development_stage
            )
            .outerjoin(
                Actor,
                Actor.id_role ==
                TAction.id_actor
            )
            .filter(
                TCultureActionTreatment.id_action ==
                id_action
            )
            .first()
        )

        if not row:
            return None

        treatment = row[0]

        result = (
            treatment.to_dic()
        )

        result.update({
            "date_start": (
                row.date_start.isoformat()
                if row.date_start
                else None
            ),

            "date_end": (
                row.date_end.isoformat()
                if row.date_end
                else None
            ),

            "id_actor":
                row.id_actor,

            "actor_label": (
                f"{row.actor_first_name or ''} "
                f"{row.actor_last_name or ''}"
            ).strip() or None,

            "physiological_stage_label": (
                row.physiological_stage_label_fr
                or
                row.physiological_stage_label_default
            )
        })

        return result


    def update_with_action(
        self,
        id_action: int,
        action_data: dict,
        treatment_data: dict,
        meta_update_by: int
    ):
        try:
            action = (
                db.session.query(
                    TAction
                )
                .filter(
                    TAction.id_action ==
                    id_action,
                    TAction.id_culture.isnot(
                        None
                    )
                )
                .first()
            )

            treatment = (
                db.session.query(
                    TCultureActionTreatment
                )
                .filter(
                    TCultureActionTreatment
                    .id_action ==
                    id_action
                )
                .first()
            )

            if (
                not action
                or not treatment
            ):
                return None

            action_data = dict(
                action_data or {}
            )

            treatment_data = dict(
                treatment_data or {}
            )

            date_start = action_data.get(
                "date_start",
                action.date_start
            )

            date_end = action_data.get(
                "date_end",
                action.date_end
            )

            if isinstance(
                date_start,
                str
            ):
                date_start = (
                    isoparse(date_start)
                    if date_start.strip()
                    else None
                )

            if isinstance(
                date_end,
                str
            ):
                date_end = (
                    isoparse(date_end)
                    if date_end.strip()
                    else None
                )

            if not date_start:
                raise ValueError(
                    "La date de début est obligatoire."
                )

            if (
                date_end
                and date_end < date_start
            ):
                raise ValueError(
                    "La date de fin ne peut pas "
                    "précéder la date de début."
                )

            action.date_start = (
                date_start
            )

            action.date_end = (
                date_end
            )

            if "id_actor" in action_data:
                action.id_actor = (
                    action_data.get(
                        "id_actor"
                    )
                )

            action.meta_update_by = (
                meta_update_by
            )

            action.meta_update_date = (
                datetime.utcnow()
            )

            editable_fields = (
                "id_physiological_development_stage",
                "disease_or_deficiency",
                "type",
                "success"
            )

            for field_name in editable_fields:
                if (
                    field_name
                    in treatment_data
                ):
                    setattr(
                        treatment,
                        field_name,
                        treatment_data[
                            field_name
                        ]
                    )

            treatment.meta_update_by = (
                meta_update_by
            )

            treatment.meta_update_date = (
                datetime.utcnow()
            )

            db.session.commit()

            return self.get_by_action(
                id_action
            )

        except (
            SQLAlchemyError,
            ValueError
        ) as error:

            db.session.rollback()
            raise error


class CultureActionSamplingRepository:
    def create_with_action(
        self,
        id_culture: int,
        action_data: dict,
        sampling_data: dict,
        meta_create_by: int
    ):
        try:
            id_action_type = db.session.execute(
                text("""
                    SELECT n.id_nomenclature
                    FROM ref_nomenclatures.t_nomenclatures n
                    JOIN ref_nomenclatures.bib_nomenclatures_types t
                        ON t.id_type = n.id_type
                    WHERE t.mnemonique = 'CFE_ACTION_TYPE'
                    AND n.cd_nomenclature = 'prel'
                """)
            ).scalar()

            if not id_action_type:
                raise ValueError(
                    "Le type d'action Prélèvement est introuvable."
                )

            action_data = dict(
                action_data or {}
            )

            date_start = action_data.get(
                "date_start"
            )

            date_end = action_data.get(
                "date_end"
            )

            if isinstance(
                date_start,
                str
            ):
                date_start = (
                    isoparse(date_start)
                    if date_start.strip()
                    else None
                )

            if isinstance(
                date_end,
                str
            ):
                date_end = (
                    isoparse(date_end)
                    if date_end.strip()
                    else None
                )

            if not date_start:
                raise ValueError(
                    "La date de début est obligatoire."
                )

            if (
                date_end
                and date_end < date_start
            ):
                raise ValueError(
                    "La date de fin ne peut pas "
                    "précéder la date de début."
                )

            action = TAction(
                id_culture=id_culture,
                id_sowing=None,
                id_test=None,
                date_start=date_start,
                date_end=date_end,
                id_actor=action_data.get(
                    "id_actor"
                ),
                id_action_type=id_action_type,
                meta_create_by=meta_create_by
            )

            db.session.add(
                action
            )

            db.session.flush()

            specific_data = dict(
                sampling_data or {}
            )

            for protected_field in (
                "id_culture_action_sampling",
                "id_action",
                "meta_create_by",
                "meta_create_date",
                "meta_update_by",
                "meta_update_date"
            ):
                specific_data.pop(
                    protected_field,
                    None
                )

            sampling = (
                TCultureActionSampling(
                    id_action=action.id_action,
                    meta_create_by=meta_create_by,
                    **specific_data
                )
            )

            db.session.add(
                sampling
            )

            db.session.commit()

            return {
                "action": action.to_dic(),
                "sampling":
                    sampling.to_dic()
            }

        except (
            SQLAlchemyError,
            ValueError
        ) as error:

            db.session.rollback()
            raise error


    def get_by_action(
        self,
        id_action: int
    ):
        Actor = aliased(
            User
        )

        row = (
            db.session.query(
                TCultureActionSampling,
                TAction.date_start,
                TAction.date_end,
                TAction.id_actor,

                Actor.prenom_role.label(
                    "actor_first_name"
                ),
                Actor.nom_role.label(
                    "actor_last_name"
                )
            )
            .join(
                TAction,
                TAction.id_action ==
                TCultureActionSampling.id_action
            )
            .outerjoin(
                Actor,
                Actor.id_role ==
                TAction.id_actor
            )
            .filter(
                TCultureActionSampling.id_action ==
                id_action
            )
            .first()
        )

        if not row:
            return None

        sampling = row[0]

        result = (
            sampling.to_dic()
        )

        result.update({
            "date_start": (
                row.date_start.isoformat()
                if row.date_start
                else None
            ),

            "date_end": (
                row.date_end.isoformat()
                if row.date_end
                else None
            ),

            "id_actor":
                row.id_actor,

            "actor_label": (
                f"{row.actor_first_name or ''} "
                f"{row.actor_last_name or ''}"
            ).strip() or None
        })

        return result


    def update_with_action(
        self,
        id_action: int,
        action_data: dict,
        sampling_data: dict,
        meta_update_by: int
    ):
        try:
            action = (
                db.session.query(
                    TAction
                )
                .filter(
                    TAction.id_action ==
                    id_action,
                    TAction.id_culture.isnot(
                        None
                    )
                )
                .first()
            )

            sampling = (
                db.session.query(
                    TCultureActionSampling
                )
                .filter(
                    TCultureActionSampling
                    .id_action ==
                    id_action
                )
                .first()
            )

            if (
                not action
                or not sampling
            ):
                return None

            action_data = dict(
                action_data or {}
            )

            sampling_data = dict(
                sampling_data or {}
            )

            date_start = action_data.get(
                "date_start",
                action.date_start
            )

            date_end = action_data.get(
                "date_end",
                action.date_end
            )

            if isinstance(
                date_start,
                str
            ):
                date_start = (
                    isoparse(date_start)
                    if date_start.strip()
                    else None
                )

            if isinstance(
                date_end,
                str
            ):
                date_end = (
                    isoparse(date_end)
                    if date_end.strip()
                    else None
                )

            if not date_start:
                raise ValueError(
                    "La date de début est obligatoire."
                )

            if (
                date_end
                and date_end < date_start
            ):
                raise ValueError(
                    "La date de fin ne peut pas "
                    "précéder la date de début."
                )

            action.date_start = (
                date_start
            )

            action.date_end = (
                date_end
            )

            if "id_actor" in action_data:
                action.id_actor = (
                    action_data.get(
                        "id_actor"
                    )
                )

            action.meta_update_by = (
                meta_update_by
            )

            action.meta_update_date = (
                datetime.utcnow()
            )

            editable_fields = (
                "quantity",
                "remarks"
            )

            for field_name in editable_fields:
                if (
                    field_name
                    in sampling_data
                ):
                    setattr(
                        sampling,
                        field_name,
                        sampling_data[
                            field_name
                        ]
                    )

            sampling.meta_update_by = (
                meta_update_by
            )

            sampling.meta_update_date = (
                datetime.utcnow()
            )

            db.session.commit()

            return self.get_by_action(
                id_action
            )

        except (
            SQLAlchemyError,
            ValueError
        ) as error:

            db.session.rollback()
            raise error


class ActionReplicateRepository:
    def create(self, data):
        try:
            code_parent = data.pop("code_parent", None)
            if code_parent:
                parent_test = TAction.query.filter_by(code=code_parent).first()
                data["code_parent"] = parent_test.code if parent_test else None

            additional_data = data.pop("additional_data", None)
            replicates = data.pop("replicates", None)

            # Créer l'action principale
            action = TAction(**data, additional_data=additional_data or {})
            db.session.add(action)
            db.session.flush()  # Pour avoir l'id_action

            # Déterminer le code d'action (ex: 'svr', 'synth')
            action_type = TNomenclatures.query.get(data["id_action_type"])
            action_code = action_type.cd_nomenclature if action_type else None

            # ✅ Suivi par réplicat
            if action_code == "svr" and isinstance(replicates, dict):
                germes = replicates.get("germes", [])
                mortes = replicates.get("mortes", [])
                non_germes = replicates.get("non_germes", [])
                last_replicate = replicates.get("last_replicate", False)

                for i in range(len(germes)):
                    rep = TActionReplicate(
                        id_action=action.id_action,
                        code=chr(65 + i),  # A, B, C, ...
                        count_germinated=germes[i],
                        count_dead=mortes[i],
                        count_viable=non_germes[i],
                        count_transplanted=None,
                        total_count_germinated=None,
                        total_count_dead=None,
                        total_count_viable=None,
                        total_count_transplanted=None,
                        last_replicate=True if last_replicate and i == len(germes) - 1 else False
                    )
                    db.session.add(rep)

            # ✅ Synthèse de suivi
            elif action_code == "synth" and isinstance(replicates, dict):
                rep = TActionReplicate(
                    id_action=action.id_action,
                    code="synth",
                    count_germinated=None,
                    count_dead=None,
                    count_viable=None,
                    count_transplanted=None,
                    total_count_germinated=replicates.get("total_count_germinated"),
                    total_count_dead=replicates.get("total_count_dead"),
                    total_count_viable=replicates.get("total_count_viable"),
                    total_count_transplanted=None,
                    last_replicate=None  
                )
                db.session.add(rep)

            db.session.commit()
            # 🔁 Charger les réplicats associés à l'action créée
            replicates_rows = (
                db.session.query(TActionReplicate)
                .filter_by(id_action=action.id_action)
                .order_by(TActionReplicate.code)
                .all()
            )

            # ✅ Retourne l'action + les réplicats
            return {
                "action": action.to_dict(),
                "replicates": [r.to_dict() for r in replicates_rows],
                "message": "Action créée"
            }


        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

     
    def update(self, id_action: int, data: dict):
        action = TAction.query.get(id_action)
        if not action:
            raise ValueError("Action introuvable")

        # Récupérer le code de l'action (tra, scar, svr, etc.)
        action_type = TNomenclatures.query.get(data.get("id_action_type"))
        action_code = action_type.cd_nomenclature if action_type else None

        # Mettre à jour les champs simples de TAction
        additional_data = data.get("additional_data")
        if additional_data:
            action.additional_data = additional_data

        for key, value in data.items():
            if hasattr(action, key):
                setattr(action, key, value)

        # Supprimer les anciens réplicats liés à cette action
        db.session.query(TActionReplicate).filter_by(id_action=id_action).delete()

        # Récupérer les nouveaux réplicats
        replicates = data.pop("replicates", None)

        # Réplicats individuels (svr)
        if action_code == "svr" and isinstance(replicates, dict):
            germes = replicates.get("germes", [])
            mortes = replicates.get("mortes", [])
            non_germes = replicates.get("nonGermes", [])
            last_replicate = replicates.get("last_replicate", False)

            for i in range(len(germes)):
                rep = TActionReplicate(
                    id_action=id_action,
                    code=chr(65 + i),  # A, B, C, ...
                    count_germinated=germes[i],
                    count_dead=mortes[i],
                    count_viable=non_germes[i],
                    count_transplanted=None,
                    total_count_germinated=None,
                    total_count_dead=None,
                    total_count_viable=None,
                    total_count_transplanted=None,
                    last_replicate=True if last_replicate and i == len(germes) - 1 else False
                )
                db.session.add(rep)

        # Synthèse de suivi (synth)
        elif action_code == "synth" and isinstance(replicates, dict):
            rep = TActionReplicate(
                id_action=id_action,
                code="synth",
                count_germinated=None,
                count_dead=None,
                count_viable=None,
                count_transplanted=None,
                total_count_germinated=replicates.get("total_count_germinated"),
                total_count_dead=replicates.get("total_count_dead"),
                total_count_viable=replicates.get("total_count_viable"),
                total_count_transplanted=None,
                last_replicate=None
            )
            db.session.add(rep)

        db.session.commit()
        return action.to_dict()

