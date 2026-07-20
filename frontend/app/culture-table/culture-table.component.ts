import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild
} from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { CultureComponent } from '../culture/culture.component';
import { CultureService } from '../culture/culture.service';

import { ExsituFormService } from '../form/shared/exsitu-form.service';
import { CultureTableService } from './culture-table.service';
import { DialogService } from '../components/confirm-dialog/confirm-dialog.service';
import { CommonService } from '@geonature_common/service/common.service';

export interface Culture {
  id_culture: number;
  code_culture: string;

  id_material: number;
  id_sowing: number | null;
  id_test: number | null;
  id_actor: number | null;

  date_start: string;
  date_end: string | null;

  remarks: string | null;
  additional_data: any;

  meta_create_by: number;
  meta_create_date: string;
  meta_update_by: number | null;
  meta_update_date: string | null;

  is_active?: boolean;

  actor_label?: string | null;
  code_sowing?: string | null;
  code_test?: string | null;
  source_type?: 'sowing' | 'test' | null;
  source_code?: string | null;
}

@Component({
  selector: 'app-culture-table',
  templateUrl: './culture-table.component.html',
  styleUrls: ['./culture-table.component.scss']
})
export class CultureTableComponent implements OnInit, AfterViewInit {

  idMaterial: number | null = null;

  dataSource = new MatTableDataSource<Culture>();

  rowPerPage = 5;

  displayedColumns: string[] = [
    'code_culture',
    'source',
    'actor',
    'date_start',
    'date_end',
    'status',
    'actions'
  ];

  private paginatorRef!: MatPaginator;

  @ViewChild(MatPaginator)
  set paginator(paginator: MatPaginator) {
    if (paginator) {
      this.paginatorRef = paginator;
      this.syncPaginator();
    }
  }

  constructor(
    public exsituFormService: ExsituFormService,
    private cultureTableService: CultureTableService,
    private cultureService: CultureService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private toast: CommonService
  ) {}

  ngOnInit(): void {
    this.idMaterial = this.exsituFormService.idMaterial;

    this.cultureTableService.cultures$.subscribe((cultures) => {
      this.dataSource.data = cultures || [];

      setTimeout(() => {
        this.syncPaginator();

        if (this.paginatorRef) {
          this.paginatorRef.firstPage();
        }
      });
    });

    if (this.idMaterial) {
      this.cultureTableService.loadCultures(this.idMaterial);
    }
  }

  ngAfterViewInit(): void {
    this.syncPaginator();
  }

  private syncPaginator(): void {
    if (!this.paginatorRef) {
      return;
    }

    this.dataSource.paginator = this.paginatorRef;
    this.paginatorRef.length = this.dataSource.data.length;
  }

  addFicheCulture(): void {
    const dialogRef = this.dialog.open(
      CultureComponent,
      {
        width: '900px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        disableClose: true
      }
    );

    dialogRef.afterClosed().subscribe(
      (result) => {
        if (result && this.idMaterial) {
          this.cultureTableService.loadCultures(
            this.idMaterial
          );
        }
      }
    );
  }

  onDelete(element: Culture): void {
    if (!this.idMaterial || !element?.id_culture) {
      return;
    }

    const cultureCode = element.code_culture || '';

    this.dialogService
      .confirmDialog({
        message: 'Étes vous certain de vouloir supprimer cette culture ?'
      })
      .subscribe((yes) => {
        if (!yes) {
          return;
        }

        this.cultureTableService
          .deleteCulture(
            this.idMaterial!,
            element.id_culture
          )
          .subscribe({
            next: () => {
              this.toast.translateToaster(
                'error',
                cultureCode
                  ? `Culture ${cultureCode} supprimée avec succès`
                  : 'Culture supprimée avec succès'
              );

              this.cultureTableService.loadCultures(
                this.idMaterial!
              );
            },

            error: (err) => {
              console.error(
                'Erreur lors de la suppression de la culture :',
                err
              );

              this.toast.translateToaster(
                'error',
                err?.error?.error ||
                  'Erreur lors de la suppression de la culture'
              );
            }
          });
      });
  }

  onEdit(element: Culture): void {
    if (!element?.id_culture) {
      return;
    }

    this.cultureService
      .getCultureById(element.id_culture)
      .subscribe({
        next: (cultureFull) => {

          const dialogRef = this.dialog.open(
            CultureComponent,
            {
              width: '900px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              disableClose: true,

              data: {
                edit: true,
                culture: cultureFull
              }
            }
          );

          dialogRef.afterClosed().subscribe(
            (result) => {
              if (result && this.idMaterial) {
                this.cultureTableService.loadCultures(
                  this.idMaterial
                );
              }
            }
          );
        },

        error: (err) => {
          console.error(
            'Erreur lors du chargement de la culture :',
            err
          );
        }
      });
  }

  getSourceLabel(culture: Culture): string {
    if (culture.source_code) {
      return culture.source_code;
    }

    if (culture.id_sowing) {
      return culture.code_sowing || `Semis n°${culture.id_sowing}`;
    }

    if (culture.id_test) {
      return culture.code_test || `Test n°${culture.id_test}`;
    }

    return '-';
  }

  getStatusLabel(culture: Culture): string {
    return culture.is_active || !culture.date_end
      ? 'Culture active'
      : 'Culture terminée';
  }

  isStandardCultureCode(code: any): boolean {
    return (
      typeof code === 'string' &&
      /^C\d{4}_\d{4}$/.test(code)
    );
  }
}