import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogData } from './confirm-dialog.model';

const defaultsDialogData: ConfirmDialogData = {
  title: "Confirmation",
  message: "",
  confirmCaption: "Oui",
  cancelCaption: "Non",
};

@Component({
  selector: 'cs-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})
export class ConfirmDialogComponent implements OnInit {
  public dialogData: ConfirmDialogData;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    this.dialogData = { ...defaultsDialogData, ...data };
  }

  ngOnInit(): void {}
}