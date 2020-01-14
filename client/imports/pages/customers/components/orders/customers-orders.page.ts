import { Component } from '@angular/core';
import {MatSnackBar} from '@angular/material';
import { MatDialog, } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'customers-order',
  templateUrl: "customers-orders.page.html",
  styleUrls: ['customers-orders.page.scss'],
})

export class CustomersOrdersPage {

  constructor(public dialog: MatDialog, public snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute) {
  }
  filterConditions: any;
  documentId: string;

  ngOnInit() {
    this.documentId = Meteor.userId();
  }

  select(event){
    this.router.navigate(['customers/orders/' + event.value['_id']]);
    // window.location.href = 'https://app.yibas.com/customerQuote/' + event._id;
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
