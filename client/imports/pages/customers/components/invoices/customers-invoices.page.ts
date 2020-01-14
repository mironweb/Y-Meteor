import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'customers-invoice',
  templateUrl: 'customers-invoices.page.html',
  styleUrls: ['customers-invoices.page.scss'],
})

export class CustomersInvoicesPage {

  constructor(public dialog: MatDialog, public snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute) {
  }
  filterConditions: any;
  documentId: string;

  ngOnInit() {
    this.documentId = Meteor.userId();
  }

  select(event){
    this.router.navigate(['customers/invoices/' + event.value['_id']]);
  }

  getFilterConditions(action) {
    this.reducers(action);
  }

  reducers(action) {
    switch (action.type) {
      case 'UPDATE_FILTERCONDITIONS':
        this.filterConditions = action.value;
        return;
      case 'ADD_FILTER':
        this.filterConditions = action.value;
        return;
      default:
        return;
    }
  }

}
