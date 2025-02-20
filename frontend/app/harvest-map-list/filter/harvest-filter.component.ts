import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { HarvestStoreService } from '../../services/store.service';
import { DataService } from '../../services/data.service';

@Component({
    selector: 'ex-harvest-filter',
    templateUrl: './harvest-filter.component.html',
    styleUrls: ['./harvest-filter.component.css'],
})
export class HarvestFilterComponent implements OnInit {
    filterForm: FormGroup;
    public municipalities = [];
    public departments = []

    
    constructor(
        private formBuilder: FormBuilder,
        public storeService: HarvestStoreService,
        private api: DataService
    ){}

    ngOnInit(): void {
        this.initializeZpForm();
        this.api.getMunicipalities().subscribe((municipalities) => {
            this.municipalities = municipalities;
        });
        this.api.getDepartments().subscribe((departments) => {
            this.departments = departments;
        });
    }

    private initializeZpForm() {
        this.filterForm = this.formBuilder.group({
          cd_nom: null,
          cd_hab: null,
          date_start: null,
          date_end: null,
          observers: [],
          municipality: null,
          departement: null
        });
    }

    formatter(item) {
        return item.search_name;
    }
}
