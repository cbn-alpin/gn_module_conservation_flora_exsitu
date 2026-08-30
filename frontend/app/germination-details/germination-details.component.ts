import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { CommonService } from '@geonature_common/service/common.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';

interface Germination {
  numSemis: string;
  numSemence: string;
  dateDebut: Date;
  dateFin: Date;
  replicate: number;
  levage: number;
}

@Component({
  selector: 'app-germination-details',
  templateUrl: './germination-details.component.html',
  styleUrls: ['./germination-details.component.scss']
})
export class GerminationDetailsComponent implements OnInit {
  idMaterial!: number;
  idStorage:any;
  idTest!: number;
  selectedAction: any = null;
  noActionMatchesFilters = false;
  labels: any = {};
  actionDetailsRefreshKey = 0;

  germinationForm: FormGroup;
  dataSource = new MatTableDataSource<Germination>([]);
  displayedColumns: string[] = [
    'numSemis',
    'numSemence',
    'dateDebut',
    'dateFin',
    'replicate',
    'levage'
  ];

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private api: DataService,
    private exsituFormService: ExsituFormService,
    private toast: CommonService,
    private dialogService: DialogService
  ) {
    this.germinationForm = this.fb.group({
      code: [''],
      id_test_parent: [''],
      id_material: [''],
      id_actor: [''],
      id_storage: [''],
      id_test_type: [''],
      seed_initial_count: [''],
      replicate_count: [''],
      id_support: [''],
      id_substrate: [''],
      remarks: [''],
      additional_data: this.fb.group({
        program: ['']
      })
    });
  }

  ngOnInit(): void {
    const urlSegments =
      this.router.url
        .split('?')[0]
        .split('/');

    const materialIndex =
      urlSegments.indexOf('material') + 1;

    const testIndex =
      urlSegments.indexOf('germination-details') + 1;


    this.idMaterial =
      materialIndex > 0 &&
      materialIndex < urlSegments.length
        ? Number(urlSegments[materialIndex])
        : 0;


    this.idTest =
      testIndex > 0 &&
      testIndex < urlSegments.length
        ? Number(urlSegments[testIndex])
        : 0;


    if (
      !this.idTest ||
      !this.idMaterial
    ) {
      console.error(
        'idTest ou idMaterial manquant dans l’URL.'
      );

      return;
    }


    this.exsituFormService
      .setIdMaterial(this.idMaterial);

    this.exsituFormService
      .setIdTest(this.idTest);


    this.loadTestDetails();
  }
 
  loadTestDetails(): void {
    this.api.getTestWithLabels(this.idTest).subscribe({
      next: (test) => {
        console.log(" Test chargé :", test);
        this.patchFormFromTest(test);
      },
      error: (err) => {
        console.error(" Erreur lors du chargement du test :", err);
      }
    });
  }

  patchFormFromTest(test: any): void {
    this.germinationForm.patchValue({
      code: test.code,
      id_test_parent: test.id_test_parent || '',
      id_material: test.material_label,
      id_actor: test.actor_label,
      id_storage: test.storage_label || '',
      id_test_type: test.test_type_label,
      seed_initial_count: test.seed_initial_count,
      replicate_count: test.replicate_count,
      id_support: test.support_label,
      id_substrate: test.substrate_label,
      remarks: test.remarks,
      additional_data: {
        program: test.additional_data?.program || ''
      }
    });
  }

  onBack(): void {
    window.history.back();
  }

  onActionSelected(action: any): void {
    const idAction = action.id_action;

    this.noActionMatchesFilters = false;
  
    // Recharge les données complètes de l'action depuis l'API
    this.api.getActionWithLabels(idAction).subscribe({
      next: (fullAction) => {
        this.selectedAction = fullAction;  // contient tous les champs + labels
      },
      error: (err) => {
        console.error("Erreur chargement de l'action :", err);
      }
    });
  }


  private getActionRows(): any[] {
    return (this.dataSource?.data as any[]) || [];
  }


  private getSelectedActionIndex(): number {
    if (!this.selectedAction) {
      return -1;
    }

    return this.getActionRows().findIndex(
      (action) => action.id_action === this.selectedAction.id_action
    );
  }


  canGoToPreviousAction(): boolean {
    return this.getSelectedActionIndex() > 0;
  }


  canGoToNextAction(): boolean {
    const selectedIndex = this.getSelectedActionIndex();
    const actions = this.getActionRows();

    return selectedIndex >= 0 && selectedIndex < actions.length - 1;
  }


  showPreviousActionDetails(): void {
    const selectedIndex = this.getSelectedActionIndex();

    if (selectedIndex <= 0) {
      return;
    }

    this.onActionSelected(this.getActionRows()[selectedIndex - 1]);
  }


  showNextActionDetails(): void {
    const selectedIndex = this.getSelectedActionIndex();
    const actions = this.getActionRows();

    if (selectedIndex < 0 || selectedIndex >= actions.length - 1) {
      return;
    }

    this.onActionSelected(actions[selectedIndex + 1]);
  }


  refreshSelectedActionDetails(actionId: number): void {
    if (!this.selectedAction || this.selectedAction.id_action !== actionId) {
      return;
    }

    this.api.getActionWithLabels(actionId).subscribe({
      next: (fullAction) => {
        this.selectedAction = fullAction;
        this.actionDetailsRefreshKey++;
      },
      error: (err) => {
        console.error("Erreur rafraîchissement des détails de l'action :", err);
      }
    });
  }


  hideSelectedActionDetails(): void {
    if (!this.selectedAction) {
      return;
    }

    const testCode =
      this.germinationForm.get('code')?.value || '';

    const actionType =
      this.selectedAction?.label_action_type ||
      this.selectedAction?.action_type_label ||
      '';

    const actionLabel =
      [testCode, actionType]
        .filter(Boolean)
        .join(' - ');

    const dateStart =
      this.formatDateForToaster(
        this.selectedAction?.date_start
      );

    this.toast.translateToaster(
      'info',
      `Détails de l’action ${this.toBoldItalicText(actionLabel)} masqués.\nDate de début : ${this.toBoldText(dateStart)}`
    );

    this.selectedAction = null;
    this.noActionMatchesFilters = false;
  }


  onVisibleActionsChanged(visibleActions: any[]): void {
    if (!this.selectedAction) {
      this.noActionMatchesFilters = false;
      return;
    }

    if (visibleActions.length === 0) {
      this.noActionMatchesFilters = true;
      return;
    }

    this.noActionMatchesFilters = false;

    const selectedActionStillVisible = visibleActions.some(
      (action) => action.id_action === this.selectedAction.id_action
    );

    if (selectedActionStillVisible) {
      return;
    }

    this.onActionSelected(visibleActions[0]);
  }


  private toBoldItalicText(value: string): string {
    const boldItalicChars: Record<string, string> = {
      A: '𝑨', B: '𝑩', C: '𝑪', D: '𝑫', E: '𝑬', F: '𝑭', G: '𝑮', H: '𝑯', I: '𝑰', J: '𝑱',
      K: '𝑲', L: '𝑳', M: '𝑴', N: '𝑵', O: '𝑶', P: '𝑷', Q: '𝑸', R: '𝑹', S: '𝑺', T: '𝑻',
      U: '𝑼', V: '𝑽', W: '𝑾', X: '𝑿', Y: '𝒀', Z: '𝒁',
      a: '𝒂', b: '𝒃', c: '𝒄', d: '𝒅', e: '𝒆', f: '𝒇', g: '𝒈', h: '𝒉', i: '𝒊', j: '𝒋',
      k: '𝒌', l: '𝒍', m: '𝒎', n: '𝒏', o: '𝒐', p: '𝒑', q: '𝒒', r: '𝒓', s: '𝒔', t: '𝒕',
      u: '𝒖', v: '𝒗', w: '𝒘', x: '𝒙', y: '𝒚', z: '𝒛',
      0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
    };

    return value.replace(
      /[A-Za-z0-9]/g,
      (char) => boldItalicChars[char] || char
    );
  }


  private formatDateForToaster(value: any): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  

  private toBoldText(value: string): string {
    const boldChars: Record<string, string> = {
      A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆', H: '𝐇', I: '𝐈', J: '𝐉',
      K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍', O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓',
      U: '𝐔', V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙',
      a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠', h: '𝐡', i: '𝐢', j: '𝐣',
      k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧', o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭',
      u: '𝐮', v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳',
      0: '𝟎', 1: '𝟏', 2: '𝟐', 3: '𝟑', 4: '𝟒', 5: '𝟓', 6: '𝟔', 7: '𝟕', 8: '𝟖', 9: '𝟗'
    };

    return value.replace(
      /[A-Za-z0-9]/g,
      (char) => boldChars[char] || char
    );
  }

  onDeleteTest(): void {
    if (!this.idMaterial || !this.idTest) {
      return;
    }

    const currentCode =
      this.germinationForm.get('code')?.value || '';

    this.api
      .getActionsByTest(this.idTest)
      .subscribe({
        next: (actions) => {
          const actionCount =
            actions?.length || 0;

          if (actionCount > 0) {
            const actionLabel =
              actionCount > 1
                ? 'actions liées'
                : 'action liée';

            this.toast.translateToaster(
              'warning',
              `Suppression impossible : le test de germination ${
                this.toBoldText(currentCode)
              } contient ${
                this.toBoldText(String(actionCount))
              } ${actionLabel}. Supprimez d'abord les actions liées à ce test de germination.`
            );

            return;
          }

          this.dialogService
            .confirmDialog({
              message: '',
              icon: 'wb_sunny',
              variant: 'germination',
              entityCode: currentCode,
              disableClose: false
            })
            .subscribe((yes) => {
              if (!yes) {
                return;
              }

              this.api
                .deleteTest(
                  this.idMaterial,
                  this.idTest
                )
                .subscribe({
                  next: () => {
                    this.toast.translateToaster(
                      'error',
                      `Test de germination ${
                        this.toBoldText(currentCode)
                      } supprimé avec succès`
                    );

                    const idHarvest =
                      this.exsituFormService.idHarvest;

                    if (!idHarvest) {
                      this.onBack();
                      return;
                    }

                    this.exsituFormService.currentTab =
                      'germination-table';

                    this.router.navigate([
                      '/conservation_flora_exsitu/form/harvest',
                      idHarvest,
                      'material',
                      this.idMaterial,
                      'germination-table'
                    ]);
                  },

                  error: (err) => {
                    const linkedActionCount =
                      err?.error?.action_count;

                    if (
                      err?.status === 409 &&
                      linkedActionCount
                    ) {
                      const actionLabel =
                        linkedActionCount > 1
                          ? 'actions liées'
                          : 'action liée';

                      this.toast.translateToaster(
                        'warning',
                        `Suppression impossible : le test de germination ${
                          this.toBoldText(currentCode)
                        } contient ${
                          this.toBoldText(
                            String(linkedActionCount)
                          )
                        } ${actionLabel}. Supprimez d'abord les actions liées à ce test de germination.`
                      );

                      return;
                    }

                    console.error(
                      'Erreur lors de la suppression du test de germination :',
                      err
                    );
                  }
                });
            });
        },

        error: (err) => {
          console.error(
            'Erreur lors de la vérification des actions liées au test de germination :',
            err
          );
        }
      });
  }

  onView(): void {}
  onEdit(): void {}
  onCancel(): void {}

  onSubmit(): void {
    if (this.germinationForm.valid) {
      const formData = this.germinationForm.value;
      console.log('Formulaire soumis :', formData);
    }
  }
}