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

      id_actor: [[], Validators.required],                         // <pnx-observers> renvoie un tableau
      id_watering_method: [null, Validators.required],
      id_sowing_method:   [null, Validators.required],
      id_substrate:       [null, Validators.required],           // ⚠️ id_substrate (number), pas "substrate" string

      container: ['', Validators.required],
      depth: [null, [Validators.required, Validators.min(1)]],
      id_location: [null, Validators.required],
      specification_location: [''],

      initial_count:   [null, [Validators.required, Validators.min(1)]],
      replicate_count: [1,    [Validators.required, Validators.min(1)]],

      remarks: [''],
      additional_data: this.fb.group({})      // contiendra program + champs dynamiques
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
      id_sowing_method:   data.id_sowing_method   ?? null,
      id_substrate:       data.id_substrate       ?? null,

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
      if (Object.keys(cleaned).length) payload.additional_data = cleaned;
      else delete payload.additional_data;
    }

    // Observers → id_role
    if (Array.isArray(raw.id_actor) && raw.id_actor.length > 0) {
      payload.id_actor = raw.id_actor[0]?.id_role ?? null;
    } else {
      payload.id_actor = null;
    }

    // Contexte
    payload.id_material = this.idMaterial;
    payload.id_storage  = this.idStorage;

    // Petites gardes-fous
    if (!payload.replicate_count) payload.replicate_count = 1;
    if (!payload.end_date) delete payload.end_date; // facultatif si non requis côté back

    // SLIM ERREUR : Correction importante : transformer id_substrate en substrate
    if (
      payload.id_substrate !== null &&
      payload.id_substrate !== undefined &&
      payload.id_substrate !== ''
    ) {
      payload.substrate = { id_nomenclature: payload.id_substrate };
    }
    delete payload.id_substrate;
    // END SLIM ERREUR

    return payload;
  }

  onSubmit(): void {
    if (this.semisForm.invalid) return;

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
