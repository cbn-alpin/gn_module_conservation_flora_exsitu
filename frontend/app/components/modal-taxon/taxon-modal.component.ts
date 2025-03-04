import { Component, Inject , OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonService } from '@geonature_common/service/common.service';
import { DataService } from '../../services/data.service';


@Component({
  selector: 'app-taxon-modal',
  templateUrl: './taxon-modal.component.html',
  styleUrls: ['./taxon-modal.component.css']
})
export class TaxonModalComponent implements OnInit {
    public taxonForm: FormGroup;
    isLoading = false; 
    constructor(
        private _commonService: CommonService,
        private formBuilder: FormBuilder,
        private api: DataService,
        public dialogRef: MatDialogRef<TaxonModalComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { id: number, code_material: string }
    ) {}

    ngOnInit(): void {
        this.taxonForm = this.formBuilder.group({
            cd_nom: [null, Validators.required],
          });
    }

    submetData(){
        const finalForm = JSON.parse(JSON.stringify(this.taxonForm.value));
        let cd_nom = finalForm.cd_nom.cd_nom;
        this.isLoading = true;
        this.api.addTaxonToMaterial(this.data.id, cd_nom)
        .subscribe({
            next: () => {
              this._commonService.translateToaster('info', 'Taxon ajouté avec succès !');
              this.isLoading = false;
              this.dialogRef.close(true);
            },
            error: (err) => {
                this.isLoading = false;
                this._commonService.translateToaster('error', "Erreur lors de l'ajout du taxon.");
                console.error(err);
            },
            complete: () => this.isLoading = false
          });

    }
    
    
    close(): void {
        this.dialogRef.close();
    }
}