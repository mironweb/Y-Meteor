import { Component } from '@angular/core';
import { HTTP } from 'meteor/http'
import {MatSnackBar} from '@angular/material';
import { MatDialog } from '@angular/material';
import { Router, ActivatedRoute } from '@angular/router';
import { MeteorObservable } from "meteor-rxjs";

@Component({
  selector: 'customers-quote',
  templateUrl: 'customers-quotes.page.html',
  styleUrls: ['customers-quotes.page.scss']
})

export class CustomersQuotesPage {

  constructor(public dialog: MatDialog, public snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute) {
  }
  filterConditions: any;
  documentId: string;
  data: any = {};

  ngOnInit() {
    this.documentId = Meteor.userId();
    let sub = MeteorObservable.call('returnUser', Meteor.userId()).subscribe(user => {
      this.data.userIds = user["manages"];
      this.data.userIds.push(this.documentId);
    });
  }

  returnToOldApp(action) {
    window.location.href = 'https://app.yibas.com/createQuote';
  }

  select(event){
    this.router.navigate(['customers/quotes/' + event.value['_id']]);
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