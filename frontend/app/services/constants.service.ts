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

  constructor() {}
}
