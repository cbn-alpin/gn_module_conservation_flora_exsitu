import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { ConfigService } from '@geonature/services/config.service';
import { Observable, of } from 'rxjs';


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

  // getAllHarvest() {
  //   return this.api.get<any>(`${this.moduleBaseUrl}/harvests`);
  // }

  getHarvestById(id_harvest) {
    return this.api.get<any>(`${this.moduleBaseUrl}/harvests/${id_harvest}`);
  }

  addMaterial(data: any, id_harvest: number) {
    return this.api.post<any>(`${this.moduleBaseUrl}/harvests/${id_harvest}/materials`, data);
  }

  deleteMaterial(id_material: number) {
    return this.api.delete(`${this.moduleBaseUrl}/materials/${id_material}`);
  }

  getMaterialsByHarvest(id_harvest: number, params: HttpParams) {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/harvests/${id_harvest}/materials`, { params });
  }


  getHarvestAll(params: HttpParams) {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/harvests`, { params });
  }

  getFilteredCodes(query: string): Observable<string[]> {
    return this.api.get<string[]>(`${this.moduleBaseUrl}/search_code_material?q=${query}`);
  }

  getCodesNomenclature(idNomenclature): Observable<string[]> {
    const params = new HttpParams()
    .set('id_nomenclature', idNomenclature.toString())
    return this.api.get<string[]>(`${this.moduleBaseUrl}/codes_nomenclature`, {params});
  }

  addTaxonToMaterial(id_material: number, cd_nom: number): Observable<any> {
    return this.api.post(`${this.moduleBaseUrl}/materials/${id_material}/add-taxon`, { cd_nom });
  }

  checkCodeMaterial(codeMaterial: string): Observable<any> {
    return this.api.get<any>(`${this.moduleBaseUrl}/check-code-material?code_material=${codeMaterial}`);
  }

  getHarvestGeometries(params: HttpParams){
    return this.api.get<any>(`${this.moduleBaseUrl}/harvests/geometries`, {params});
  }

}