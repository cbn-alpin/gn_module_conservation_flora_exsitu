import { Component, OnInit } from '@angular/core';
import { MaterialListService } from './material-list.service';
import { combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ExsituFormService } from '../../form/shared/exsitu-form.service';
import { MaterialFormService } from '../material-form/material-form.service';
import { ConfirmationDialog } from '@geonature_common/others/modal-confirmation/confirmation.dialog';
import { MatDialog } from '@angular/material/dialog';



@Component({
    selector: 'cs-material-list',
    templateUrl: './material-list.component.html',
    styleUrls: ['./material-list.component.css'],
})
export class MaterialListComponent implements OnInit {

    constructor(
        public materialListService: MaterialListService,
        private exsituFormService: ExsituFormService,
        private materialFormService: MaterialFormService,
        public dialog: MatDialog,
    ){

    }

    ngOnInit(): void {
        combineLatest(this.exsituFormService.exsituData, this.materialFormService.occurrence)
        .pipe(
            filter(
            ([exsituData, occurrence]: any) =>
                exsituData && exsituData.harvest_materials
            ),
            map(([exsituData, occurrence]: any) => {
            return exsituData.harvest_materials
                .filter((occ) => {
                console.log(occ);
                // Enlève l'occurrence en cours de modification de la liste affichée
                return occurrence !== null
                    ? occ.id_material !== occurrence.id_material
                    : true;
                });
            })
        )
        .subscribe((occurrences) => {
            this.materialListService.materials$.next(occurrences);
        });        
    }


    removeHtml(str: string | undefined): string {
        return str ? str.replace(/<[^>]*>/g, '') : ''; // Retourne une chaîne vide si str est undefined
    }
    
    materialTitle(material) {
        return this.removeHtml(material.code_material);
    }

    editOccurrence(occurrence) {
        this.materialFormService.occurrence.next(occurrence);
    }

    deleteOccurrence(occurrence) {
        //const message = `${this.translate.instant('Delete')} ${this.taxonTitle(occurrence)} ?`;
        const dialogRef = this.dialog.open(ConfirmationDialog, {
          width: '350px',
          position: { top: '5%' },
          data: { message: 'Supprimer?' },
        });
    
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.materialFormService.deleteOccurrence(occurrence);
          }
        });
      }

}
