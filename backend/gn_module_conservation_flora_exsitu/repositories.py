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
from functools import cached_property


from .models import(
    THarvest,
    TMaterial,
    CorHarvestObserver,
    CorMaterialTaxon,
    TMaterielSeed,
    TStorage
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

        # Quantité initiale globale
        initial_storage = db.session.query(func.coalesce(func.sum(TStorage.quantity), 0)) \
            .filter(
                TStorage.id_material == id_material,
                TStorage.id_storage_action == id_sti
            ).scalar()

        # Total des quantités consommées (destockage + déplacement)
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


