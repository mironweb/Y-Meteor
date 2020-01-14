import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
@Component({
  selector: 'dialog-component',
  template: `
    <system-lookup [lookupName]="lookupName" [documentId]="documentId" [data]="data" (onSelected)="onSelect($event)" [isModal]="isModal"></system-lookup>
  `
})

export class DialogComponent implements OnInit{
  lookupName: string;
  isModal: boolean = true;
  documentId: string
  data: any = {};
  length: number;

  constructor(public dialogRef: MatDialogRef<DialogComponent>){ }

  ngOnInit() {
  }
  onSelect(event) {
    this.dialogRef.close(event);
  }
}