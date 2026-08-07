import { Component, Input, Inject, OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
    FormBuilder,
    FormGroup,
    Validators
  } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CommonService } from '@geonature_common/service/common.service';
import { ConfigService } from '../../services/config.service';
import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { ConstantsService } from '../../services/constants.service';
import { FormService } from '@geonature_common/form/form.service';
import { DataFormService } from '@geonature_common/form/data-form.service';
import { HarvestStoreService } from '../../services/store.service';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ModuleService } from '@geonature/services/module.service';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { DialogService } from '../confirm-dialog/confirm-dialog.service';



@Component({
    selector: 'cfe-action-modal',
    templateUrl: './action-modal.component.html',
    styleUrls: ['./action-modal.component.css']
})
export class ActionModalComponent implements OnInit {
    public actionForm: FormGroup;
    public edit: boolean = false;
    additionalDataForm: FormGroup;
    formsDefinition;
    public auteurs_code;
    showDestinationField: boolean = false;
    showInternalField: boolean = false;
    showExternalField: boolean = false;
    code_destock: string;
    context: any = null;
    quantiteMaxDisponible: number = 0;
    public showInitialStockWarning: boolean = false;
    public allowSubmitForGerminationMovement = false;
    public currentModulePath: string
    idMaterial: number | null = null;
    public codeMaterial: string | null = null;

    public isInitialStorage = false;

    private initialFormState: any = null;


    constructor(
        public dialogRef: MatDialogRef<ActionModalComponent>,
        private fb: FormBuilder,
        public cfg: ConfigService,
        public api: DataService,
        @Inject(MAT_DIALOG_DATA) public data: { data: any, edit?: boolean },
        private dateParser: NgbDateParserFormatter,
        private _commonService: CommonService,
        public constants: ConstantsService,
        private coreFormService: FormService,
        private _dfService: DataFormService,
        public storeService: HarvestStoreService,
        private cdr: ChangeDetectorRef,
        public router: Router,
        public moduleService: ModuleService,
        public exsituFormService: ExsituFormService,
        private dialogService: DialogService,


    ){

    }

    ngOnInit(): void {
      this.edit =
        this.data.edit || false;

      this.idMaterial =
        this.data?.data?.id_material ??
        this.exsituFormService.idMaterial;

      this.loadAssociatedMaterialCode();

      this.initForm();
        this.additionalDataForm = this.actionForm.get('additional_data') as FormGroup;
        this.listenQuantityChanges();
        this.auteurs_code = this.cfg.getObsCode()
        this.formsDefinition = this.cfg.getModuleConfigExsitu()['action_form']['additional_data'];   
        
        this.actionForm.controls['id_storage_action'].valueChanges.subscribe(value => {      
            if(value) {
                this.getCodesNomenclature(value)
            }
          });
        
        this.actionForm.controls['id_destock'].valueChanges.subscribe(id => {      
            if(id) {
                this.getDestockCode(id)
            }
        });
        this.loadContext();

        setTimeout(() => {
          this.fillForm(this.data.data);
          this.captureInitialFormState();
        });

        this.actionForm.get('id_storage_action')?.valueChanges.subscribe(() => {
          this.evaluateEnableSubmit();
        });
        
        this.actionForm.get('id_destination')?.valueChanges.subscribe(() => {
          this.evaluateEnableSubmit();
        });

        this.moduleService.currentModule$.subscribe((module) => {
          this.currentModulePath = module.module_path.toLowerCase();
        });
        
    }

    private loadAssociatedMaterialCode(): void {
      if (!this.idMaterial) {
        return;
      }

      this.api
        .getMaterialInfos(this.idMaterial)
        .subscribe({
          next: (material) => {
            this.codeMaterial =
              material?.code_material || null;
          },

          error: () => {
            this.codeMaterial = null;
          }
        });
    }

    private captureInitialFormState(): void {
      this.initialFormState =
        JSON.parse(
          JSON.stringify(
            this.actionForm.getRawValue()
          )
        );
    }


    initForm(){
        this.actionForm = this.fb.group({
            id_material: [this.data.data.id_material, Validators.required],
            code_place: [this.data.data.placeCode, Validators.required],
            date_start: [null, Validators.required],
            date_end: [null, Validators.required],
            id_actor: [[], Validators.required],
            id_storage_action: [null, Validators.required],
            quantity : null,
            id_destock: null,
            id_destination: null,
            id_humidity_level: null,
            humidity_rate: null,
            id_humidity_device: null,
            id_dry_type: null,
            destination_precision: '',
            remarks: '',
            additional_data: this.fb.group({})
        });

        this.actionForm.setValidators([
          this.coreFormService.dateValidator(
            this.actionForm.get('date_start'),
            this.actionForm.get('date_end')
          ),
        ]);

    }

    loadContext() {      
        this.api.getActionContextStorage(this.data.data.id_material, this.data.data.placeCode).subscribe((res) => {
          this.context = res;
          const placeCode = this.data.data.placeCode;
          const idPlace = this.getIdPlaceFromCode(placeCode);
          this.quantiteMaxDisponible = res.quantities[idPlace] || 0; 
          
          if (this.edit && this.data.data.quantity) {
            this.quantiteMaxDisponible += this.data.data.quantity;
          }
        });
    }

    getIdPlaceFromCode(code: string): number | null {
      const mapping: { [key: string]: number } = {
        [this.constants.PLACE_CODES.PRE_DRYING_ROOM]: this.context?.place_mapping?.sdps,
        [this.constants.PLACE_CODES.DRYING_ROOM]: this.context?.place_mapping?.sds,
        [this.constants.PLACE_CODES.COLD_ROOM]: this.context?.place_mapping?.cf,
        [this.constants.PLACE_CODES.FREEZER]: this.context?.place_mapping?.cong,
      };
      return mapping[code] || null;
    }
    

    showInitialStockageRequiredMessage() {
      this.showInitialStockWarning = true;
      this._commonService.translateToaster('warning', 'Aucune action de stockage initial détectée. Veuillez commencer par un stockage initial.')
    }
      

  listenQuantityChanges() {
    const quantityControl = this.actionForm.get('quantity');      
    const actionTypeControl = this.actionForm.get('id_storage_action');
  
    if (!quantityControl || !actionTypeControl) return;
  
    quantityControl.valueChanges.subscribe((val) => {
      const currentActionCode = this.constants.ACTION_CODES;
      const selectedActionId = actionTypeControl.value;
  
      if (!selectedActionId || !this.context) return;
  
      this.api.getCodesNomenclature(selectedActionId).subscribe((code: string) => {
        const needsQuantityCheck = [
          currentActionCode.MOVEMENT,
          currentActionCode.DESTOCKING
        ].includes(code);
  
        if (needsQuantityCheck) {
          if (val > this.quantiteMaxDisponible) {
            quantityControl.setErrors({ exceedMax: true });
          } else {
            const errors = quantityControl.errors;
            if (errors?.exceedMax) {
              delete errors.exceedMax;
              quantityControl.setErrors(Object.keys(errors).length ? errors : null);
            }
          }
        } else {
          // Si ce n’est pas une action à vérifier, on enlève l’erreur si elle existe
          const errors = quantityControl.errors;
          if (errors?.exceedMax) {
            delete errors.exceedMax;
            quantityControl.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      });
    });
  }
  
  
      

  submetData(){
    let finalForm = this.formatDataForm();     

    if(this.edit){
      this.api.upAction(this.data.data.id_material, this.data.data.id_storage, finalForm).subscribe({
        next: ()=>{
          this._commonService.translateToaster('info', 'Action modifiée avec succès');
        }, error: (err)=>{
            console.log(err);
            this._commonService.translateToaster('warning', 'Erreur lors de la modification de l\'action');
        }
      })
    }else{
      this.api.addAction(this.data.data.id_material, finalForm).subscribe(
        (response)=>{
            this._commonService.translateToaster('info', 'Action ajoutée avec succès');
        },
        (error) => {
            console.log(error);
            this._commonService.translateToaster('warning', 'Erreur lors de l\'ajout de l\'action');
        }
      )  
    }
  }

  private formatDataForm() {
    const finalForm = this.actionForm.value;        

    const additionalFields = this.formsDefinition || [];

    if (finalForm.additional_data) {
      const cleanedAdditionalData = {};
    
      additionalFields.forEach(field => {
        const key = field.attribut_name;
        const value = finalForm.additional_data[key];
        if (value !== null && value !== undefined && value !== '') {
          cleanedAdditionalData[key] = value;
        }
      });
    
      if (Object.keys(cleanedAdditionalData).length > 0) {
        finalForm.additional_data = cleanedAdditionalData;
      } else {
        delete finalForm.additional_data;
      }
    }
    finalForm.date_start = this.dateParser.format(finalForm.date_start);
    finalForm.date_end = this.dateParser.format(finalForm.date_end);

    finalForm['id_actor'] = finalForm['id_actor'][0].id_role;

    return finalForm;
  }

    
  getDestockCode(idNomenclature: number){
    this.api.getCodesNomenclature(idNomenclature).subscribe({
      next: (code)=>{                
          this.code_destock = code;
          const quantity = this.actionForm.get('quantity');
          if (quantity) {
              if (this.constants.DESTOCK_CODES.PARTIAL === code) {
                  quantity.setValidators([Validators.required]);
              } else {
                  quantity.clearValidators();
              }

              quantity.updateValueAndValidity();
              quantity.markAsTouched();
              quantity.markAsDirty();
          }    
      }
    }); 
  }
    

  getCodesNomenclature(idNomenclature: number): void {    
    this.api.getCodesNomenclature(idNomenclature).subscribe({
      next: (codeNomenclature: string) => {            
        this.showDestinationField = this.constants.DISPLAY_DESTINATION_FIELD.includes(codeNomenclature)
        this.showInternalField = codeNomenclature === this.constants.ACTION_CODES.MOVEMENT ? true : false
        this.showExternalField = codeNomenclature === this.constants.ACTION_CODES.DESTOCKING ? true : false
        this.updateValidatorsBasedOnAction(codeNomenclature)
        this.isInitialStorage = codeNomenclature === this.constants.ACTION_CODES.INITIAL_STORAGE;

        if (this.context?.has_initial_stockage === false) {
          if (this.isInitialStorage) {
            this.showInitialStockWarning = false; // autorisé
          } else {
            this.showInitialStockageRequiredMessage(); // interdit
          }
        } else {
          this.showInitialStockWarning = false;
        }

      },
      error: (error) => {
        
      }
    });
  }

  
  updateValidatorsBasedOnAction(actionCode: string): void {
    const quantity = this.actionForm.get('quantity');
    const idHumidityDevice = this.actionForm.get('id_humidity_device');
    const idHumidityLevel = this.actionForm.get('id_humidity_level');
    const humidityRate = this.actionForm.get('humidity_rate');
    const idDestock = this.actionForm.get('id_destock');
    const idDestination = this.actionForm.get('id_destination');
  
    // Réinitialiser tous les validateurs
    [quantity, idHumidityDevice, idHumidityLevel, humidityRate, idDestock, idDestination].forEach(control => {
      control?.clearValidators();
      control?.updateValueAndValidity();
    });
  
    switch (actionCode) {
      case this.constants.ACTION_CODES.INITIAL_STORAGE:
        quantity?.setValidators([Validators.required]);
        this.showInitialStockWarning = false;
        break;
  
      case this.constants.ACTION_CODES.HUMIDITY_INDICATOR_ADDED:
        idHumidityDevice?.setValidators([Validators.required]);
        break;
  
      case this.constants.ACTION_CODES.HUMIDITY_EVALUATION:
        idHumidityLevel?.setValidators([Validators.required]);
        break;
  
      case this.constants.ACTION_CODES.PRECISE_HUMIDITY_MEASUREMENT:
        humidityRate?.setValidators([Validators.required]);
        break;
  
      case this.constants.ACTION_CODES.DESTOCKING:
        idDestock?.setValidators([Validators.required]);
  
        if (this.constants.DESTOCK_CODES.PARTIAL === this.code_destock) {
          quantity?.setValidators([Validators.required]);
        }
  
        idDestination?.setValidators([Validators.required]);
        break;
  
      case this.constants.ACTION_CODES.MOVEMENT:
        quantity?.setValidators([Validators.required]);
        idDestination?.setValidators([Validators.required]);
        break;
  
      default:
        break;
    }
  
    // Appliquer les modifs
    [quantity, idHumidityDevice, idHumidityLevel, humidityRate, idDestock, idDestination].forEach(control => {
      control?.updateValueAndValidity();
    });
  }

  fillForm(actionData: any): void {
    const fieldsToIgnore = ['action_type_label', 'destination',
      'additional_data', 'actor',
      'id_actor', 'date_start', 'date_end'];
  
    Object.keys(actionData).forEach(key => {
      if (!fieldsToIgnore.includes(key) && this.actionForm.controls[key]) {
        this.actionForm.controls[key].setValue(actionData[key]);
      }
    });
  
    if (actionData.id_actor) {
      this._dfService
        .getObserversFromCode(
          this.storeService.cfeConfig.observers_list_code
        )
        .subscribe((observersList) => {
          const selectedObserver =
            observersList.find(
              observer =>
                observer.id_role ===
                actionData.id_actor
            );

          if (selectedObserver) {
            this.actionForm.controls[
              'id_actor'
            ].setValue([selectedObserver]);

            this.captureInitialFormState();
          }
        });
    } else {
      this.actionForm.controls[
        'id_actor'
      ].setValue([]);
    }
  
    if (this.additionalDataForm) {
      this.additionalDataForm.patchValue(actionData.additional_data || {});
    }

    const dateStart = actionData.date_start ? this.dateParser.parse(this.formatDate(actionData.date_start)) : null;
    const dateEnd = actionData.date_end ? this.dateParser.parse(this.formatDate(actionData.date_end)) : null;
    this.actionForm.controls['date_start'].setValue(dateStart)
    this.actionForm.controls['date_end'].setValue(dateEnd)
  }


  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }


  onReset(): void {
    if (!this.initialFormState) {
      return;
    }

    this.dialogService
      .confirmDialog({
        message: this.edit
          ? 'Êtes-vous certain de vouloir réinitialiser les modifications de cette fiche de stockage ?'
          : 'Êtes-vous certain de vouloir réinitialiser cette fiche de stockage ?'
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        this.actionForm.reset(
          JSON.parse(
            JSON.stringify(
              this.initialFormState
            )
          )
        );

        this.actionForm.markAsPristine();
        this.actionForm.markAsUntouched();
        this.actionForm.updateValueAndValidity();

        const storageActionId =
          this.actionForm.get(
            'id_storage_action'
          )?.value;

        if (storageActionId) {
          this.getCodesNomenclature(
            storageActionId
          );
        } else {
          this.showDestinationField = false;
          this.showInternalField = false;
          this.showExternalField = false;
          this.showInitialStockWarning = false;
          this.isInitialStorage = false;
        }

        this.evaluateEnableSubmit();
      });
  }


  close(): void {
    this.dialogRef.close();
  }

  evaluateEnableSubmit() {
    const idStorageAction = this.actionForm.get('id_storage_action')?.value;
    const idDestination = this.actionForm.get('id_destination')?.value;
  
    if (!idStorageAction || !idDestination) {
      this.allowSubmitForGerminationMovement = false;
      return;
    }
  
    // Récupère les codes nomenclature à partir des IDs
    this.api.getCodesNomenclature(idStorageAction).subscribe(codeAction => {
      this.api.getCodesNomenclature(idDestination).subscribe(codeDestination => {
        this.allowSubmitForGerminationMovement =
          codeAction === this.constants.ACTION_CODES.MOVEMENT &&
          (codeDestination === 'tdg' || codeDestination === 'tsv'); 
          this.cdr.detectChanges();
      });
    });
  }
  

  submetAndResetForm() {
    const finalForm = this.formatDataForm();

    const goToTargetAndOpenModal = (idDestination: number | null | undefined) => {
      if (!idDestination) return;

      this.api.getCodesNomenclature(idDestination).subscribe((destinationCode: string) => {
        const basePath = `/${this.currentModulePath}/form/harvest/${this.exsituFormService.idHarvest}/material/${this.idMaterial}`;
        let targetPath = '';
        let openFlag = '';

        if (destinationCode === 'tdg') {
          targetPath = `${basePath}/germination-table`;
          openFlag = 'tdg';
        } else if (destinationCode === 'tsv') {
          targetPath = `${basePath}/viability-table`;
          openFlag = 'tsv';
        }

        if (targetPath) {
          this.dialogRef.close(true); // ferme UNE seule fois
          setTimeout(() => {
            // ⚠️ on passe open=tdg | open=tsv
            this.router.navigateByUrl(`${targetPath}?open=${openFlag}`);
          }, 10);
        }
      });
    };

    if (this.edit) {
      this.api.upAction(this.data.data.id_material, this.data.data.id_storage, finalForm).subscribe({
        next: () => {
          this._commonService.translateToaster('info', 'Action modifiée avec succès');
          goToTargetAndOpenModal(finalForm.id_destination);
        },
        error: (err) => {
          console.error(err);
          this._commonService.translateToaster('warning', 'Erreur lors de la modification de l\'action');
        }
      });
      return;
    }

    this.api.addAction(this.data.data.id_material, finalForm).subscribe({
      next: (response) => {
        const idStorage = response?.id_storage;
        if (idStorage) {
          this.exsituFormService.idStorage = idStorage;
          this.exsituFormService.id_storage.next(idStorage);
        }
        this._commonService.translateToaster('info', 'Action ajoutée avec succès');
        goToTargetAndOpenModal(finalForm.id_destination);
      },
      error: (err) => {
        console.error(err);
        this._commonService.translateToaster('warning', 'Erreur lors de l\'ajout de l\'action');
      }
    });
  }

    
  
  
}