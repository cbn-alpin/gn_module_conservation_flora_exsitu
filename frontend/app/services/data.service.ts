import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { Observable, of, } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable()
export class DataService {
  private moduleBaseUrl: string;

  constructor(
    private api: HttpClient, 
    private cfg: ConfigService,) {
    this.moduleBaseUrl = this.cfg.getModuleBackendUrl();
  }

  addHarvest(data: any) {
    return this.api.post<any>(`${this.moduleBaseUrl}/harvests`, data);
  }


  getHarvestById(id_harvest) {
    return this.api.get<any>(`${this.moduleBaseUrl}/harvests/${id_harvest}`);
  }

  getHarvestInfos(id_harvest) {
    return this.api.get<any>(`${this.moduleBaseUrl}/harvests/infos/${id_harvest}`);
  }

  deleteHarvest(id_harvest: number) {
    return this.api.delete(`${this.moduleBaseUrl}/harvests/${id_harvest}`);
  }

  updateHarvest(id_harvest: number, data: any) {
    return this.api.put(`${this.moduleBaseUrl}/harvests/${id_harvest}`, data);
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

  getHarvestGeometries(params: HttpParams){
    return this.api.get<any>(`${this.moduleBaseUrl}/harvests/geometries`, {params});
  }

  addMaterial(data: any, id_harvest: number) {
    return this.api.post<any>(`${this.moduleBaseUrl}/harvests/${id_harvest}/materials`, data);
  }

  updateMaterial(data: any, id_harvest: number, id_material: number) {
    return this.api.put<any>(`${this.moduleBaseUrl}/harvests/${id_harvest}/materials/${id_material}`, data);
  }

  getFilteredCodes(query: string): Observable<string[]> {
    return this.api.get<string[]>(`${this.moduleBaseUrl}/search_code_material?q=${query}`);
  }

  getCodesNomenclature(idNomenclature: number): Observable<string> {
    const params = new HttpParams()
      .set('id_nomenclature', idNomenclature.toString());
  
    return this.api.get<{ code_nomenclature: string }>(
      `${this.moduleBaseUrl}/codes_nomenclature`, 
      { params }
    ).pipe(
      map(response => response.code_nomenclature)
    );
  }
  

  addTaxonToMaterial(id_material: number, cd_nom: number): Observable<any> {
    return this.api.post(`${this.moduleBaseUrl}/materials/${id_material}/add-taxon`, { cd_nom });
  }

  deleteTaxonAssociation(id_material: number, cd_nom: number): Observable<any> {
    return this.api.delete(`${this.moduleBaseUrl}/materials/${id_material}/taxons/${cd_nom}`);
  }

  checkCodeMaterial(codeMaterial: string): Observable<any> {
    return this.api.get<any>(`${this.moduleBaseUrl}/check-code-material?code_material=${codeMaterial}`);
  }

  exportHarvestCsv(params?: HttpParams) {
    return this.api.get(`${this.moduleBaseUrl}/harvest/export?format=csv`, { params, responseType: 'blob' });
  }

  addSeedToMaterial(idMaterial: number, seedData: any): Observable<any> {
    return this.api.post<any>(`${this.moduleBaseUrl}/materials/${idMaterial}/seeds`, seedData);
  }

  deleteSeed(id_seed: number) {
    return this.api.delete(`${this.moduleBaseUrl}/materials/seeds/${id_seed}`);
  }  

  getSeedByMaterial(id_material: number): Observable<any> {
    return this.api.get<any>(`${this.moduleBaseUrl}/materials/${id_material}/seeds`);
  }

  updateSeed(id_seed: number, data: any) {
    return this.api.put<any>(`${this.moduleBaseUrl}/materials/seeds/${id_seed}`, data);
  }

  getMaterialsCodeParent(idHarvest: number): Observable<any[]> {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/harvests/${idHarvest}/materials/code-autocomplete`);
  }

  addAction(idMaterial: number, actionData: any): Observable<any> {
    return this.api.post<any>(`${this.moduleBaseUrl}/materials/${idMaterial}/actions`, actionData);
  }

  upAction(idMaterial: number, idAction: number, actionData: any): Observable<any> {
    return this.api.put<any>(`${this.moduleBaseUrl}/materials/${idMaterial}/actions/${idAction}`, actionData);
  }

  getActionContextStorage(idMaterial: number, placeCode: string) : Observable<any>{
    return this.api.get(`${this.moduleBaseUrl}/materials/${idMaterial}/action_context`, {params: { place_code: placeCode }});
  }
  

  getActions(idMaterial: number, params?: HttpParams): Observable<any[]> {    
    return this.api.get<any[]>(`${this.moduleBaseUrl}/materials/${idMaterial}/actions`, { params });
  }
  
  getStockSummary(id_material: number): Observable<{ quantite_initiale: number, quantite_courante: number }> {
    return this.api.get<{ quantite_initiale: number, quantite_courante: number }>(
      `${this.moduleBaseUrl}/materials/${id_material}/stock-summary`
    );
  }
  

}