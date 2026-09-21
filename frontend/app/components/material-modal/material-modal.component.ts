import {
  Component,
  Inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { DataService } from '../../services/data.service';
import { MaterialFormService } from '../../material/material-form/material-form.service';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { ConstantsService } from '../../services/constants.service';
import { ConfigService } from '../../services/config.service';
import { Observable, Subscription } from 'rxjs';
import { map, startWith, switchMap, debounceTime } from 'rxjs/operators';
import { DialogService } from '../confirm-dialog/confirm-dialog.service';
import { CommonService } from '@geonature_common/service/common.service';
import { TutoService } from '../../tuto/tuto.service';


@Component({
    selector: 'app-material-modal',
    templateUrl: './material-modal.component.html',
    styleUrls: ['./material-modal.component.css']
})
export class MaterialModalComponent
  implements OnInit, OnDestroy {
    materialForm: FormGroup;
    codeMaterialExists: boolean = false;
    allowMultipleTaxons: boolean = false;
    additionalDataForm: FormGroup;
    formsDefinition;
    codeMaterialControl = new FormControl();
    filteredMaterials$: Observable<string[]>;

    private initialFormState: any = null;
    private initialParentCode: string = '';
    private cancelDialogOpen = false;
    private hasSeedDescription = false;

    private tutorialStatusSubscription:
      Subscription | null =
        null;

    private tutorialCodeCheckDone =
      false;


    private tutorialSeedMaterialTypeId:
      number | null =
        null;


    constructor(
        public dialogRef: MatDialogRef<MaterialModalComponent>,
        public exsituFormService: ExsituFormService,
        public api: DataService,
        public materialFormService: MaterialFormService,
        private constants: ConstantsService,
        public cfg: ConfigService,
        private dialogService: DialogService,
        private _commonService: CommonService,
        private tutoService: TutoService,
        @Inject(MAT_DIALOG_DATA) public dialogData: any
    ){

    }

    ngOnInit(): void {
        this.initializeMaterialForm();

        const currentOccurrence =
          this.materialFormService
            .occurrence
            .getValue();

        this.hasSeedDescription =
          !!currentOccurrence?.has_seed_description;


        if (
          !currentOccurrence?.id_material &&
          this.dialogData?.idCulture &&
          this.dialogData?.codeCulturalBank
        ) {
          this.materialForm
            .get('code_cultural_bank')
            ?.setValue(
              this.dialogData.codeCulturalBank,
              {
                emitEvent: false
              }
            );
        }


        if (currentOccurrence?.id_material) {
          this.api
            .getMaterialInfos(
              currentOccurrence.id_material
            )
            .subscribe({
              next: (material) => {
                this.hasSeedDescription =
                  !!material?.has_seed_description;
              },

              error: () => {
                this.hasSeedDescription =
                  !!currentOccurrence?.has_seed_description;
              }
            });
        }

        this.filteredMaterials$ = this.codeMaterialControl.valueChanges.pipe(
              startWith(''),
              debounceTime(300),
              switchMap(value => this.api.getMaterialsCodeParent(this.exsituFormService.idHarvest).pipe(
                map(materials => materials.filter(material =>
                  material.code_material.toLowerCase().includes(value.toLowerCase())
                ))
              ))
        ); 

        this.additionalDataForm = this.materialForm.get('additional_data') as FormGroup;
        this.formsDefinition = this.cfg.getModuleConfigExsitu()['material_form']['additional_data']; 
        this.materialForm.get('code_material')?.valueChanges.subscribe(value => {
            if (this.exsituFormService.mode === 'add' || (this.materialFormService.code_material !== null && value !== this.materialFormService.code_material)) {
                this.checkCodeMaterial(value);        
            } else {
                this.codeMaterialExists = false;
            }
        });
        this.materialForm.controls['id_material_type'].valueChanges.subscribe(value => {

            const currentOccurrence =
              this.materialFormService
                .occurrence
                .getValue();


            const initialMaterialType =
              Number(
                currentOccurrence?.id_material_type || 0
              );


            const selectedMaterialType =
              Number(
                value || 0
              );


            if (
              this.hasSeedDescription &&
              initialMaterialType > 0 &&
              selectedMaterialType > 0 &&
              initialMaterialType !== selectedMaterialType
            ) {

              this._commonService.translateToaster(
                'warning',
                'Modification impossible : ce matériel récolté possède une fiche Semence. Supprimez d\'abord la fiche Semence avant de modifier le type de matériel récolté.'
              );


              this.materialForm
                .controls['id_material_type']
                .setValue(
                  initialMaterialType,
                  {
                    emitEvent: false
                  }
                );


              return;
            }


            if(value) {
              this.api.getCodesNomenclature(value).subscribe({
                next: (code: string) => {
                  this.allowMultipleTaxons = this.constants.MULTIPLE_TAXON_CODES.includes(code);

                  if (
                    !this.allowMultipleTaxons &&
                    this.materialFormService.taxons.length > 1
                  ) {
                    this.materialFormService.taxons.clear();
                  }
                },
                error: (error) => {
                  console.log(error);
                }
              });
            }
        });


        this.initialFormState =
          JSON.parse(
            JSON.stringify(
              this.materialForm.getRawValue()
            )
          );

        this.initialParentCode =
          this.codeMaterialControl.value ||
          this.initialFormState?.code_parent ||
          '';

        this.codeMaterialControl.setValue(
          this.initialParentCode,
          {
            emitEvent: false
          }
        );


        this.initializeMaterialTutorial();


        this.dialogRef.backdropClick().subscribe(() => {
          this.onCancel();
        });

        this.dialogRef.keydownEvents().subscribe((event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            this.onCancel();
          }
        });
    }

    private initializeMaterialForm() {
        this.materialForm = this.materialFormService.form
    }


    private initializeMaterialTutorial(): void {

      if (
        this.tutoService
          .isMaterialStep(11)
      ) {

        this.initializeMaterialTutorialEdit();

        return;
      }


      if (
        !this.tutoService
          .isMaterialStep(2)
      ) {
        return;
      }


      this.tutorialCodeCheckDone =
        false;


      this.materialForm
        .get('code_material')
        ?.setValue(
          'test'
        );


      this.api
        .getNomenclaturesByTypeCode(
          'CFE_HARVEST_MATERIAL'
        )
        .subscribe({

          next: (
            nomenclatures:
              any[]
          ) => {

            const wholePlant =
              nomenclatures.find(
                nomenclature =>
                  nomenclature
                    ?.cd_nomenclature ===
                  this.constants
                    .HARVEST_MATERIAL_CODES
                    .WHOLE_PLANT
              );


            if (wholePlant) {

              this.materialForm
                .get('id_material_type')
                ?.setValue(
                  wholePlant.id_nomenclature
                );

            }


            this.updateMaterialTutorialValidity();

          },

          error: (
            error
          ) => {

            console.error(
              'Impossible de préremplir le type Plante entière pour le tutoriel :',
              error
            );


            this.tutoService
              .setCanContinue(
                false
              );

          }

        });


      this.tutorialStatusSubscription =
        this.materialForm
          .statusChanges
          .subscribe(
            () => {

              this.updateMaterialTutorialValidity();

            }
          );


      this.updateMaterialTutorialValidity();

    }


    private initializeMaterialTutorialEdit(): void {

      this.api
        .getNomenclaturesByTypeCode(
          'CFE_HARVEST_MATERIAL'
        )
        .subscribe({

          next: (
            nomenclatures:
              any[]
          ) => {

            const seed =
              nomenclatures.find(
                nomenclature =>
                  nomenclature
                    ?.cd_nomenclature ===
                  this.constants
                    .HARVEST_MATERIAL_CODES
                    .SEED
              );


            if (seed) {

              this.tutorialSeedMaterialTypeId =
                Number(
                  seed.id_nomenclature
                );


              this.materialForm
                .get('id_material_type')
                ?.setValue(
                  seed.id_nomenclature
                );

            }


            /*
             * Si le matériel possède déjà un taxon,
             * on le réaffiche aussi directement
             * dans le champ de recherche.
             */
            const existingTaxon =
              this.materialFormService
                .taxons
                .at(0)
                ?.get(
                  'parentFormControl'
                )
                ?.value;


            if (existingTaxon?.cd_nom) {

              const visibleTaxon = {
                ...existingTaxon,

                search_name:
                  existingTaxon.search_name ||
                  existingTaxon.nom_valide
              };


              this.materialForm
                .get('taxonInput')
                ?.setValue(
                  visibleTaxon,
                  {
                    emitEvent: false
                  }
                );


              return;
            }


            /*
             * Le BehaviorSubject materials$ peut être
             * incomplet ou ne plus être à jour.
             *
             * On recharge donc directement tous les
             * matériels de la récolte depuis l'API
             * et on récupère le premier vrai taxon.
             */
            const params =
              this.exsituFormService
                .params
                .set(
                  'page',
                  1
                )
                .set(
                  'limit',
                  1000
                );


            this.api
              .getMaterialsByHarvest(
                this.exsituFormService
                  .idHarvest,
                params
              )
              .subscribe({

                next: (
                  response:
                    any
                ) => {

                  const materials =
                    response?.materials ||
                    [];


                  let tutorialTaxon:
                    any =
                      null;


                  for (
                    const material
                    of materials
                  ) {

                    const taxons =
                      material?.taxons ||
                      [];


                    tutorialTaxon =
                      taxons.find(
                        (
                          taxon:
                            any
                        ) =>
                          !!taxon?.cd_nom
                      );


                    if (tutorialTaxon) {
                      break;
                    }

                  }


                  if (!tutorialTaxon) {

                    console.warn(
                      'Tutoriel : aucun taxon existant trouvé dans cette récolte.'
                    );

                    return;
                  }


                  /*
                   * Le composant pnx-taxonomy affiche
                   * search_name.
                   *
                   * Les données matériaux fournissent
                   * principalement nom_valide :
                   * on réutilise donc ce vrai nom pour
                   * l'affichage, sans inventer de taxon.
                   */
                  const visibleTaxon = {
                    ...tutorialTaxon,

                    search_name:
                      tutorialTaxon.search_name ||
                      tutorialTaxon.nom_valide
                  };


                  this.materialFormService
                    .addTaxon(
                      visibleTaxon,
                      false
                    );


                  /*
                   * addTaxon() remet normalement
                   * taxonInput à null.
                   *
                   * On réinjecte le même vrai taxon
                   * pour qu'il soit également visible
                   * dans le champ Taxon du tutoriel.
                   */
                  this.materialForm
                    .get('taxonInput')
                    ?.setValue(
                      visibleTaxon,
                      {
                        emitEvent: false
                      }
                    );

                },

                error: (
                  error
                ) => {

                  console.error(
                    'Impossible de préremplir le taxon du tutoriel :',
                    error
                  );

                }

              });

          },

          error: (
            error
          ) => {

            console.error(
              'Impossible de préremplir le type Graine pour le tutoriel :',
              error
            );

          }

        });
    }


    isTutorialEditReady(): boolean {

      if (
        !this.tutoService
          .isMaterialStep(11)
      ) {
        return true;
      }


      const selectedMaterialType =
        Number(
          this.materialForm
            .get('id_material_type')
            ?.value ||
          0
        );


      return (
        !!this.tutorialSeedMaterialTypeId &&
        selectedMaterialType ===
          this.tutorialSeedMaterialTypeId &&
        this.materialFormService
          .taxons
          .length > 0
      );
    }


    private updateMaterialTutorialValidity(): void {

      if (
        !this.tutoService
          .isMaterialStep(2)
      ) {
        return;
      }


      const requiredFieldsReady =
        !!this.materialForm
          .get('code_material')
          ?.value &&
        !!this.materialForm
          .get('id_material_type')
          ?.value;


      this.tutoService
        .setCanContinue(
          requiredFieldsReady &&
          this.materialForm.valid &&
          this.tutorialCodeCheckDone
        );

    }


    ngOnDestroy(): void {

      this.tutorialStatusSubscription
        ?.unsubscribe();

    }


    checkCodeMaterial(
      codeMaterial: string
    ): void {

      if (
        this.tutoService
          .isMaterialStep(2)
      ) {

        this.tutorialCodeCheckDone =
          false;

        this.tutoService
          .setCanContinue(
            false
          );

      }


      if (codeMaterial) {

        this.api
          .checkCodeMaterial(
            codeMaterial
          )
          .subscribe(

            response => {

              this.codeMaterialExists =
                response.exists;


              const control =
                this.materialForm
                  .get(
                    'code_material'
                  );


              if (
                this.codeMaterialExists
              ) {

                control?.setErrors({
                  codeExists: true
                });

              }


              if (
                this.tutoService
                  .isMaterialStep(2)
              ) {

                this.tutorialCodeCheckDone =
                  true;

                this.updateMaterialTutorialValidity();

              }

            },

            error => {

              console.error(
                'Erreur lors de la vérification du code material',
                error
              );


              if (
                this.tutoService
                  .isMaterialStep(2)
              ) {

                this.tutorialCodeCheckDone =
                  false;

                this.updateMaterialTutorialValidity();

              }

            }

          );
      }
    }


    onReset(): void {
      if (!this.initialFormState) {
        return;
      }

      const isEdit =
        !!this.materialFormService
          .occurrence
          .getValue();

      this.dialogService
        .confirmDialog({
          message: '',
          icon: 'spa',
          variant: 'material-reset',
          entityLabel: isEdit
            ? 'les modifications de ce matériel récolté'
            : 'cette fiche de matériel récolté',
          disableClose: false
        })
        .subscribe((yes) => {
          if (!yes) {
            return;
          }

          const formState =
            JSON.parse(
              JSON.stringify(
                this.initialFormState
              )
            );

          const initialTaxons =
            formState.taxons || [];

          delete formState.taxons;

          const taxonsArray =
            this.materialForm.get(
              'taxons'
            ) as FormArray;

          taxonsArray.clear();

          this.materialForm.reset(
            formState
          );

          initialTaxons.forEach(
            (taxon) => {
              taxonsArray.push(
                this.materialFormService
                  .createTaxonControl(
                    taxon.parentFormControl
                  )
              );
            }
          );

          this.codeMaterialControl.reset(
            this.initialParentCode
          );

          this.materialForm.markAsPristine();
          this.materialForm.markAsUntouched();
          this.materialForm.updateValueAndValidity();
        });
    }


    private toBoldText(value: string): string {
      const boldItalicChars: Record<string, string> = {
        A: '𝑨', B: '𝑩', C: '𝑪', D: '𝑫', E: '𝑬', F: '𝑭', G: '𝑮', H: '𝑯', I: '𝑰', J: '𝑱',
        K: '𝑲', L: '𝑳', M: '𝑴', N: '𝑵', O: '𝑶', P: '𝑷', Q: '𝑸', R: '𝑹', S: '𝑺', T: '𝑻',
        U: '𝑼', V: '𝑽', W: '𝑾', X: '𝑿', Y: '𝒀', Z: '𝒁',
        a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆', f: '𝒇', g: '𝒈', h: '𝒉', i: '𝒊', j: '𝒋',
        k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐', p: '𝒑', q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕',
        u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙', y: '𝒚', z: '𝒛',
        0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
      };

      return value.replace(/[A-Za-z0-9]/g, (char) => boldItalicChars[char] || char);
    }


    onCancel(): void {
      if (this.cancelDialogOpen) {
        return;
      }

      this.cancelDialogOpen = true;

      const currentCode =
        this.materialForm.get('code_material')?.value ||
        this.initialFormState?.code_material ||
        '';

      this.dialogService
        .confirmDialog({
          message: '',
          icon: 'spa',
          variant: 'material-exit',
          entityLabel: currentCode
            ? 'le matériel récolté'
            : 'cette fiche de matériel récolté',
          entityCode: currentCode || undefined,
          disableClose: false
        })
        .subscribe((yes) => {
          this.cancelDialogOpen = false;

          if (!yes) {
            return;
          }

          const isEdit =
            !!this.materialFormService
              .occurrence
              .getValue();

          if (isEdit) {
            this._commonService.translateToaster(
              'info',
              currentCode
                ? `Matériel récolté ${this.toBoldText(currentCode)} non modifié`
                : 'Matériel récolté non modifié'
            );
          } else if (currentCode) {
            this._commonService.translateToaster(
              'info',
              `Matériel récolté ${this.toBoldText(currentCode)} non créé`
            );
          } else {
            this._commonService.translateToaster(
              'info',
              'Création du matériel récolté annulée'
            );
          }

          this.close();
        });
    }


    close(): void {
        this.materialFormService.occurrence.next(null);
        this.dialogRef.close();
    }

    onTaxonSelected(event: any) {     
      const selectedTaxon = event?.item;      
      if (!selectedTaxon) return;
      this.materialFormService.addTaxon(selectedTaxon, this.allowMultipleTaxons);
      event.preventDefault();
    }
    
        submetData(){

        const tutorialEdit =
          this.tutoService
            .isMaterialStep(11);


        if (
          this.tutoService
            .isMaterialStep(3)
        ) {

          this.tutoService
            .showMaterialConfirmStep();

        }


        if (tutorialEdit) {

          this.tutoService
            .showMaterialEditConfirmStep();

        }


        const currentCode =
          this.materialForm.get('code_material')?.value ||
          this.initialFormState?.code_material ||
          '';

        const currentOccurrence =
          this.materialFormService
            .occurrence
            .getValue();

        const isEdit =
          !!currentOccurrence;

        const initialMaterialType =
          Number(
            currentOccurrence?.id_material_type || 0
          );

        const selectedMaterialType =
          Number(
            this.materialForm
              .get('id_material_type')
              ?.value || 0
          );

        if (
          isEdit &&
          this.hasSeedDescription &&
          initialMaterialType > 0 &&
          selectedMaterialType > 0 &&
          initialMaterialType !== selectedMaterialType
        ) {
          this._commonService.translateToaster(
            'warning',
            'Modification impossible : ce matériel récolté possède une fiche Semence. Supprimez d\'abord la fiche Semence avant de modifier le type de matériel récolté.'
          );

          return;
        }

        this.dialogService
          .confirmDialog({
            message: '',
            icon: 'spa',
            variant: 'material-save',
            entityLabel: isEdit
              ? 'les modifications du matériel récolté'
              : 'le matériel récolté',
            entityCode: currentCode || undefined,
            disableClose: false
          })
          .subscribe((yes) => {

            if (!yes) {

              if (
                this.tutoService
                  .isMaterialStep(4)
              ) {

                this.tutoService
                  .showMaterialSaveStep();

              } else if (
                tutorialEdit
              ) {

                this.tutoService
                  .showMaterialEditFormStep();

              }

              return;
            }


            if (
              this.tutoService
                .isMaterialStep(4)
            ) {

              this.tutoService
                .showMaterialTableStep(
                  currentCode
                );

            }


            if (tutorialEdit) {

              this.tutoService
                .showMaterialActionsAgainStep();

            }


            const finalForm =
              this.formatDataFormHarvest();


            this.materialFormService
              .submitOccurrence(
                finalForm,
                (
                  occurrence:
                    any
                ) => {

                  if (
                    tutorialEdit &&
                    occurrence?.id_material
                  ) {

                    /*
                     * Recharge le matériel sélectionné
                     * pour actualiser immédiatement
                     * Semence et Stockage.
                     */
                    this.exsituFormService
                      .setIdMaterial(
                        occurrence.id_material
                      );

                  }

                }
              );


            this.close()
          });
    }

    private formatDataFormHarvest() {
        const finalForm = JSON.parse(JSON.stringify(this.materialForm.value));

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

        if(this.codeMaterialControl){
          finalForm.code_parent = this.codeMaterialControl.value;
        }

        if (
          !this.materialFormService
            .occurrence
            .getValue()?.id_material &&
          this.dialogData?.idCulture
        ) {
          finalForm.id_culture_source =
            Number(
              this.dialogData.idCulture
            );
        }
        
        if(finalForm.taxons)
          finalForm.taxons = finalForm.taxons.map(taxon => taxon.parentFormControl.cd_nom);
        delete finalForm.taxonInput;
        
    
        return finalForm;
    }

    isValidTaxonSelected(): boolean {
      const val = this.materialForm?.controls?.taxonInput?.value;
      return val && typeof val === 'object' && 'cd_nom' in val;
    }
    
}
