import { Component, OnInit, EventEmitter, Output } from '@angular/core';

import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { HarvestStoreService } from '../../services/store.service';
import { DataService } from '../../services/data.service';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, switchMap, map, startWith, distinctUntilChanged, catchError} from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ConfigService } from '../../services/config.service';


@Component({
    selector: 'ex-harvest-filter',
    templateUrl: './harvest-filter.component.html',
    styleUrls: ['./harvest-filter.component.css'],
})
export class HarvestFilterComponent implements OnInit {
    @Output() filtersChanged = new EventEmitter<any>();
    filteredCodes$: Observable<string[]>; // Liste des suggestions
    codeMaterialControl = new FormControl();

    filterForm: FormGroup;
    public municipalities = [];
    public departments = [];
    selectedTaxons: any[] = [];
    selectedHabitats: any[] = [];
    public habref_url

    
    constructor(
        private formBuilder: FormBuilder,
        public storeService: HarvestStoreService,
        private dateParser: NgbDateParserFormatter,
        private dataService: DataService,
        public cfg: ConfigService
    ){}

    ngOnInit(): void {
        this.initializeZpForm();
        // this.filteredCodes$ = this.filterForm.controls.code_material.valueChanges.pipe(
        //     startWith(''),
        //     debounceTime(300), 
        //     distinctUntilChanged(),
        //     switchMap(value => value.length >= 3 ? this.searchCodeMaterial(value): of([]))
        //   );

        this.filterForm.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(values => {
                if (values.code_material && values.code_material.length >= 3) {
                    this.searchCodeMaterial(values.code_material).subscribe(codes => {
                        this.filteredCodes$ = of(codes); // Mise à jour de l'autocomplétion
                        this.applyFilters();
                    });
                } else {
                    this.applyFilters();
                }
            });
        this.habref_url = this.cfg.getBackendUrl() + '/habref/habitats/autocomplete'

    }

    onInputChange() {
        const value = this.filterForm.controls.code_material.value;
        this.filteredCodes$ = this.searchCodeMaterial(value);
    }

    searchCodeMaterial(value: string): Observable<string[]> {
        return this.dataService.getFilteredCodes(value).pipe(
          catchError(() => of([]))
        );
    }

    private initializeZpForm() {
        this.filterForm = this.formBuilder.group({
          cd_nom: null,
          cd_hab: null,
          date_start: null,
          date_end: null,
          observers: [],
          municipalites: [],
          departements: [],
          id_harvest_type: null,
          code_material: null
        }, { validator: this.dateRangeValidator });
    }

    dateRangeValidator(formGroup: FormGroup) {
        const dateStart = formGroup.get('date_start')?.value;
        const dateEnd = formGroup.get('date_end')?.value;
    
        if (dateStart && dateEnd && dateStart > dateEnd) {
            return { dateRangeInvalid: true };
        }
        return null;
    }

    convertToJSDate(ngbDate): Date {
        if (!ngbDate) return null;
        return new Date(ngbDate.year, ngbDate.month - 1, ngbDate.day);
    }
    
    

    formatter(item) {
        return item.search_name;
    }

    applyFilters() {
        let finalForm = this.initializeFilter()        
        this.filtersChanged.emit(finalForm); 
    }

    initializeFilter() {
        const { cd_nom, 
            cd_hab, 
            id_harvest_type, 
            date_start, 
            date_end, 
            municipalites, 
            departements, 
            observers, 
            ...rest 
        } = this.filterForm.value;        
    
        return {
            ...rest,
            cd_nom: this.selectedTaxons.length > 0 ? this.selectedTaxons.map(taxon => taxon.cd_nom) : null,
            cd_hab: this.selectedHabitats.length > 0 ? this.selectedHabitats.map(habt => habt.cd_hab) : null,
            id_harvest_type: id_harvest_type?.id_nomenclature ?? null,
            date_start: date_start ? this.dateParser.format(date_start) : null,
            date_end: date_end ? this.dateParser.format(date_end) : null,
            municipalites: municipalites ?? [],
            departements: departements ?? [],
            observers: observers?.length ? observers.map(obs => obs.id_role) : undefined
        };
    }
    
    resetFilters() {
        this.filterForm.reset();
        this.filteredCodes$ = of([]); // Vide les suggestions de code_material
        this.selectedTaxons = [];
        this.applyFilters();
    }
    
    addTaxon(event: any) {
        const selectedTaxon = event.item;
        
        // Vérifier s'il n'est pas déjà ajouté
        if (!this.selectedTaxons.find(t => t.cd_nom === selectedTaxon.cd_nom)) {
            this.selectedTaxons.push(selectedTaxon);
        }
        event.preventDefault();
        this.filterForm.controls.cd_nom.reset();
    }

    addHabitat(event: any) {
        const selectedHabtat = event.item;        
        
        if (!this.selectedHabitats.find(t => t.cd_hab === selectedHabtat.cd_hab)) {
            this.selectedHabitats.push(selectedHabtat);
        }
        event.preventDefault();
        this.filterForm.controls.cd_hab.reset();
    }
    

    removeTaxon(index: number) {
        this.selectedTaxons.splice(index, 1);
        this.applyFilters();
    }

    removeHab(index: number) {
        this.selectedHabitats.splice(index, 1);
        this.applyFilters();
    }


}
