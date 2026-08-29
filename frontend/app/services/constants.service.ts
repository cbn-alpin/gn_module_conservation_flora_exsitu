import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConstantsService {
  
  // Codes de nomenclature
  public readonly LOCATION_CODES = {
    COMMUNE: 'com',
    DEPARTMENT: 'dept',
    NL: 'nl',
    PTP: 'ptp',
    PTAPP: 'ptapp'
  };

  public readonly fieldConfigs$ = new BehaviorSubject<Map<string, any>>(new Map());
  public FIELD_CONFIGS: Map<string, any> = new Map();

  private initFieldConfigs() {
    this.api.getLocationTypeIds().subscribe(ids => {
      const configs = new Map<string, any>([
        [this.LOCATION_CODES.COMMUNE, { locationType: ids.COMMUNE_ID, showCommune: true, showDepartment: false }],
        [this.LOCATION_CODES.DEPARTMENT, { locationType: ids.DEPARTEMENT_ID, showCommune: false, showDepartment: true }],
        [this.LOCATION_CODES.NL, { hideAll: true, callFormValid: true }],
        [this.LOCATION_CODES.PTP, { showMap: true, showCommune: false, showDepartment: false, showResolution: true }],
        [this.LOCATION_CODES.PTAPP, { showMap: true, showResolution: true, showCommune: false, showDepartment: false }]
      ]);
      this.FIELD_CONFIGS = configs;
      this.fieldConfigs$.next(configs);
    });    
  }

  // Codes de nomenclature pour les matériaux
  public readonly HARVEST_MATERIAL_CODES = {
    SEED_MIX: 'mdg',
    SEED: 'gr',
    SOIL_SAMPLING: 'prs',
    WHOLE_PLANT: 'pe',
    RHIZOME: 'rh',
    BULB: 'bul',
    BULBIL: 'bb',
    ROOT_SPLIT: 'es',
    CUTTING: 'bout',
    NO_INFORMATION: 'ai',
    SPORE: 'sp'
  };

  // Liste des codes permettant plusieurs taxons
  public readonly MULTIPLE_TAXON_CODES = [
    this.HARVEST_MATERIAL_CODES.SEED_MIX,
    this.HARVEST_MATERIAL_CODES.SOIL_SAMPLING
  ];

  public readonly SEED_DESCRIPTION_CODES = [
    this.HARVEST_MATERIAL_CODES.SEED,
  ];

  public readonly STORABLE_MATERIAL_CODES = [
    this.HARVEST_MATERIAL_CODES.SEED,
    this.HARVEST_MATERIAL_CODES.SPORE,
    this.HARVEST_MATERIAL_CODES.SEED_MIX,
    this.HARVEST_MATERIAL_CODES.SOIL_SAMPLING
  ]

  public readonly PLACE_CODES = {
    PRE_DRYING_ROOM: 'sdps',
    DRYING_ROOM: 'sds',
    COLD_ROOM: 'cf',
    FREEZER: 'cong'
  };

  private readonly _DRY_TYPE_CODES = [
    this.PLACE_CODES.DRYING_ROOM
  ];

  public get DRY_TYPE_CODES(): string[] {
    return this._DRY_TYPE_CODES.slice();
  }

  public readonly ACTION_CODES = {
    INITIAL_STORAGE: 'sti',
    HUMIDITY_INDICATOR_ADDED: 'acth',
    HUMIDITY_EVALUATION: 'evu',
    PRECISE_HUMIDITY_MEASUREMENT: 'mhp',
    DESTOCKING: 'dest',
    MOVEMENT: 'depl'
  };

  public readonly DISPLAY_DESTINATION_FIELD = [
    this.ACTION_CODES.DESTOCKING,
    this.ACTION_CODES.MOVEMENT
  ];

  public readonly REQUIRED_QUANTITY_FIELD = [
    this.ACTION_CODES.INITIAL_STORAGE,
    this.ACTION_CODES.DESTOCKING,
    this.ACTION_CODES.MOVEMENT
  ];

  public readonly DESTOCK_CODES = {
    PARTIAL: 'part',
    FULL: 'total'
  };

  constructor(private api: DataService) {
    this.initFieldConfigs();
  }

  public readonly MEDIA_TYPE = {
    PHOTO: '2',
    URL: '3'
  };
}
