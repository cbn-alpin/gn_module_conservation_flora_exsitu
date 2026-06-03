  
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
    @ViewChild(MatPaginator) paginator!: MatPaginator;
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

    public getEmergenceRateDisplay(_element: any): string {
      return '-';
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

    ngOnInit(): void {
      this.idMaterial = this.exsituFormService.idMaterial;
    this.semisService.sowings$.subscribe((sowings) => {
      this.dataSource.data = sowings;
      console.log(this.dataSource.data)

      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
        this.paginator.firstPage();
      }
    });

      // ⬇️ Déclenche le chargement côté service
      this.semisService.loadSowings(this.idMaterial);
    }

    ngAfterViewInit(): void {
      this.dataSource.paginator = this.paginator;
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
  
    onDelete(element: any) {
      if (!this.idMaterial || !element?.id_sowing) {
        return;
      }

      this.dialogService
        .confirmDialog({ message: 'Étes vous certain de vouloir supprimer ce semis ?' })
        .subscribe((yes) => {
          if (yes) {
            this.semisService.deleteSowing(this.idMaterial!, element.id_sowing).subscribe({
              next: () => {
                const currentCode = element?.code || '';
                this.toast.translateToaster(
                  'error',
                  `Semis ${this.toBoldText(currentCode)} supprimé avec succès`
                );
                this.semisService.loadSowings(this.idMaterial!);
              },
              error: (err) => {
                console.error('Erreur lors de la suppression du semis :', err);
              }
            });
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