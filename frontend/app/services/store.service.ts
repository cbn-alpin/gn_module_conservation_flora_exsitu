import { Injectable } from '@angular/core';
import { ConfigService } from './config.service';

@Injectable()
export class HarvestStoreService {
  public cfeConfig: any = {};
  constructor(
    public config: ConfigService
  ) {
    this.cfeConfig = this.config.getModuleConfigExsitu()
    
  }

}
