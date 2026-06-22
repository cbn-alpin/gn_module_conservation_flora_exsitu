import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../services/data.service';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { CommonService } from '@geonature_common/service/common.service';

@Component({
  selector: 'app-semis-details',
  templateUrl: './semis-details.component.html',
  styleUrls: ['./semis-details.component.scss']
})
export class SemisDetailsComponent implements OnInit {
  idMaterial!: number;
  idSowing!: number;
  selectedAction: any = null;
  actionDetailsRefreshKey = 0;

  sowingForm: FormGroup;
  dataSource = new MatTableDataSource<any>([]);

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private toast: CommonService,
    private api: DataService,
    private exsituFormService: ExsituFormService
  ) {
    this.sowingForm = this.fb.group({
      code: [''],
      id_material: [''],
      id_storage: [''],
      id_actor: [''],
      start_date: [''],
      end_date: [''],
      id_sowing_method: [''],
      id_watering_method: [''],
      id_location: [''],
      specification_location: [''],
      initial_count: [''],
      replicate_count: [''],
      depth: [''],
      container: [''],
      substrate: [''],
      remarks: [''],
      additional_data: this.fb.group({
        program: ['']
      })
    });
  }

  ngOnInit(): void {
    const urlSegments = this.router.url.split('/');

    const materialIndex = urlSegments.indexOf('material') + 1;
    const semisIndex = urlSegments.indexOf('semis-details') + 1;

    this.idMaterial = materialIndex > 0 && materialIndex < urlSegments.length
      ? Number(urlSegments[materialIndex])
      : 0;

    this.idSowing = semisIndex > 0 && semisIndex < urlSegments.length
      ? Number(urlSegments[semisIndex])
      : 0;

    if (!this.idSowing || !this.idMaterial) {
      return;
    }

    this.loadSowingDetails();
    this.loadSowingActions();
  }

  loadSowingDetails(): void {
    this.api.getSowingsByMaterial(this.idMaterial).subscribe({
      next: (sowings) => {
        const sowing = (sowings || []).find((item: any) => item.id_sowing === this.idSowing);
        if (!sowing) {
          return;
        }

        this.patchFormFromSowing(sowing);
      },
      error: (err) => {
        console.error('Erreur lors du chargement du semis :', err);
        console.log('loadSowingDetails ->', this.idMaterial, this.idSowing);
      }
    });
  }

  loadSowingActions(): void {
    this.api.getActionsBySowing(this.idSowing).subscribe({
      next: (actions) => {
        this.dataSource.data = actions || [];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des actions du semis :', err);
      }
    });
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

  return value.replace(/[A-Za-z0-9]/g, (char) => boldItalicChars[char] || char);
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

    return value.replace(/[A-Za-z0-9]/g, (char) => boldChars[char] || char);
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

  hideSelectedActionDetails(): void {
    if (!this.selectedAction) {
      return;
    }

    const sowingCode = this.sowingForm.get('code')?.value || '';
    const actionType = this.selectedAction?.label_action_type || '';
    const actionLabel = `${sowingCode} - ${actionType}`.trim();
    const dateStart = this.formatDateForToaster(this.selectedAction?.date_start);

    this.toast.translateToaster(
      'info',
      `Détails de l’action ${this.toBoldItalicText(actionLabel)} masqués. Date de début : ${this.toBoldText(dateStart)}`
    );

    this.selectedAction = null;
  }

  getSowingReplicateCount(): number | null {
    const value = Number(this.sowingForm.get('replicate_count')?.value);

    return Number.isFinite(value) && value > 0 ? value : null;
  }


  onVisibleActionsChanged(visibleActions: any[]): void {
    if (!this.selectedAction) {
      return;
    }

    const selectedActionStillVisible = visibleActions.some(
      (action) => action.id_action === this.selectedAction.id_action
    );

    if (selectedActionStillVisible) {
      return;
    }

    if (visibleActions.length > 0) {
      this.onActionSelected(visibleActions[0]);
      return;
    }

    this.selectedAction = null;
  }



  patchFormFromSowing(sowing: any): void {
    this.sowingForm.patchValue({
      code: sowing.code || '-',
      id_material: sowing.code_material || '-',
      id_storage: sowing.id_storage ?? '-',
      id_actor: sowing.nom_actor && sowing.prenom_actor ? `${sowing.prenom_actor} ${sowing.nom_actor}` : '-',
      start_date: sowing.start_date || '-',
      end_date: sowing.end_date || '-',
      id_sowing_method: sowing.label_sowing || sowing.id_sowing_method || '-',
      id_watering_method: sowing.label_watering || sowing.id_watering_method || '-',
      id_location: sowing.label_location || sowing.id_location || '-',
      specification_location: sowing.specification_location || '-',
      initial_count: sowing.initial_count ?? '-',
      replicate_count: sowing.replicate_count ?? '-',
      depth: sowing.depth ?? '-',
      container: sowing.container?.value || sowing.container || '-',
      substrate: sowing.label_substrate || sowing.substrate?.value || '-',
      remarks: sowing.remarks || '-',
      additional_data: {
        program: sowing.additional_data?.program || '-'
      }
    });
  }

  onBack(): void {
    window.history.back();
  }

  onActionSelected(action: any): void {
    const idAction = action.id_action;

    this.api.getActionWithLabels(idAction).subscribe({
      next: (fullAction) => {
        this.selectedAction = fullAction;
      },
      error: (err) => {
        console.error('Erreur chargement de l’action :', err);
      }
    });
  }

  private getActionRows(): any[] {
    return this.dataSource?.data || [];
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
        console.error('Erreur rafraîchissement des détails de l’action :', err);
      }
    });
  }

  onDelete(): void {}
  onView(): void {}
  onEdit(): void {}
  onCancel(): void {}
}