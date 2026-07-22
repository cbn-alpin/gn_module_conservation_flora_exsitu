  
  import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit, ViewChild } from '@angular/core';
  import { MatTableDataSource } from '@angular/material/table';
  import { Router } from '@angular/router';
  import { MatDialog } from '@angular/material/dialog';
  import { SemisComponent } from '../semis/semis.component';
  import { ExsituFormService } from '../form/shared/exsitu-form.service';
  import { SemisService } from '../semis/semis.service';
  import { SemisTableService } from './semis-table.service';
  import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
  import { CommonService } from '@geonature_common/service/common.service';
  import { MatPaginator } from '@angular/material/paginator';

  export interface Semis {
    code: any;
    start_date: any;
    end_date: any;
    id_sowing_method: any;
    substrate: any;
    label_sowing?: any;
    label_substrate?: any;
  }
  
  @Component({
    selector: 'app-semis-table',
    templateUrl: './semis-table.component.html',
    styleUrls: ['./semis-table.component.scss']
  })
  export class SemisTableComponent implements OnInit, AfterViewInit {
    idMaterial: number | null = null;
    sowings:any;
    @Input() dataSource = new MatTableDataSource<Semis>();

    private paginatorRef!: MatPaginator;

    @ViewChild(MatPaginator)
    set paginator(paginator: MatPaginator) {
      if (paginator) {
        this.paginatorRef = paginator;
        this.syncPaginator();
      }
    }

    rowPerPage = 5;

    public allSowings: any[] = [];

    public semisCodeFilter = '';
    public semisStartDateFromFilter: Date | null = null;
    public semisMethodFilter: string | null = null;
    public semisSubstrateFilter: string | null = null;

    public semisMethodFilterOptions: string[] = [];
    public semisSubstrateFilterOptions: string[] = [];


    /*
    * Même ordre que dans la Fiche Semis.
    */
    private readonly semisMethodOrder = [
      'Individuel',
      'En poquets',
      'En ligne',
      'A la volée'
    ];

    private readonly semisSubstrateOrder = [
      'Terreau',
      'Tourbe',
      'Terre de bruyère',
      'Sable',
      'Perlite',
      'Vermiculite',
      'Sol prélevé in-situ',
      'Autre'
    ];

    @Output() view = new EventEmitter<Semis>();
    @Output() edit = new EventEmitter<Semis>();
    @Output() delete = new EventEmitter<Semis>();
  
    displayedColumns: string[] = [
      'code',
      'emergence_rate',
      'start_date',
      'end_date',
      'duration',
      'id_sowing_method',
      'substrate',
      'actions',
    ];

    public activeActionRowId: number | null = null;

    public setActiveActionRow(row: any): void {
      this.activeActionRowId = row.id_sowing;
    }

    public clearActiveActionRow(): void {
      this.activeActionRowId = null;
    }

    public isActionRowActive(row: any): boolean {
      return this.activeActionRowId === row.id_sowing;
    }

    public getEmergenceRateDisplay(element: any): string {
      const value = element?.emergence_rate_action;

      if (value === null || value === undefined || value === '') {
        return '-';
      }

      const rate = Number(value);

      if (Number.isNaN(rate)) {
        return '-';
      }

      const formattedRate = Number.isInteger(rate)
        ? String(rate)
        : rate.toFixed(1).replace('.', ',');

      return `${formattedRate} %`;
    }

    public getDurationInDays(startDate: any, endDate: any): string {
      if (!startDate || !endDate) {
        return '-';
      }
    
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return '-';
      }

      const diffMs = end.getTime() - start.getTime();

      if (diffMs < 0) {
        return '-';
      }

      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const dayLabel = diffDays === 1 ? 'jour' : 'jours';

      return `${diffDays} ${dayLabel}`;
  }


    public isStandardSowingCode(code: any): boolean {
      return typeof code === 'string' && /^S\d{4}_\d{4}$/.test(code);
    }
    
  constructor(
          public router: Router,
          private dialog: MatDialog,
          public exsituFormService: ExsituFormService,
          private semisService: SemisTableService,
          private dialogService: DialogService,
          private toast: CommonService,
      ){
      }

  private syncPaginator(): void {
    if (!this.paginatorRef) {
      return;
    }

    this.dataSource.paginator =
      this.paginatorRef;
  }

    ngOnInit(): void {
      this.idMaterial = this.exsituFormService.idMaterial;

    this.semisService.sowings$.subscribe((sowings) => {

      this.allSowings = sowings || [];

      console.log(
        'Liste complète des semis :',
        this.allSowings
      );

      this.applySemisFilters();

    });

      // ⬇️ Déclenche le chargement côté service
      this.semisService.loadSowings(this.idMaterial);
    }

    ngAfterViewInit(): void {
      this.syncPaginator();
    }

   /* =========================================================
      FILTRES DE LA LISTE DES SEMIS
      ========================================================= */

    private getSowingMethodFilterValue(
      sowing: any
    ): string {

      const value =
        sowing?.label_sowing ||
        sowing?.id_sowing_method?.label_default ||
        sowing?.id_sowing_method?.value ||
        '';

      return String(value).trim();
    }


    private getSowingSubstrateFilterValue(
      sowing: any
    ): string {

      const value =
        sowing?.label_substrate ||
        sowing?.substrate?.label_default ||
        sowing?.substrate?.value ||
        '';

      return String(value).trim();
    }


    private getSemisDateFilterKey(
      value: any
    ): string {

      if (!value) {
        return '';
      }

      /*
      * Date provenant directement de l'API.
      */
      if (typeof value === 'string') {

        const datePart =
          value.split('T')[0];

        if (
          /^\d{4}-\d{2}-\d{2}$/.test(
            datePart
          )
        ) {
          return datePart;
        }

      }


      const date =
        value instanceof Date
          ? value
          : new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return '';
      }


      const year =
        date.getFullYear();

      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, '0');

      const day =
        String(
          date.getDate()
        ).padStart(2, '0');


      return `${year}-${month}-${day}`;
    }


    private getUniqueValuesByOrder(
      values: string[],
      order: string[]
    ): string[] {

      const uniqueValues =
        Array.from(
          new Set(
            values.filter(
              value => !!value
            )
          )
        );


      const orderMap =
        new Map(
          order.map(
            (label, index) => [
              label,
              index
            ]
          )
        );


      return uniqueValues.sort(
        (a, b) => {

          const indexA =
            orderMap.has(a)
              ? orderMap.get(a)!
              : Number.MAX_SAFE_INTEGER;

          const indexB =
            orderMap.has(b)
              ? orderMap.get(b)!
              : Number.MAX_SAFE_INTEGER;


          if (indexA !== indexB) {
            return indexA - indexB;
          }


          /*
          * Une éventuelle valeur non prévue
          * est placée après les valeurs connues.
          */
          return a.localeCompare(
            b,
            'fr'
          );
        }
      );
    }


    /*
    * Applique uniquement les filtres communs :
    *
    * - Code
    * - Date "À partir du"
    *
    * Méthode et Substrat sont ensuite appliqués
    * séparément afin de rendre leurs listes
    * dynamiques entre elles.
    */
    private getSemisMatchingBaseFilters(): any[] {

      const normalizedCode =
        String(
          this.semisCodeFilter || ''
        )
          .trim()
          .toLowerCase();


      const selectedDateKey =
        this.getSemisDateFilterKey(
          this.semisStartDateFromFilter
        );


      return this.allSowings.filter(
        (sowing) => {

          const sowingCode =
            String(
              sowing?.code || ''
            )
              .trim()
              .toLowerCase();


          const sowingDateKey =
            this.getSemisDateFilterKey(
              sowing?.start_date
            );


          const matchesCode =
            !normalizedCode ||
            sowingCode.includes(
              normalizedCode
            );


          const matchesDate =
            !selectedDateKey ||
            (
              !!sowingDateKey &&
              sowingDateKey >=
                selectedDateKey
            );


          return (
            matchesCode &&
            matchesDate
          );

        }
      );
    }


    /*
    * Rend Méthode et Substrat dynamiques entre eux.
    *
    * Exemple :
    *
    * Méthode = Individuel
    *   ->
    * seuls les substrats réellement présents
    * pour cette méthode restent proposés.
    *
    * Substrat = Perlite
    *   ->
    * seules les méthodes réellement compatibles
    * restent proposées.
    */
    private updateSemisFilterOptions(
      baseSowings: any[]
    ): void {

      let selectedMethod =
        this.semisMethodFilter;

      let selectedSubstrate =
        this.semisSubstrateFilter;


      let methodOptions: string[] = [];
      let substrateOptions: string[] = [];


      /*
      * Deux passages permettent de remettre
      * automatiquement à null un filtre devenu
      * impossible après modification du Code
      * ou de la Date.
      */
      for (
        let pass = 0;
        pass < 2;
        pass++
      ) {

        const sowingsForMethods =
          baseSowings.filter(
            sowing =>
              !selectedSubstrate ||
              this.getSowingSubstrateFilterValue(
                sowing
              ) === selectedSubstrate
          );


        methodOptions =
          this.getUniqueValuesByOrder(

            sowingsForMethods.map(
              sowing =>
                this.getSowingMethodFilterValue(
                  sowing
                )
            ),

            this.semisMethodOrder

          );


        if (
          selectedMethod &&
          !methodOptions.includes(
            selectedMethod
          )
        ) {
          selectedMethod = null;
        }


        const sowingsForSubstrates =
          baseSowings.filter(
            sowing =>
              !selectedMethod ||
              this.getSowingMethodFilterValue(
                sowing
              ) === selectedMethod
          );


        substrateOptions =
          this.getUniqueValuesByOrder(

            sowingsForSubstrates.map(
              sowing =>
                this.getSowingSubstrateFilterValue(
                  sowing
                )
            ),

            this.semisSubstrateOrder

          );


        if (
          selectedSubstrate &&
          !substrateOptions.includes(
            selectedSubstrate
          )
        ) {
          selectedSubstrate = null;
        }

      }


      this.semisMethodFilter =
        selectedMethod;

      this.semisSubstrateFilter =
        selectedSubstrate;

      this.semisMethodFilterOptions =
        methodOptions;

      this.semisSubstrateFilterOptions =
        substrateOptions;
    }


    public applySemisFilters(): void {

      /*
      * 1. Code + Date
      */
      const baseSowings =
        this.getSemisMatchingBaseFilters();


      /*
      * 2. Mise à jour dynamique des options
      *    Méthode / Substrat.
      */
      this.updateSemisFilterOptions(
        baseSowings
      );


      /*
      * 3. Application finale
      *    Méthode + Substrat.
      */
      const filteredSowings =
        baseSowings.filter(
          sowing => {

            const method =
              this.getSowingMethodFilterValue(
                sowing
              );

            const substrate =
              this.getSowingSubstrateFilterValue(
                sowing
              );


            const matchesMethod =
              !this.semisMethodFilter ||
              method ===
                this.semisMethodFilter;


            const matchesSubstrate =
              !this.semisSubstrateFilter ||
              substrate ===
                this.semisSubstrateFilter;


            return (
              matchesMethod &&
              matchesSubstrate
            );

          }
        );


      this.dataSource.data =
        filteredSowings;


      /*
      * Retour page 1 après chaque changement
      * de filtre.
      */
      setTimeout(() => {

        this.syncPaginator();

        if (this.paginatorRef) {
          this.paginatorRef.firstPage();
        }

      });
    }


    public onSemisCodeFilterChange(
      value: string
    ): void {

      this.semisCodeFilter =
        value || '';

      this.applySemisFilters();
    }


    public onSemisStartDateFromFilterChange(
      value: Date | null
    ): void {

      this.semisStartDateFromFilter =
        value;

      this.applySemisFilters();
    }


    public onSemisMethodFilterChange(
      value: string | null
    ): void {

      this.semisMethodFilter =
        value;

      this.applySemisFilters();
    }


    public onSemisSubstrateFilterChange(
      value: string | null
    ): void {

      this.semisSubstrateFilter =
        value;

      this.applySemisFilters();
    }


    public resetSemisFilters(): void {

      this.semisCodeFilter = '';

      this.semisStartDateFromFilter =
        null;

      this.semisMethodFilter =
        null;

      this.semisSubstrateFilter =
        null;

      this.applySemisFilters();
    }
    
    onView() {
      // this.view.emit(element);
      console.log("view")
    }
  
    onEdit(element: any) {
      const normalizedSemis = {
        ...element,
        id_substrate: element?.substrate?.id_nomenclature ?? element?.id_substrate ?? null,
        container: element?.container?.value ?? element?.container ?? '',
        start_date: element?.start_date ? element.start_date.slice(0, 10) : '',
        end_date: element?.end_date ? element.end_date.slice(0, 10) : ''
      };

      const dialogRef = this.dialog.open(SemisComponent, {
        width: '900px',
        height: '90vh',
        disableClose: true,
        data: {
          edit: true,
          test: normalizedSemis
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && this.idMaterial) {
          this.semisService.loadSowings(this.idMaterial);
        }
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
  
    onDelete(element: any) {
      if (!this.idMaterial || !element?.id_sowing) {
        return;
      }

      const currentCode = element?.code || '';

      this.semisService.getActionsBySowing(element.id_sowing).subscribe({
        next: (actions) => {
          const actionCount = actions?.length || 0;

          if (actionCount > 0) {
            const actionLabel = actionCount > 1 ? 'actions liées' : 'action liée';

            this.toast.translateToaster(
              'warning',
              `Suppression impossible : le semis ${this.toBoldText(currentCode)} contient ${this.toBoldText(String(actionCount))} ${actionLabel}. Supprimez d'abord les actions liées à ce semis.`
            );

            return;
          }

          this.dialogService
            .confirmDialog({ message: 'Étes vous certain de vouloir supprimer ce semis ?' })
            .subscribe((yes) => {
              if (!yes) {
                return;
              }

              this.semisService.deleteSowing(this.idMaterial!, element.id_sowing).subscribe({
                next: () => {
                  this.toast.translateToaster(
                    'error',
                    `Semis ${this.toBoldText(currentCode)} supprimé avec succès`
                  );

                  this.semisService.loadSowings(this.idMaterial!);
                },
                error: (err) => {
                  const linkedActionCount = err?.error?.action_count;

                  if (err?.status === 409 && linkedActionCount) {
                    const actionLabel = linkedActionCount > 1 ? 'actions liées' : 'action liée';

                    this.toast.translateToaster(
                      'warning',
                      `Suppression impossible : le semis ${this.toBoldText(currentCode)} contient ${this.toBoldText(String(linkedActionCount))} ${actionLabel}. Supprimez d'abord les actions liées à ce semis.`
                    );

                    return;
                  }

                  console.error('Erreur lors de la suppression du semis :', err);
                }
              });
            });
        },
        error: (err) => {
          console.error('Erreur lors de la vérification des actions liées au semis :', err);
        }
      });
    }

    onCulture(element: any): void {

      const idSowing =
        element?.id_sowing;

      const codeSowing =
        element?.code || null;

      const idMaterial =
        this.exsituFormService.idMaterial;

      const idHarvest =
        this.exsituFormService.idHarvest;


      if (
        !idSowing ||
        !idMaterial ||
        !idHarvest
      ) {

        console.error(
          'Impossible d’ouvrir Culture : identifiant du semis, du matériel ou de la récolte manquant.'
        );

        return;
      }


      /*
      * Culture ouverte depuis un Semis.
      *
      * Le matériel reste le matériel courant.
      * Le Semis cliqué devient l'origine directe.
      * Aucun Test de germination n'est associé.
      */
      this.exsituFormService
        .setCultureSourceFromSowing(
          idSowing,
          codeSowing
        );


      this.exsituFormService.currentTab =
        'culture-table';


      this.router.navigate([
        '/conservation_flora_exsitu/form/harvest',
        idHarvest,
        'material',
        idMaterial,
        'sowing',
        idSowing,
        'culture-table'
      ]);
    }

    onRowClick(row: any): void {
      const idSowing = row?.id_sowing;
      const idMaterial = this.exsituFormService.idMaterial;
      const idHarvest = this.exsituFormService.idHarvest;

      if (!idSowing || !idMaterial || !idHarvest) {
        return;
      }

      this.router.navigate([
        '/conservation_flora_exsitu/form/harvest',
        idHarvest,
        'material',
        idMaterial,
        'semis-details',
        idSowing
      ]);
    }

    onDetails(element: any): void {
      const idSowing = element?.id_sowing;
      const idMaterial = this.exsituFormService.idMaterial;
      const idHarvest = this.exsituFormService.idHarvest;

      if (!idSowing || !idMaterial || !idHarvest) {
        return;
      }

      this.router.navigate([
        '/conservation_flora_exsitu/form/harvest',
        idHarvest,
        'material',
        idMaterial,
        'semis-details',
        idSowing
      ]);
    }
    
     addFicheSemis() {
          const dialogRef = this.dialog.open(SemisComponent, {
            width: '900px',
            height: '90vh',
            disableClose: true
          });
        
          dialogRef.afterClosed().subscribe(result => {
            if (result && this.idMaterial) {
              this.semisService.loadSowings(this.idMaterial); // SLIM ERROR : recharger la liste après création
            }
          });
        }
  
  }