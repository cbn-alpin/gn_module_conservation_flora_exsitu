import { Injectable } from '@angular/core';
import { DataFormService } from '@geonature_common/form/data-form.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { ConfigService } from '@geonature/services/config.service';

@Injectable()
export class HarvestStoreService {
  public nomenclatureItems = {};
  public typoHabitat: Array<any>;
  public stations: Array<any>;
  public firstMessageMapList = true;
  public cfeConfig: any = {};
  /** Current list of id_station in the map list */
  public idsStation: Array<number>;
  constructor(
    private _gnDataService: DataFormService,
    public config: ConfigService
  ) {
    this.cfeConfig = this.config['CONSERVATION_FLORA_EXSITU']
    
  }

}
