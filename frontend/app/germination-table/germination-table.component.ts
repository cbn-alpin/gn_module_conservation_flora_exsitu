import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { GerminationComponent } from '../germination/germination.component';
import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { DataService } from '../services/data.service';
import { ActionComponent } from '../action/action.component';

export interface Germination {
  numSemis: string;
  numSemence: string;
  dateDebut: Date;
  dateFin: Date;
  replicate: number;
  levage: number;
}

@Component({
  selector: 'app-germination-table',
  templateUrl: './germination-table.component.html',
  styleUrls: ['./germination-table.component.scss']
})
export class GerminationTableComponent implements OnInit {
  idMaterial: number | null = null;
  idStorage: number | null = null;
  codeT: any = 'ger';
  idGermination: any;
  dataSource = new MatTableDataSource<any>();

  @Output() view = new EventEmitter<Germination>();
  @Output() edit = new EventEmitter<Germination>();
  @Output() delete = new EventEmitter<Germination>();

  displayedColumns: string[] = [
    'code',
    'germination_rate',
    'meta_create_date',
    'seed_initial_count',
    'photo_thermo_regime',
    'treatment',
    'pre_treatment',
    'actions'
  ];

  constructor(
    public router: Router,
    private dialog: MatDialog,
    public exsituFormService: ExsituFormService,
    private api: DataService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.getTestByCode(this.codeT);
      this.loadTests();

      if (params['open'] === 'tdg') {
        setTimeout(() => {
          // ferme toute modale résiduelle au cas où
          this.dialog.closeAll();

          this.dialog.open(GerminationComponent, {
            width: '900px',
            height: '90vh'
          });

          // Nettoyer l’URL pour éviter les réouvertures
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
        }, 10);
      }
    });
  }

  onBackToMaterial(): void {
    const idHarvest = this.exsituFormService.idHarvest;

    if (!idHarvest) {
      console.error(
        'Impossible de revenir au matériel récolté : idHarvest manquant.'
      );

      return;
    }

    this.exsituFormService.currentTab = 'materials';

    this.router.navigate([
      `/conservation_flora_exsitu/form/harvest/${idHarvest}/material-form`
    ]);
  }


  getTestByCode(code: any): void {
    this.api.getActionByCode(code).subscribe({
      next: (test) => {
        this.idGermination = test.id_nomenclature;
      },
      error: (err) => {
        console.error("Erreur lors du chargement du code :", err);
      }
    });
  }

  async loadTests(): Promise<void> {
    const id = this.exsituFormService.idMaterial;
    if (!id) {
      console.warn("⚠️ Aucun idMaterial trouvé !");
      return;
    }

    this.api.getTestsByMaterial(id).subscribe({
      next: async (tests) => {
        try {
          const testType = await this.api.getActionByCode(this.codeT).toPromise();
          this.idGermination = testType.id_nomenclature;
        } catch (err) {
          console.error("❌ Erreur lors du chargement du type de test :", err);
          return;
        }

        const filteredTests = tests.filter(t => t.id_test_type === this.idGermination);

        const mappedTests = await Promise.all(filteredTests.map(async (t) => {
          t.thermoPhoto = '';
          t.treatment = '-';

          try {
            const res = await this.api.getTreatmentByTest(t.id_test).toPromise();
            t.treatment = res?.treatment_label ?? '-';
          } catch {}

          try {
            const regime = await this.api.getThermoPhotoRegime(t.id_test).toPromise();
            const { temperature_light, temperature_shadow, hour_count_light, hour_count_shadow } = regime || {};
            if (
              temperature_light != null &&
              temperature_shadow != null &&
              hour_count_light != null &&
              hour_count_shadow != null
            ) {
              t.thermoPhoto = `${temperature_light}°C/${temperature_shadow}°C — ${hour_count_light}hL/${hour_count_shadow}hO`;
            }
          } catch {}

          await this.loadAndUpdateIndicators(t);

          return t;
        }));

        this.dataSource.data = mappedTests.sort((a, b) =>
          new Date(b.meta_create_date).getTime() - new Date(a.meta_create_date).getTime()
        );
      },
      error: (err) => {
        console.error("❌ Erreur lors du chargement des tests :", err);
        this.dataSource.data = [];
      }
    });
  }

  async loadAndUpdateIndicators(test: any): Promise<void> {
    try {
      const response = await this.api.getGerminationPercent(test.id_test).toPromise();
      const percent = response?.percent ?? null;

      if (percent !== null) {
        test.germination_rate = percent;

        await this.api.updateTestIndicators(test.id_test, {
          percent,
          delay: null,
          period: null
        }).toPromise();
      }
    } catch (error) {
      console.error(`Erreur lors du calcul ou de la mise à jour du % pour test ${test.id_test}`, error);
    }
  }

  onChangePreTreatment(element: any, value: boolean): void {
    this.api.updateTestPreTreatment(element.id_test, value).subscribe({
      next: () => {
        element.pre_treatment = value;
        console.log("✅ Prétraitement mis à jour :", value);
      },
      error: (err) => {
        console.error("❌ Erreur lors de la mise à jour du prétraitement :", err);
      }
    });
  }

  onAddAction(element: any): void {
    const idTest = element?.id_test ?? null;
    const idMaterial = element?.id_material ?? null;

    const dialogRef = this.dialog.open(ActionComponent, {
      width: '900px',
      height: '90vh',
      data: {
        id_material: idMaterial,
        id_test: idTest
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTests();
      }
    });
  }

  onEdit(element: any): void {
    const idTest = element.id_test;
    this.api.getTestWithLabelsById(idTest).subscribe({
      next: (testFull) => {
        const dialogRef = this.dialog.open(GerminationComponent, {
          width: '900px',
          height: '90vh',
          data: { test: testFull, edit: true }
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.loadTests();
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement du test complet :', err);
      }
    });
  }

  onDelete(element: any): void {
    const confirmed = confirm(`Voulez-vous vraiment supprimer le test "${element.code}" ?`);
    if (!confirmed) return;

    this.api.deleteTest(this.exsituFormService.idMaterial, element.id_test).subscribe({
      next: () => {
        this.loadTests();
      },
      error: (err) => {
        console.error("Erreur lors de la suppression :", err);
      }
    });
  }

  onCulture(element: any): void {

    const idTest =
      element?.id_test;

    const codeTest =
      element?.code || null;

    const idMaterial =
      this.exsituFormService.idMaterial;

    const idHarvest =
      this.exsituFormService.idHarvest;


    if (
      !idTest ||
      !idMaterial ||
      !idHarvest
    ) {

      console.error(
        'Impossible d’ouvrir Culture : identifiant du test, du matériel ou de la récolte manquant.'
      );

      return;
    }


    /*
    * Culture ouverte depuis
    * un Test de germination.
    *
    * id_material = matériel courant
    * id_sowing   = NULL
    * id_test     = test courant
    */
    this.exsituFormService
      .setCultureSourceFromTest(
        idTest,
        codeTest
      );


    this.exsituFormService.currentTab =
      'culture-table';


    this.router.navigate([
      '/conservation_flora_exsitu/form/harvest',
      idHarvest,
      'material',
      idMaterial,
      'test',
      idTest,
      'culture-table'
    ]);
  }


  onRowClick(row: any): void {
    const idTest = row.id_test;
    const idMaterial = this.exsituFormService.idMaterial;
    const idHarvest = this.exsituFormService.idHarvest;

    if (!idTest || !idMaterial || !idHarvest) {
      console.error("❌ ID manquant");
      return;
    }

    this.exsituFormService.setIdTest(idTest);

    this.router.navigate([
      '/conservation_flora_exsitu/form/harvest',
      idHarvest,
      'material',
      idMaterial,
      'germination-details',
      idTest
    ]);
  }

  addFicheGermination() {
    const dialogRef = this.dialog.open(GerminationComponent, {
      width: '900px',
      height: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newEntry: Germination = {
          numSemis: result.numeroSemis,
          numSemence: result.numeroSemence,
          dateDebut: result.dateDebut,
          dateFin: result.dateFin,
          replicate: 0,
          levage: 0
        };
        this.loadTests();
        this.dataSource.data = [...this.dataSource.data, newEntry];
      }
    });
  }
}