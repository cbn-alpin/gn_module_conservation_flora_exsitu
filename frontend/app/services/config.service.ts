import { Injectable } from '@angular/core';

import { ConfigService as GnConfigService } from '@geonature/services/config.service';

@Injectable()
export class ConfigService {
    constructor(
        public config: GnConfigService,
    ){
        
    }

    getModuleConfigExsitu() {    
        return this.config.CONSERVATION_FLORA_EXSITU;
    }

    getZoom() {
        return this.config.CONSERVATION_FLORA_EXSITU.zoom;
    }

    getZoomCenter() {
        return this.config.CONSERVATION_FLORA_EXSITU.zoom_center;
    }

    getObsCode() {
        return this.config.CONSERVATION_FLORA_EXSITU.observers_list_code;
    }

    getModuleUrl() {
        return this.config.CONSERVATION_FLORA_EXSITU.MODULE_URL;
    }

    getModuleTitle() {
        return this.config.CONSERVATION_FLORA_EXSITU.module_title;
    }
    
    getModuleCode() {
        return this.config.CONSERVATION_FLORA_EXSITU.module_code;
    }
    
    getAppUrl() {
        return `${this.config.URL_APPLICATION}`;
    }
    
    getBackendUrl() {
        return `${this.config.API_ENDPOINT}`;
    }
    
    getModuleBackendUrl() {
        return `${this.config.API_ENDPOINT}/${this.config.CONSERVATION_FLORA_EXSITU.module_code.toLowerCase()}`;
    }
    
    getFrontendModuleUrl() {
        return this.config.CONSERVATION_FLORA_EXSITU.module_code.toLowerCase();
    }
    
    getTaxHubBackendUrl() {
        return `${this.config.API_TAXHUB}`;
    }
    
    getTaxHubFrontendUrl() {
        return this.getBackendUrl();
    }
    
    getPriorityFloraBackendUrl() {
        return `${this.config.API_ENDPOINT}/${this.config.CONSERVATION_FLORA_EXSITU.module_code_pf.toLowerCase()}`;
    }
}