  
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

    this.dataSource.paginator = this.paginatorRef;
    this.paginatorRef.length = this.dataSource.data.length;
  }

    ngOnInit(): void {
      this.idMaterial = this.exsituFormService.idMaterial;
    this.semisService.sowings$.subscribe((sowings) => {
      this.dataSource.data = sowings || [];
      console.log(this.dataSource.data);

      setTimeout(() => {
        this.syncPaginator();

        if (this.paginatorRef) {
          this.paginatorRef.firstPage();
        }
      });
    });

      // ⬇️ Déclenche le chargement côté service
      this.semisService.loadSowings(this.idMaterial);
    }

    ngAfterViewInit(): void {
      this.syncPaginator();
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