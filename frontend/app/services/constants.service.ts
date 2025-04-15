import { Injectable } from '@angular/core';

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

  // Configuration des champs en fonction du code nomenclature
  public readonly FIELD_CONFIGS = new Map<string, any>([
    [this.LOCATION_CODES.COMMUNE,  { locationType: 25, showCommune: true, showDepartment: false }],
    [this.LOCATION_CODES.DEPARTMENT, { locationType: 26, showCommune: false, showDepartment: true }],
    [this.LOCATION_CODES.NL, { hideAll: true, callFormValid: true }],
    [this.LOCATION_CODES.PTP, { showMap: true, showCommune: false, showDepartment: false, showResolution: false }],
    [this.LOCATION_CODES.PTAPP, { showMap: true, showResolution: true, showCommune: false, showDepartment: false }]
  ]);

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

  private readonly STORABLE_MATERIAL_CODES = [
    this.HARVEST_MATERIAL_CODES.SEED,
    this.HARVEST_MATERIAL_CODES.SPORE
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

  constructor() {}
}
