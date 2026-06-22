import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DataService } from '../services/data.service';

interface ReplicateGroup {
  date: Date | null;
  replicates: any[];
  total_germinated: number;
  total_dead: number;
  total_viable: number;
}

@Component({
  selector: 'app-action-details',
  templateUrl: './action-details.component.html',
  styleUrls: ['./action-details.component.scss']
})
export class ActionDetailsComponent implements OnChanges {
  @Input() actionId: number | null = null;
  @Input() isSowingContext = false;
  @Input() refreshKey = 0;
  @Output() hideDetails = new EventEmitter<void>();

  germinationForm: FormGroup;
  code: string | null = null;
  replicates: any[] = [];
  replicatesGrouped: ReplicateGroup[] = [];
  replicateLabels: string[] = [];

  action: any = null;
  scarificationTypeCode: string | null = null;

  labels: any = {
    id_action_type: '',
    id_actor: '',
    id_water_type: '',
    id_chemical_liquid: '',
    id_liquid_treatment: '',
    id_scarification_type: '',
    id_scarification_mecanique: '',
    id_tool: '',
    id_sterilization_liquid: '',
    id_sterilization_product: '',
  };

  germinationIndicators: { delay: number; period: number; percent: number } | null = null;
  germinationIndicatorsByReplicat: {
    [replicatCode: string]: { delay: number | null; period: number | null; percent: number }
  } = {};

  constructor(
    private fb: FormBuilder,
    private api: DataService
  ) {
    this.germinationForm = this.fb.group({
      id_action_type: [''],
      id_actor: [''],
      date_start: [''],
      date_end: [''],
      remarks: [''],
      nbGermes: [null],
      nbViables: [null],
      nbRepiques: [null],
      nbMortes: [null],
      totalRepiques: [null],
      total_count_germinated: [null],
      total_count_dead: [null],
      total_count_viable: [null],
      id_water_type: [null],
      duration_water: [null],
      duration_chemical_liquid: [null],
      id_chemical_liquid: [null],
      id_liquid_treatment: [null],
      concentration_chemical_liquid: [null],
      temperature_light: [null],
      temperature_shadow: [null],
      hour_count_light: [null],
      hour_count_shadow: [null],
      id_scarification_type: [null],
      id_tool: [null],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.actionId || changes.refreshKey) && this.actionId) {
      this.loadActionDetails(this.actionId);
    }
  }

  loadActionDetails(id: number): void {
    this.api.getActionWithLabels(id).subscribe({
      next: (action) => {
        console.log("✅ Action chargée :", action);
        this.action = action;

        this.labels = {
          id_action_type: action.label_action_type,
          id_actor: action.label_actor,
          id_chemical_liquid: action.label_chemical_liquid,
          id_sterilization_liquid: action.label_sterilization_liquid,
          id_sterilization_product: action.label_sterilization_product,
          id_liquid_treatment: action.label_liquid_treatment,
          id_water_type: action.label_water_type,
          id_scarification_type: action.label_scarification_type,
          id_scarification_mecanique: action.label_scarification_mecanique,
          total_count_germinated: action.total_count_germinated,
          total_count_dead: action.total_count_dead,
          total_count_viable: action.total_count_viable,
          id_tool: action.label_tool,
        };

        this.patchForm(action);

        if (action.id_action_type) {
          this.getActionByCode(action.id_action_type, 'code');
        }

        if (action.id_scarification_type) {
          this.getActionByCode(action.id_scarification_type, 'scarification');
        }

        if (action.replicates?.length) {
          this.replicates = action.replicates.filter(r => r.code !== 'synth');
          this.replicateLabels = this.getReplicateLabels(this.replicates);
          this.replicatesGrouped = this.groupReplicatesByDate(this.replicates);
          this.calculateGerminationIndicators();
        }
        const synthReplicate = action.replicates.find(r => r.code === 'synth');
        if (synthReplicate) {
          this.germinationForm.patchValue({
            total_count_germinated: synthReplicate.total_count_germinated,
            total_count_dead: synthReplicate.total_count_dead,
            total_count_viable: synthReplicate.total_count_viable,
          });
        }

      }
    });
  }

  getActionByCode(id_nomenclature: number, target: 'code' | 'scarification'): void {
    this.api.getActionByCode(id_nomenclature).subscribe({
      next: (result) => {
        if (target === 'code') {
          this.code = result.cd_nomenclature;
        } else if (target === 'scarification') {
          this.scarificationTypeCode = result.cd_nomenclature;
        }
      },
      error: (err) => {
        console.error("❌ Erreur lors de la récupération du code :", err);
      }
    });
  }

  patchForm(action: any): void {
    this.germinationForm.patchValue(action);
  }

  getReplicateLabels(replicates: any[]): string[] {
    const set = new Set(replicates.map(r => r.code).filter(code => code !== 'synth'));
    return Array.from(set).sort();
  }

  groupReplicatesByDate(replicates: any[]): ReplicateGroup[] {
    const groupedByDate: { [date: string]: any[] } = {};
    replicates
      .filter(rep => rep.code !== 'synth')
      .forEach(rep => {
        const rawDate = rep.date ? new Date(rep.date) : null;
        const key = rawDate ? rawDate.toISOString().split('T')[0] : 'inconnue';
        if (!groupedByDate[key]) groupedByDate[key] = [];
        groupedByDate[key].push(rep);
      });

    const result: ReplicateGroup[] = [];

    for (const [dateKey, reps] of Object.entries(groupedByDate)) {
      const date = dateKey !== 'inconnue' ? new Date(dateKey) : null;
      const grouped: { [code: string]: any } = {};
      reps.forEach(rep => grouped[rep.code] = rep);
      const replicateArray = this.replicateLabels.map(code => grouped[code] || {});

      const total_germinated = replicateArray.reduce((sum, r) => sum + (r.count_germinated || 0), 0);
      const total_dead = replicateArray.reduce((sum, r) => sum + (r.count_dead || 0), 0);
      const total_viable = replicateArray.reduce((sum, r) => sum + (r.count_viable || 0), 0);

      result.push({ date, replicates: replicateArray, total_germinated, total_dead, total_viable });
    }

    return result.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });
  }

  getReplicateTotals() {
    const totalsByRep: { [code: string]: { germinated: number; dead: number; viable: number } } = {};
    let totalGermes = 0;
    let totalMortes = 0;
    let totalViables = 0;

    for (const rep of this.replicates) {
      const code = rep.code;
      if (code === 'synth') continue;

      if (!totalsByRep[code]) {
        totalsByRep[code] = { germinated: 0, dead: 0, viable: 0 };
      }

      const g = rep.count_germinated || 0;
      const d = rep.count_dead || 0;
      const v = rep.count_viable || 0;

      totalsByRep[code].germinated += g;
      totalsByRep[code].dead += d;
      totalsByRep[code].viable += v;

      totalGermes += g;
      totalMortes += d;
      totalViables += v;
    }

    return {
      byReplicate: totalsByRep,
      grandTotal: {
        germinated: totalGermes,
        dead: totalMortes,
        viable: totalViables
      }
    };
  }

  getReplicateIndicator(code: string, key: 'delay' | 'period' | 'percent'): number | null {
    return this.germinationIndicatorsByReplicat[code]?.[key] ?? null;
  }

  calculateGerminationIndicators(): void {
    if (!this.replicatesGrouped?.length) return;

    const germinationDates: Date[] = [];

    for (const group of this.replicatesGrouped) {
      if (!group.date) continue;
      const germinated = group.replicates.reduce((sum, r) => sum + (r.count_germinated || 0), 0);
      if (germinated > 0) {
        germinationDates.push(group.date);
      }
    }

    const startDate = new Date(this.germinationForm.get('date_start')?.value);

    const delay = germinationDates.length
      ? Math.max(0, Math.floor((germinationDates[0].getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    let period: number | null = null;
    if (germinationDates.length >= 2) {
      const first = germinationDates[0].getTime();
      const last = germinationDates[germinationDates.length - 1].getTime();
      const diffDays = Math.floor((last - first) / (1000 * 60 * 60 * 24));
      period = diffDays === 0 ? 1 : diffDays;
    } else if (germinationDates.length === 1) {
      period = 1;
    }

    const totals = this.getReplicateTotals().grandTotal;
    const percent = totals.germinated && (totals.germinated + totals.dead + totals.viable)
      ? Math.round((totals.germinated / (totals.germinated + totals.dead + totals.viable)) * 100)
      : 0;

    this.germinationIndicators = {
      delay: delay ?? 0,
      period: period ?? 0,
      percent
    };

    this.germinationIndicatorsByReplicat = {};

    for (const code of this.replicateLabels) {
      const germinationDates: Date[] = [];
      let total_germinated = 0;
      let total_dead = 0;
      let total_viable = 0;

      for (const group of this.replicatesGrouped) {
        const rep = group.replicates.find(r => r.code === code);
        if (rep) {
          const g = rep.count_germinated || 0;
          const d = rep.count_dead || 0;
          const v = rep.count_viable || 0;

          if (g > 0 && group.date) {
            germinationDates.push(group.date);
          }

          total_germinated += g;
          total_dead += d;
          total_viable += v;
        }
      }

      const delay = germinationDates.length
        ? Math.max(0, Math.floor((germinationDates[0].getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      let period: number | null = null;
      if (germinationDates.length >= 2) {
        const first = germinationDates[0].getTime();
        const last = germinationDates[germinationDates.length - 1].getTime();
        const diffDays = Math.floor((last - first) / (1000 * 60 * 60 * 24));
        period = diffDays === 0 ? 1 : diffDays;
      } else if (germinationDates.length === 1) {
        period = 1;
      }

      const percent = (total_germinated + total_dead + total_viable) > 0
        ? Math.round((total_germinated / (total_germinated + total_dead + total_viable)) * 100)
        : 0;

      this.germinationIndicatorsByReplicat[code] = {
        delay,
        period,
        percent
      };
    }
  }

  private firstFilledValue(...values: any[]): any {
    for (const value of values) {
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }

    return '-';
  }

  getSowingChemicalTemperatureDisplayValue(): string | number {
    return this.firstFilledValue(
      this.germinationForm.get('temperature_light')?.value,
      this.action?.temperature_light
    );
  }

  getSowingActorDisplayValue(): string {
    return this.firstFilledValue(
      this.labels?.id_actor,
      this.action?.label_actor
    );
  }
  
  getMechanicalScarificationDisplayValue(): string {
    const value = this.labels?.id_scarification_mecanique || '';

    if (!value) {
      return '-';
    }

    const normalizedValue = String(value).trim().toLowerCase();

    if (normalizedValue === 'partielle' || normalizedValue === 'scarification partielle') {
      return 'Scarification partielle';
    }

    if (normalizedValue === 'totale' || normalizedValue === 'scarification totale') {
      return 'Scarification totale';
    }

    return value;
  }

  formatDateForDisplay(value: any): string {
    if (!value) {
      return '-';
    }

    if (typeof value === 'string') {
      const datePart = value.split('T')[0];
      const [year, month, day] = datePart.split('-');

      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }
}
