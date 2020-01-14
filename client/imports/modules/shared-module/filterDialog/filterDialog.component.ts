import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
  selector: 'filterDialog-component',
  templateUrl: 'filterDialog.component.html'
})

export class FilterDialogComponent implements OnInit{

  selections = [
    {
      value: {
        $in: [null, false]
      },
      label: 'Active'
    },
    {
      value: true,
      label: 'Removed'
    }
  ];

  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };

  constructor(public dialogRef: MatDialogRef<FilterDialogComponent>){ }

  ngOnInit() {

  }
  // onSelect(event) {
  // }

  onChange(event) {
    this.dialogRef.close(event);
  }
}
