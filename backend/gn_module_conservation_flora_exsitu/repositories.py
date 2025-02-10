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

        