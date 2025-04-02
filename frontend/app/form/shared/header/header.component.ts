
import { Component, OnInit } from '@angular/core';
import { ExsituFormService } from '../exsitu-form.service';
import { DataService } from '../../../services/data.service';


@Component({
  selector: 'cs-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
    harvest: any;

    constructor(
        public exsituFormService: ExsituFormService,
        public api: DataService
    ){

    }
    ngOnInit(): void {
      this.loadHarvest(this.exsituFormService.idHarvest)
    }

    loadHarvest(id_harvest){
      this.api.getHarvestInfos(id_harvest).subscribe((harvest) => {
        this.harvest = harvest
      });
    }
}