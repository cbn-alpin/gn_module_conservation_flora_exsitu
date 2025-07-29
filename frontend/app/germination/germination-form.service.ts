import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { DataService } from '../services/data.service';
import { CommonService } from '@geonature_common/service/common.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../services/config.service';

@Injectable()
export class GerminationFormService {
  public germinationForm: FormGroup;
  public test$: BehaviorSubject<any> = new BehaviorSubject(null);
  private moduleBaseUrl: string;


  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private commonService: CommonService,
    private exsituFormService: ExsituFormService,
    private api: HttpClient,
    private cfg: ConfigService
    
  ) {
    this.initForm();
    this.subscribeToTest();
    this.moduleBaseUrl = this.cfg.getModuleBackendUrl();

  }

  private initForm(): void {
    this.germinationForm = this.fb.group({
      code: [''],
      id_test_parent: [null],
      id_material: [null],         
      id_actor: [null],
      id_test_type: [null],
      id_storage: [null],
      seed_initial_count: [null],
      replicate_count: [1],
      id_substrate: [null],
      id_support: [null],
      remarks: [''],
      additional_data: this.fb.group({})

    });
    
  }

  private subscribeToTest(): void {
    this.test$.subscribe(test => {
      if (!test) return;
      this.germinationForm.patchValue({
        code: test.code || '',
        idTestParent: test.id_test_parent || null,
        idMaterial: test.id_material,
        idActor: test.id_actor,
        id_test_type: test.id_test_type,
        idStorage: test.id_storage,
        seedInitialCount: test.seed_initial_count,
        replicateCount: test.replicate_count,
        id_support: test.id_support,
        id_substrate: test.id_substrate,
        program: test.additional_data?.program || '',
        remarks: test.remarks || ''
      });
    });
  }

  reset(): void {
    this.germinationForm.reset();
    (this.germinationForm.get('replicats') as FormArray).clear();
    this.test$.next(null);
  }

  submitTest(): Observable<any> {
    const data = this.formatFormData();
    const idMaterial = data.id_material;
    const currentTest = this.test$.getValue();
  
    if (currentTest && currentTest.id_test) {
      return this.dataService.updateTest(idMaterial, currentTest.id_test, data);
    } else {
      return this.dataService.addTest(idMaterial, data);
    }
  }
  

  private formatFormData(): any {
    const raw = this.germinationForm.value;
    const data = { ...raw };

    data.additional_data = {
      program: raw.program || ''
    };

    if (data.replicats?.length === 0) {
      delete data.replicats;
    }

    return data;
  }

 
} 
