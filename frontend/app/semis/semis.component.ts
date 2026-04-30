import { Component, OnInit, Inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SemisService } from './semis.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DataService } from '../services/data.service';
import { ConfigService } from '../services/config.service';
import { CommonService } from '@geonature_common/service/common.service';

@Component({
  selector: 'app-semis',
  templateUrl: './semis.component.html',
  styleUrls: ['./semis.component.scss']
})
export class SemisComponent implements OnInit {
  public semisForm: FormGroup;
  public formSubmitted = false;
  public shakeCodeField = false;
  public shakeStartDateField = false;
  public shakeEndDateField = false;
  public shakeDepthField = false;
  public shakeContainerField = false;
  public shakeMethodField = false;
  public shakeSubstrateField = false;
  public shakeWateringField = false;
  public shakeActorField = false;
  public shakeLocationField = false;
  public shakeInitialCountField = false;
  public shakeReplicateCountField = false;

  public observers_list_code: any;
  public idMaterial!: number;
  public idStorage: number | null = null;

  // pour le <pnx-dynamic-form-generator>
  public additionalDataForm!: FormGroup;
  public formsDefinition: any[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SemisComponent>,
    private semisService: SemisService,
    private exsituFormService: ExsituFormService,
    private dataService: DataService,
    private cfg: ConfigService,
    private toast: CommonService,
    @Inject(MAT_DIALOG_DATA) public modalData: any
  ) {
    // Form calqué sur Germination (noms adaptés Semis)
    this.semisForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^S\d{4}_\d{4}$/)]],
      start_date: ['', Validators.required],
      end_date: [''],

      id_actor: [[], Validators.required], // <pnx-observers> renvoie un tableau
      id_watering_method: [null, Validators.required],
      id_sowing_method: [null, Validators.required],
      id_substrate: [null, Validators.required], // ⚠️ id_substrate (number), pas "substrate" string

      container: ['', Validators.required],
      depth: [null, [Validators.required, Validators.min(1)]],
      id_location: [null, Validators.required],
      specification_location: [''],

      initial_count: [null, [Validators.required, Validators.min(1)]],
      replicate_count: [1, [Validators.required, Validators.min(1)]],

      remarks: [''],
      additional_data: this.fb.group({}) // contiendra program + champs dynamiques
    }, { validators: this.dateRangeValidator });
  }

  dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('start_date')?.value;
    const endDate = control.get('end_date')?.value;

    if (startDate && endDate && startDate >= endDate) {
      return { dateRangeInvalid: true };
    }

    return null;
  }

  ngOnInit(): void {
    // IDs contexte
    this.idMaterial = this.exsituFormService.idMaterial;
    this.exsituFormService.id_storage.subscribe(id => this.idStorage = id ?? null);

    // Observers
    this.observers_list_code = this.cfg.getObsCode();

    // additional_data dynamique (même principe que Germination)
    this.additionalDataForm = this.semisForm.get('additional_data') as FormGroup;
    this.formsDefinition = this.cfg.getModuleConfigExsitu()?.['harvest_form']?.['additional_data'] ?? [];
    this.formsDefinition.forEach(field => {
      const name = field.attribut_name;
      if (!this.additionalDataForm.contains(name)) {
        this.additionalDataForm.addControl(name, this.fb.control(''));
      }
    });

    // Mode édition
    if (this.modalData?.edit && this.modalData?.test) {
      this.patchForm(this.modalData.test);
    } else {
      this.semisForm.markAllAsTouched();
      this.semisForm.updateValueAndValidity();
    }
  }

  // Patch en mode édition (comme Germination)
  patchForm(data: any): void {
    this.semisForm.patchValue({
      code: data.code || '',
      start_date: data.start_date || '',
      end_date: data.end_date || '',

      id_actor: data.id_actor ? [{ id_role: data.id_actor }] : [],

      id_watering_method: data.id_watering_method ?? null,
      id_sowing_method: data.id_sowing_method ?? null,
      id_substrate: data.id_substrate ?? null,

      container: data.container || '',
      depth: data.depth ?? null,
      id_location: data.id_location ?? null,
      specification_location: data.specification_location || '',

      initial_count: data.initial_count ?? null,
      replicate_count: data.replicate_count ?? 1,

      remarks: data.remarks || ''
    });

    // Patch additional_data si présent
    if (data.additional_data && this.additionalDataForm) {
      Object.keys(data.additional_data).forEach(key => {
        if (this.additionalDataForm.contains(key)) {
          this.additionalDataForm.get(key)?.patchValue(data.additional_data[key]);
        }
      });
    }
  }

  // Mise en forme des données avant POST/PUT (comme Germination)
  private formatFormData(): any {
    const raw = this.semisForm.value;
    const payload: any = { ...raw };

    // Nettoyage additional_data : on ne garde que les champs non vides
    if (payload.additional_data) {
      const cleaned: any = {};
      Object.keys(payload.additional_data).forEach(k => {
        const v = payload.additional_data[k];
        if (v !== null && v !== undefined && v !== '') cleaned[k] = v;
      });
      if (Object.keys(cleaned).length) {
        payload.additional_data = cleaned;
      } else {
        delete payload.additional_data;
      }
    }

    // Observers → id_role
    if (Array.isArray(raw.id_actor) && raw.id_actor.length > 0) {
      payload.id_actor = raw.id_actor[0]?.id_role ?? null;
    } else {
      payload.id_actor = null;
    }

    // Contexte
    payload.id_material = this.idMaterial;
    payload.id_storage = this.idStorage;

    // Petites gardes-fous
    if (!payload.replicate_count) payload.replicate_count = 1;
    if (!payload.end_date) delete payload.end_date; // facultatif si non requis côté back

    // Correction importante : transformer id_substrate en substrate
    if (
      payload.id_substrate !== null &&
      payload.id_substrate !== undefined &&
      payload.id_substrate !== ''
    ) {
      payload.substrate = { id_nomenclature: payload.id_substrate };
    }
    delete payload.id_substrate;

    return payload;
  }

  private triggerCodeFieldShake(): void {
    this.shakeCodeField = false;

    setTimeout(() => {
      this.shakeCodeField = true;

      setTimeout(() => {
        this.shakeCodeField = false;
      }, 400);
    }, 0);
  }

  private triggerStartDateFieldShake(): void {
  this.shakeStartDateField = false;

  setTimeout(() => {
    this.shakeStartDateField = true;

    setTimeout(() => {
      this.shakeStartDateField = false;
    }, 400);
  }, 0);
}

private triggerEndDateFieldShake(): void {
  this.shakeEndDateField = false;

  setTimeout(() => {
    this.shakeEndDateField = true;

    setTimeout(() => {
      this.shakeEndDateField = false;
    }, 400);
  }, 0);
}

  private triggerDepthFieldShake(): void {
  this.shakeDepthField = false;

  setTimeout(() => {
    this.shakeDepthField = true;

    setTimeout(() => {
      this.shakeDepthField = false;
    }, 400);
  }, 0);
}

private triggerContainerFieldShake(): void {
  this.shakeContainerField = false;

  setTimeout(() => {
    this.shakeContainerField = true;

    setTimeout(() => {
      this.shakeContainerField = false;
    }, 400);
  }, 0);
}

private triggerMethodFieldShake(): void {
  this.shakeMethodField = false;

  setTimeout(() => {
    this.shakeMethodField = true;

    setTimeout(() => {
      this.shakeMethodField = false;
    }, 400);
  }, 0);
}

private triggerSubstrateFieldShake(): void {
  this.shakeSubstrateField = false;

  setTimeout(() => {
    this.shakeSubstrateField = true;

    setTimeout(() => {
      this.shakeSubstrateField = false;
    }, 400);
  }, 0);
}

private triggerWateringFieldShake(): void {
  this.shakeWateringField = false;

  setTimeout(() => {
    this.shakeWateringField = true;

    setTimeout(() => {
      this.shakeWateringField = false;
    }, 400);
  }, 0);
}

private triggerActorFieldShake(): void {
  this.shakeActorField = false;

  setTimeout(() => {
    this.shakeActorField = true;

    setTimeout(() => {
      this.shakeActorField = false;
    }, 400);
  }, 0);
}

private triggerLocationFieldShake(): void {
  this.shakeLocationField = false;

  setTimeout(() => {
    this.shakeLocationField = true;

    setTimeout(() => {
      this.shakeLocationField = false;
    }, 400);
  }, 0);
}

private triggerInitialCountFieldShake(): void {
  this.shakeInitialCountField = false;

  setTimeout(() => {
    this.shakeInitialCountField = true;

    setTimeout(() => {
      this.shakeInitialCountField = false;
    }, 400);
  }, 0);
}

private triggerReplicateCountFieldShake(): void {
  this.shakeReplicateCountField = false;

  setTimeout(() => {
    this.shakeReplicateCountField = true;

    setTimeout(() => {
      this.shakeReplicateCountField = false;
    }, 400);
  }, 0);
}

  public hasControlError(controlName: string, errorCode: string): boolean {
    return this.formSubmitted && !!this.semisForm.get(controlName)?.hasError(errorCode);
  }

  public hasDateRangeError(): boolean {
    return this.formSubmitted && !!this.semisForm.hasError('dateRangeInvalid');
  }

  public isSubmittedValid(controlName: string): boolean {
  const control = this.semisForm.get(controlName);
  return !!(this.formSubmitted && control && control.valid);
}

public isStartDateValidated(): boolean {
  return !!(
    this.formSubmitted &&
    this.semisForm.get('start_date')?.valid &&
    !this.semisForm.hasError('dateRangeInvalid')
  );
}

public isEndDateValidated(): boolean {
  return !!(
    this.formSubmitted &&
    this.semisForm.get('end_date')?.value &&
    !this.semisForm.hasError('dateRangeInvalid')
  );
}

  onSubmit(): void {
    this.formSubmitted = true;

      if (this.semisForm.invalid) {
        this.semisForm.markAllAsTouched();

      if (this.semisForm.get('code')?.invalid) {
        this.triggerCodeFieldShake();
      }

      if (this.semisForm.get('start_date')?.hasError('required')) {
        this.triggerStartDateFieldShake();
      }

      if (this.semisForm.hasError('dateRangeInvalid')) {
        this.triggerStartDateFieldShake();
        this.triggerEndDateFieldShake();
      }

      if (this.semisForm.get('depth')?.invalid) {
        this.triggerDepthFieldShake();
      }

      if (this.semisForm.get('container')?.invalid) {
        this.triggerContainerFieldShake();
      }

      if (this.semisForm.get('id_sowing_method')?.invalid) {
        this.triggerMethodFieldShake();
      }

      if (this.semisForm.get('id_substrate')?.invalid) {
        this.triggerSubstrateFieldShake();
      }

        if (this.semisForm.get('id_watering_method')?.invalid) {
          this.triggerWateringFieldShake();
        }

        if (this.semisForm.get('id_actor')?.invalid) {
          this.triggerActorFieldShake();
        }

        if (this.semisForm.get('id_location')?.invalid) {
          this.triggerLocationFieldShake();
        }

        if (this.semisForm.get('initial_count')?.invalid) {
          this.triggerInitialCountFieldShake();
        }

        if (this.semisForm.get('replicate_count')?.invalid) {
          this.triggerReplicateCountFieldShake();
        }

      return;
    }

    const finalForm = this.formatFormData();

    if (!this.idMaterial) {
      console.error('idMaterial est manquant !');
      return;
    }

    // Update vs Create (même logique que Germination)
    if (this.modalData?.edit && this.modalData?.test?.id_sowing) {
      this.semisService.updateSowing(this.idMaterial, this.modalData.test.id_sowing, finalForm).subscribe({
        next: (res) => {
          this.toast.translateToaster('success', 'Semis mis à jour avec succès');
          this.dialogRef.close(res);
        },
        error: (err) => console.error('Erreur update semis :', err)
      });
    } else {
      this.semisService.addSowing(this.idMaterial, finalForm).subscribe({
        next: (res) => {
          this.toast.translateToaster('info', 'Semis créé avec succès');
          this.dialogRef.close(res);
        },
        error: (err) => console.error('Erreur création semis :', err)
      });
    }

    
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

