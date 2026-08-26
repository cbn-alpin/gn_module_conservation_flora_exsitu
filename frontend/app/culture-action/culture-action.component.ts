import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonService } from '@geonature_common/service/common.service';

import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { CultureService } from '../culture/culture.service';
import { ConfigService } from '../services/config.service';
import { DataService } from '../services/data.service';
import { FrenchDateAdapter } from '../services/french-date-adapter';

interface CultureActionDialogData {
  idCulture: number;
  codeCulture?: string | null;
}

@Component({
  selector: 'app-culture-action',
  templateUrl: './culture-action.component.html',
  styleUrls: ['./culture-action.component.scss'],
  providers: [{ provide: DateAdapter, useClass: FrenchDateAdapter }]
})
export class CultureActionComponent implements OnInit {
  public cultureActionForm: FormGroup;
  public observersListCode: any;
  public cultureActionTypeOptions: any[] = [];

  public transplantationTypeOptions: any[] = [];
  public physiologicalStageOptions: any[] = [];
  public mainLocationOptions: any[] = [];
  public isSubmitting = false;
  public formSubmitted = false;

  private cancelDialogOpen = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CultureActionComponent>,
    private cultureService: CultureService,
    private dataService: DataService,
    private cfg: ConfigService,
    private dialogService: DialogService,
    private toast: CommonService,
    @Inject(MAT_DIALOG_DATA) public dialogData: CultureActionDialogData
  ) {
    this.cultureActionForm = this.fb.group(
      {
        id_action_type: [
          null,
          Validators.required
        ],

        date_start: [
          null,
          Validators.required
        ],

        date_end: [null],
        id_actor: [[]],
        id_type: [null],
        intervention_quantity: [null, Validators.min(1)],
        in_progress_quantity: [null, Validators.min(0)],
        packaging: ['', Validators.maxLength(100)],
        substrat: this.fb.array([]),
        id_physiological_development_stage: [null],
        id_main_location: [null],
        precise_location: ['', Validators.maxLength(100)],
        remarks: ['']
      },
      { validators: [this.dateRangeValidator] }
    );
  }

  ngOnInit(): void {
    this.dialogRef.disableClose = true;
    this.observersListCode = this.cfg.getObsCode();
    this.loadNomenclatures();

    this.cultureActionForm.get('id_type')?.valueChanges.subscribe(() => {
      if (!this.showPackagingField) {
        this.cultureActionForm.get('packaging')?.setValue('', { emitEvent: false });
      }
    });

    this.dialogRef.backdropClick().subscribe(() => this.onCancel());
    this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.onCancel();
      }
    });
  }

  get substrates(): FormArray {
    return this.cultureActionForm.get('substrat') as FormArray;
  }

  get showTransplantationForm(): boolean {

    const selectedId =
      Number(
        this.cultureActionForm
          .get('id_action_type')
          ?.value
      );


    const selectedActionType =
      this.cultureActionTypeOptions.find(
        option =>
          Number(
            option?.id_nomenclature
          ) === selectedId
      );


    return (
      String(
        selectedActionType
          ?.cd_nomenclature ||
        ''
      )
        .trim()
        .toLowerCase() ===
      'transp'
    );
  }

  get showPackagingField(): boolean {
    const selectedId = Number(this.cultureActionForm.get('id_type')?.value);
    const selected = this.transplantationTypeOptions.find(
      option => Number(option?.id_nomenclature) === selectedId
    );
    const code = String(selected?.cd_nomenclature || '').trim().toLowerCase();
    return code === 'repiq' || code === 'remp';
  }

  get substratePercentageTotal(): number {
    return this.substrates.controls.reduce((total, control) => {
      const value = Number(control.get('percentage')?.value);
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  addSubstrate(): void {
    this.substrates.push(
      this.fb.group({
        type: [''],
        category: [null],
        percentage: [null, [Validators.min(0), Validators.max(100)]]
      })
    );
    this.cultureActionForm.markAsDirty();
  }

  removeSubstrate(index: number): void {
    this.substrates.removeAt(index);
    this.cultureActionForm.markAsDirty();
  }

  onReset(): void {
    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'local_florist',
        variant: 'culture-reset',
        entityLabel:
          'cette action de culture',
        disableClose: false
      })
      .subscribe(yes => {

        if (!yes) {
          return;
        }


        this.substrates.clear();


        this.cultureActionForm.reset({
          id_action_type: null,
          date_start: null,
          date_end: null,
          id_actor: [],
          id_type: null,
          intervention_quantity: null,
          in_progress_quantity: null,
          packaging: '',
          id_physiological_development_stage: null,
          id_main_location: null,
          precise_location: '',
          remarks: ''
        });


        this.formSubmitted =
          false;


        this.cultureActionForm
          .markAsPristine();

        this.cultureActionForm
          .markAsUntouched();

      });
  }


  private toBoldItalicText(
    value: string
  ): string {

    const boldItalicChars:
      Record<string, string> = {

      A: '𝑨', B: '𝑩', C: '𝑪',
      D: '𝑫', E: '𝑬', F: '𝑭',
      G: '𝑮', H: '𝑯', I: '𝑰',
      J: '𝑱', K: '𝑲', L: '𝑳',
      M: '𝑴', N: '𝑵', O: '𝑶',
      P: '𝑷', Q: '𝑸', R: '𝑹',
      S: '𝑺', T: '𝑻', U: '𝑼',
      V: '𝑽', W: '𝑾', X: '𝑿',
      Y: '𝒀', Z: '𝒁',

      a: '𝒂', b: '𝒃', c: '𝒄',
      d: '𝒅', e: '𝒆', f: '𝒇',
      g: '𝒈', h: '𝒉', i: '𝒊',
      j: '𝒋', k: '𝒌', l: '𝒍',
      m: '𝒎', n: '𝒏', o: '𝒐',
      p: '𝒑', q: '𝒒', r: '𝒓',
      s: '𝒔', t: '𝒕', u: '𝒖',
      v: '𝒗', w: '𝒘', x: '𝒙',
      y: '𝒚', z: '𝒛',

      0: '𝟎', 1: '𝟏', 2: '𝟐',
      3: '𝟑', 4: '𝟒', 5: '𝟓',
      6: '𝟔', 7: '𝟕', 8: '𝟖',
      9: '𝟗'
    };


    return value.replace(
      /[A-Za-z0-9]/g,
      char =>
        boldItalicChars[char] ||
        char
    );
  }


  private formatDateForToaster(
    value: any
  ): string {

    const formattedDate =
      this.formatDateForApi(
        value
      );


    if (!formattedDate) {
      return '-';
    }


    const [
      year,
      month,
      day
    ] =
      formattedDate.split('-');


    return `${day}/${month}/${year}`;
  }


  private showCultureActionSuccessToaster(): void {

    const selectedActionTypeId =
      Number(
        this.cultureActionForm
          .get('id_action_type')
          ?.value
      );


    const selectedActionType =
      this.cultureActionTypeOptions
        .find(
          option =>
            Number(
              option?.id_nomenclature
            ) ===
            selectedActionTypeId
        );


    const actionTypeLabel =
      selectedActionType
        ? this.getOptionLabel(
            selectedActionType
          )
        : '';


    const actionLabel =
      [
        this.dialogData?.codeCulture || '',
        actionTypeLabel
      ]
        .filter(Boolean)
        .join(' - ');


    const dateStart =
      this.formatDateForToaster(
        this.cultureActionForm
          .get('date_start')
          ?.value
      );


    this.toast
      .translateToaster(
        'success',
        `Action ${
          this.toBoldItalicText(
            actionLabel
          )
        } créée avec succès.\nDate de début : ${
          this.toBoldItalicText(
            dateStart
          )
        }`
      );
  }


  onSubmit(): void {
    this.formSubmitted = true;


    if (
      !this.dialogData?.idCulture ||
      this.cultureActionForm.invalid ||
      this.isSubmitting
    ) {

      this.cultureActionForm
        .markAllAsTouched();

      return;
    }


    const selectedActionTypeId =
      Number(
        this.cultureActionForm
          .get('id_action_type')
          ?.value
      );


    const selectedActionType =
      this.cultureActionTypeOptions
        .find(
          option =>
            Number(
              option?.id_nomenclature
            ) ===
            selectedActionTypeId
        );


    const actionTypeLabel =
      selectedActionType
        ? this.getOptionLabel(
            selectedActionType
          )
        : '';


    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'local_florist',
        variant: 'culture-save',

        entityLabel:
          'l’action de culture',

        entityCode:
          actionTypeLabel ||
          undefined,

        disableClose: false
      })
      .subscribe(yes => {

        if (!yes) {
          return;
        }


        this.isSubmitting =
          true;


        this.cultureService
          .createCultureTransplantation(
            this.dialogData.idCulture,
            this.buildPayload()
          )
          .subscribe({

            next: result => {

              this.showCultureActionSuccessToaster();


              this.dialogRef.close(
                result
              );

            },

            error: error => {

              this.isSubmitting =
                false;


              console.error(
                'Erreur lors de la création de la transplantation :',
                error
              );


              this.toast
                .translateToaster(
                  'error',
                  'Impossible de créer l’action de transplantation.'
                );

            }

          });

      });
  }


  addNewAction(): void {
    this.formSubmitted = true;


    if (
      !this.dialogData?.idCulture ||
      this.cultureActionForm.invalid ||
      this.isSubmitting
    ) {

      this.cultureActionForm
        .markAllAsTouched();

      return;
    }


    this.isSubmitting = true;


    this.cultureService
      .createCultureTransplantation(
        this.dialogData.idCulture,
        this.buildPayload()
      )
      .subscribe({

        next: () => {

          this.showCultureActionSuccessToaster();


          this.substrates.clear();


          this.cultureActionForm.reset({
            id_action_type: null,
            date_start: null,
            date_end: null,
            id_actor: [],
            id_type: null,
            intervention_quantity: null,
            in_progress_quantity: null,
            packaging: '',
            id_physiological_development_stage: null,
            id_main_location: null,
            precise_location: '',
            remarks: ''
          });


          this.formSubmitted = false;
          this.isSubmitting = false;


          this.cultureActionForm
            .markAsPristine();

          this.cultureActionForm
            .markAsUntouched();

        },

        error: error => {

          this.isSubmitting = false;


          console.error(
            'Erreur lors de la création de la transplantation :',
            error
          );


          this.toast
            .translateToaster(
              'error',
              'Impossible de créer l’action de transplantation.'
            );

        }

      });
  }


  private getCultureActionCancelLabel(): string {

    const selectedActionTypeId =
      Number(
        this.cultureActionForm
          .get('id_action_type')
          ?.value
      );


    const selectedActionType =
      this.cultureActionTypeOptions
        .find(
          option =>
            Number(
              option?.id_nomenclature
            ) ===
            selectedActionTypeId
        );


    const actionTypeLabel =
      selectedActionType
        ? this.getOptionLabel(
            selectedActionType
          )
        : '';


    if (!actionTypeLabel) {
      return '';
    }


    return [
      this.dialogData?.codeCulture || '',
      actionTypeLabel
    ]
      .filter(Boolean)
      .join(' - ');
  }


  private showCultureActionCancelToaster(): void {

    const actionLabel =
      this.getCultureActionCancelLabel();


    const dateStart =
      this.formatDateForToaster(
        this.cultureActionForm
          .get('date_start')
          ?.value
      );


    const hasDateStart =
      dateStart !== '-';


    const dateLine =
      hasDateStart
        ? `\nDate de début : ${
            this.toBoldItalicText(
              dateStart
            )
          }`
        : '';


    if (actionLabel) {

      this.toast.translateToaster(
        'info',
        `Action ${
          this.toBoldItalicText(
            actionLabel
          )
        } non créée${dateLine}`
      );


      return;
    }


    this.toast.translateToaster(
      'info',
      `Création de l’action annulée${dateLine}`
    );
  }


  onCancel(): void {
    if (
      this.cancelDialogOpen ||
      this.isSubmitting
    ) {
      return;
    }


    this.cancelDialogOpen = true;


    const selectedActionTypeId =
      Number(
        this.cultureActionForm
          .get('id_action_type')
          ?.value
      );


    const selectedActionType =
      this.cultureActionTypeOptions
        .find(
          option =>
            Number(
              option?.id_nomenclature
            ) ===
            selectedActionTypeId
        );


    const actionTypeLabel =
      selectedActionType
        ? this.getOptionLabel(
            selectedActionType
          )
        : '';


    const dateStart =
      this.cultureActionForm
        .get('date_start')
        ?.value;


    this.dialogService
      .confirmDialog({
        message: '',
        icon: 'local_florist',
        variant: 'culture-exit',

        actionCancellation: true,
        actionCancellationMode: 'create',

        actionContextLabel:
          'de culture',

        entityLabel:
          actionTypeLabel ||
          undefined,

        entityDate:
          dateStart ||
          undefined,

        disableClose: false
      })
      .subscribe({

        next: yes => {

          this.cancelDialogOpen = false;


          if (!yes) {
            return;
          }


          this.showCultureActionCancelToaster();


          this.dialogRef.close();

        },

        error: () => {
          this.cancelDialogOpen = false;
        }

      });
  }

  getOptionLabel(option: any): string {
    return (
      option?.label_fr ||
      option?.label_default ||
      option?.mnemonique ||
      '-'
    );
  }

  private loadNomenclatures(): void {
    this.loadNomenclature(
      'CFE_ACTION_TYPE',

      options => {

        /*
        * Pour le moment, Transplantation
        * est la seule action de Culture
        * disponible.
        */
        this.cultureActionTypeOptions =
          options.filter(
            option =>
              String(
                option?.cd_nomenclature ||
                ''
              )
                .trim()
                .toLowerCase() ===
              'transp'
          );
      },

      'types d’action de Culture'
    );
    this.loadNomenclature(
      'CFE_TRANSPLANTATION_TYPE',
      options => (this.transplantationTypeOptions = options),
      'types de transplantation'
    );
    this.loadNomenclature(
      'CFE_PHYSIOLOGICAL_STAGE',
      options => (this.physiologicalStageOptions = options),
      'stades physiologiques'
    );
    this.loadNomenclature(
      'CFE_MAIN_LOCATION',
      options => (this.mainLocationOptions = options),
      'localisations principales'
    );
  }

  private loadNomenclature(
    typeCode: string,
    assign: (options: any[]) => void,
    errorLabel: string
  ): void {
    this.dataService.getNomenclaturesByTypeCode(typeCode).subscribe({
      next: options => assign(this.sortNomenclatures(options)),
      error: error => {
        console.error(`Erreur lors du chargement des ${errorLabel} :`, error);
        assign([]);
      }
    });
  }

  private sortNomenclatures(options: any[] | null | undefined): any[] {
    return [...(options || [])].sort((a, b) => {
      const hierarchyA = String(a?.hierarchy || '');
      const hierarchyB = String(b?.hierarchy || '');
      if (hierarchyA !== hierarchyB) return hierarchyA.localeCompare(hierarchyB, 'fr');
      return this.getOptionLabel(a).localeCompare(this.getOptionLabel(b), 'fr');
    });
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startValue = control.get('date_start')?.value;
    const endValue = control.get('date_end')?.value;
    if (!startValue || !endValue) return null;

    const start = new Date(startValue);
    const end = new Date(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

    return end < start ? { dateEndBeforeStart: true } : null;
  }

  private buildPayload(): any {
    const raw = this.cultureActionForm.getRawValue();
    const observer = Array.isArray(raw.id_actor) ? raw.id_actor[0] : raw.id_actor;

    const substrat = (raw.substrat || [])
      .map((item: any) => ({
        type: this.cleanText(item?.type),
        category: item?.category || null,
        percentage: this.parseOptionalNumber(item?.percentage)
      }))
      .filter(
        (item: any) => !!item.type || !!item.category || item.percentage !== null
      );

    return {
      action: {
        date_start: this.formatDateForApi(raw.date_start),
        date_end: this.formatDateForApi(raw.date_end),
        id_actor: observer?.id_role ?? null
      },
      transplantation: {
        id_type: raw.id_type ?? null,
        intervention_quantity: this.parseOptionalNumber(raw.intervention_quantity),
        in_progress_quantity: this.parseOptionalNumber(raw.in_progress_quantity),
        packaging: this.cleanText(raw.packaging),
        substrat: substrat.length ? substrat : null,
        id_physiological_development_stage:
          raw.id_physiological_development_stage ?? null,
        id_main_location: raw.id_main_location ?? null,
        precise_location: this.cleanText(raw.precise_location),
        remarks: this.cleanText(raw.remarks)
      }
    };
  }

  private formatDateForApi(value: any): string | null {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseOptionalNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private cleanText(value: any): string | null {
    const text = String(value ?? '').trim();
    return text || null;
  }
}