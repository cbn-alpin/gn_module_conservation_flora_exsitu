import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { ConfigService } from '@geonature/services/config.service';

@Injectable()
export class DataService {
  private moduleBaseUrl: string;

  constructor(
    private api: HttpClient, 
    private cfg: ConfigService) {
    this.moduleBaseUrl = `${this.cfg.API_ENDPOINT}${this.cfg.CONSERVATION_FLORA_EXSITU.MODULE_URL}`;
  }

  addHarvest(data: any) {
    return this.api.post<any>(`${this.moduleBaseUrl}/harvests`, data);
  }

  getAllHarvest() {
    return this.api.get<any>(`${this.moduleBaseUrl}/harvests`);
  }

  getHarvestById(id_harvest) {
    return this.api.get<any>(`${this.moduleBaseUrl}/harvests/${id_harvest}`);
  }

  addMaterial(data: any, id_harvest: number) {
    return this.api.post<any>(`${this.moduleBaseUrl}/harvests/${id_harvest}/materials`, data);
  }

  deleteMaterial(id_material: number) {
    return this.api.delete(`${this.moduleBaseUrl}/materials/${id_material}`);
  }

  getMaterialsByHarvest(id_harvest: number) {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/harvests/${id_harvest}/materials`);
  }


  getHarvestAll() {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/harvests_all/?page=1&per_page=10`);
  }


}