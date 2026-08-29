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

  getLocationTypeIds() {
    return this.api.get<{ COMMUNE_ID: number, DEPARTEMENT_ID: number }>(`${this.moduleBaseUrl}/constants/location-types`);
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

  getMaterialInfos(id_material: number) {
    return this.api.get<any>(`${this.moduleBaseUrl}/materials/${id_material}`);
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

  getFullSeedDetails(idSeed: number): Observable<any> {
    return this.api.get(`${this.moduleBaseUrl}/materials/seeds/${idSeed}/infos`);
  }

  addSeedMedia(id_seed: number, formData: FormData): Observable<any> {
    return this.api.post(`${this.moduleBaseUrl}/seeds/${id_seed}/media`, formData);
  }

  upSeedMedia(id_seed: number, formData: FormData): Observable<any> {
    return this.api.put(`${this.moduleBaseUrl}/seeds/${id_seed}/media`, formData);
  }

  deleteMedia(id_media){
    return this.api.delete(`${this.moduleBaseUrl}/seeds/medias/${id_media}`);
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


  deleteAction(idMaterial: number, idStorage: number): Observable<any> {
    return this.api.delete(`${this.moduleBaseUrl}/materials/${idMaterial}/actions/${idStorage}`);
  }

  addTest(id_material: number, testData: any): Observable<any> {
    return this.api.post<any>(`${this.moduleBaseUrl}/materials/${id_material}/tests`, testData);
  }  
  getTestsByMaterial(id_material: number): Observable<any[]> {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/materials/${id_material}/tests`);
  }
  
  
  getTestCodeParent(id_material: number): Observable<any[]> {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/materials/${id_material}/tests/code-autocomplete`);
  }
  createTest(data: any, id_material: number): Observable<any> {
    return this.api.post(`${this.moduleBaseUrl}/materials/${id_material}/tests`, data);
  }
  
  getTestById(id_test: number): Observable<any> {
    return this.api.get<any>(`${this.moduleBaseUrl}/tests/${id_test}`);
  }


  
  
  getDefaultTestType(): Observable<{ id_test_type: number }> {
    return this.api.get<{ id_test_type: number }>(
      `${this.moduleBaseUrl}/tests/default-id-test-type`
    );
  }
  getTestWithLabels(id_test: number): Observable<any> {
    return this.api.get<any>(`${this.moduleBaseUrl}/tests/${id_test}/with-labels`);
  }

  getTestByCode(code) {
    return this.api.get<any>(`${this.moduleBaseUrl}/tests/code/${code}`);
  }
  
  getActionByCode(code) {
    return this.api.get<any>(`${this.moduleBaseUrl}/actions/code/${code}`);
  }

  
  
  deleteTest(id_material: number, id_test: number): Observable<any> {
    return this.api.delete(
      `${this.moduleBaseUrl}/materials/${id_material}/tests/${id_test}`
    );
  }

  updateTest(id_material: number, id_test: number, testData: any): Observable<any> {
    return this.api.put(`${this.moduleBaseUrl}/materials/${id_material}/tests/${id_test}`, testData);
  }
  getTestWithLabelsById(id_test: number): Observable<any> {
    return this.api.get<any>(`${this.moduleBaseUrl}/tests/${id_test}/with-labels`);
  }

  createAction(data: any): Observable<any> {
    return this.api.post<any>(`${this.moduleBaseUrl}/actions`, data);
  }
   
  getActionWithLabels(id_action: number): Observable<any> {
    return this.api.get<any>(
      `${this.moduleBaseUrl}/actions/${id_action}/with-labels`
    );
  }
  
  updateAction(id_action: number, data: any): Observable<any> {
    return this.api.put<any>(`${this.moduleBaseUrl}/actions/${id_action}`, data);
  }
  
  getAction(id_action: number): Observable<any> {
    return this.api.get<any>(`${this.moduleBaseUrl}/actions/${id_action}`);
  }
  
  
  addActionByTest(id_test: number, actionData: any): Observable<any> {
    return this.api.post(`${this.moduleBaseUrl}/tests/${id_test}/actions`, actionData);
  }

  getNomenclaturesByTypeCode(codeType: string): Observable<any[]> {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/nomenclatures/${codeType}`);
  }

  addActionBySowing(id_sowing: number, actionData: any): Observable<any> {
    return this.api.post(`${this.moduleBaseUrl}/sowings/${id_sowing}/actions`, actionData);
  }
  
  getActionsByTest(id_test: number): Observable<any[]> {
    console.log('📡 Requête vers le backend avec id_test:', id_test);

    return this.api.get<any[]>(`${this.moduleBaseUrl}/tests/${id_test}/actions`);
  }
  
  getActionbyCode(id_action: number): Observable<any> {
    return this.api.get(`${this.moduleBaseUrl}/actions/code/${id_action}`);
  }
  
  deleteaction(id_action: number): Observable<any> {
    return this.api.delete(`${this.moduleBaseUrl}/actions/${id_action}`);
  }

  
  getNomenclatureDetails(id_nomenclature: number): Observable<any> {
    return this.api.get<any>(`${this.moduleBaseUrl}/actions/code/${id_nomenclature}`);
  }
  getActionReplicates(id_action: number): Observable<any[]> {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/actions/${id_action}/replicates`);
  }

  getThermoPhotoRegime(id_test: number): Observable<any> {
    return this.api.get(`${this.moduleBaseUrl}/thermo-photo/${id_test}`);
  }
  
  updateTestPreTreatment(id_test: number, pre_treatment: boolean) {
    return this.api.put(`${this.moduleBaseUrl}/tests/${id_test}/pre-treatment`, { pre_treatment });
  }
  
  getReplicateDatesByTest(id_test: number): Observable<string[]> {
    return this.api.get<string[]>(`${this.moduleBaseUrl}/tests/${id_test}/replicate-dates`);
  }
  
  getTreatmentByTest(id_test: number): Observable<{ treatment_label: string }> {
    return this.api.get<{ treatment_label: string }>(`${this.moduleBaseUrl}/tests/${id_test}/treatment`);
  }
  getActionReplicate(id_action: number): Observable<any[]> {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/actions/${id_action}/replicates`);
  }
  
  updateActionData(id_action: number, data: any): Observable<any> {
    return this.api.put(`${this.moduleBaseUrl}/actions/${id_action}/update`, data);
  }
  getGerminationPercent(id_test: number) {
    return this.api.get<{ percent: number }>(`${this.moduleBaseUrl}/test/${id_test}/germination-percent`);
  }
  
  updateTestIndicators(id_test: number, indicators: { delay: number; period: number; percent: number }) {
    return this.api.patch(`${this.moduleBaseUrl}/test/${id_test}/indicators`, indicators);
  }
  
  addSowing(idMaterial: number, actionData: any): Observable<any> {
    return this.api.post<any>(`${this.moduleBaseUrl}/materials/${idMaterial}/sowings`, actionData);
  }

  updateSowing(idMaterial: number, idSowing: number, actionData: any): Observable<any> {
    return this.api.put<any>(`${this.moduleBaseUrl}/materials/${idMaterial}/sowings/${idSowing}`, actionData);
  }

  deleteSowing(idMaterial: number, idSowing: number): Observable<any> {
    return this.api.delete<any>(`${this.moduleBaseUrl}/materials/${idMaterial}/sowings/${idSowing}`);
  }
  
  getSowingsByMaterial(idMaterial: number): Observable<any[]> {
    return this.api.get<any[]>(`${this.moduleBaseUrl}/materials/${idMaterial}/sowings`);
  }

    getActionsBySowing(idSowing: number): Observable<any[]> {
    return this.api.get<any[]>(
      `${this.moduleBaseUrl}/sowings/${idSowing}/actions`
    );
  }

  // Ajouter une culture
  addCulture(idMaterial: number, cultureData: any): Observable<any> {
    return this.api.post<any>(
      `${this.moduleBaseUrl}/materials/${idMaterial}/cultures`,
      cultureData
    );
  }

  // Récupérer les cultures associées à un matériel
  getCulturesByMaterial(idMaterial: number): Observable<any[]> {
    return this.api.get<any[]>(
      `${this.moduleBaseUrl}/materials/${idMaterial}/cultures`
    );
  }

  // Récupérer le détail d’une culture
  getCultureById(idCulture: number): Observable<any> {
    return this.api.get<any>(
      `${this.moduleBaseUrl}/cultures/${idCulture}`
    );
  }

  // Récupérer les actions d’une Culture
  getCultureActions(
    idCulture: number
  ): Observable<any[]> {

    return this.api.get<any[]>(
      `${this.moduleBaseUrl}/cultures/${idCulture}/actions`
    );
  }

  // Créer une action de transplantation pour une Culture
  createCultureTransplantation(
    idCulture: number,
    data: any
  ): Observable<any> {

    return this.api.post<any>(
      `${this.moduleBaseUrl}/cultures/${idCulture}/actions/transplantation`,
      data
    );
  }

  // Récupérer les données d’une transplantation
  getCultureTransplantation(
    idAction: number
  ): Observable<any> {

    return this.api.get<any>(
      `${this.moduleBaseUrl}/actions/${idAction}/transplantation`
    );
  }

  // Modifier une action de transplantation
  updateCultureTransplantation(
    idAction: number,
    data: any
  ): Observable<any> {

    return this.api.put<any>(
      `${this.moduleBaseUrl}/actions/${idAction}/transplantation`,
      data
    );
  }

  // Modifier une culture
  updateCulture(
    idMaterial: number,
    idCulture: number,
    cultureData: any
  ): Observable<any> {
    return this.api.put<any>(
      `${this.moduleBaseUrl}/materials/${idMaterial}/cultures/${idCulture}`,
      cultureData
    );
  }

  // Supprimer une culture
  deleteCulture(
    idMaterial: number,
    idCulture: number
  ): Observable<any> {
    return this.api.delete<any>(
      `${this.moduleBaseUrl}/materials/${idMaterial}/cultures/${idCulture}`
    );
  }  
}