from geonature.utils.env import db
from sqlalchemy.exc import SQLAlchemyError
from pypnusershub.db.models import User
from datetime import datetime, date
from shapely.geometry import shape
from geoalchemy2.shape import from_shape
from pypn_habref_api.models import Habref
from pypnnomenclature.models import TNomenclatures
from sqlalchemy.orm import aliased


from .models import(
    THarvest,
    TSeed,
    THarvestMaterial,
    CorHarvestObserver,
    TSeedStock,
    TSeedStockMouvement,
    TSeedTablet
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
        query = db.session.query(THarvest).filter(THarvest.id_harvest == harvest_id)
        harvest = query.first()
        return harvest
    
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
                THarvestMaterial.code_material.label('harvest_material')
            )
            .outerjoin(Habref, THarvest.cd_hab == Habref.cd_hab)
            .outerjoin(NomenclatureType, THarvest.id_harvest_type == NomenclatureType.id_nomenclature) 
            .outerjoin(NomenclatureExpo, THarvest.id_exposition == NomenclatureExpo.id_nomenclature)
            .outerjoin(THarvestMaterial, THarvest.id_harvest == THarvestMaterial.id_harvest)
            .limit(limit)
            .offset(offset)
        )
        return query.all()

    
    def _buildOutput(self, harvest):
        item = harvest.as_dict()
        if harvest.date_start is not None:
            item["date_start"] = harvest.date_start.strftime(self.date_fmt)
        if harvest.date_end is not None:
            item["date_end"] = harvest.date_end.strftime(self.date_fmt)

    def create(self, data):
        try:
            if "meta_create_date" not in data:
                data["meta_create_date"] = datetime.utcnow()

            if data.get("date_end") == "":
                data["date_end"] = None
            
            if 'geom' in data:
                data['geom'] = self._convert_geojson_to_ewkt(data['geom'])

            observers_ids = data.pop("observers", [])
            harvest = THarvest(**data)

            if observers_ids:
                observers = User.query.filter(User.id_role.in_(observers_ids)).all()
                harvest.observers.extend(observers)

            db.session.add(harvest)
            db.session.commit()
            return harvest
        except SQLAlchemyError as e:
            db.session.rollback()
            raise e

        