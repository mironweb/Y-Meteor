import {Component, OnInit} from '@angular/core';

@Component({
  selector: `admin-logs`,
  template: `
    <section class="box">
      <div>
        <filterBox-component (filter)="getFilterConditions($event)" [lookupName]="'systemLogs'"></filterBox-component>
      </div>
      <div [hidden]="hideTable">
        <section id="customerQuoteForm" class="container">
          <system-lookup [lookupName]="'systemLogs'" [(data)]="data" [(filterConditions)]="filterConditions"
                         (onEvent)="onEvent($event)"></system-lookup>
        </section>
      </div>
    </section>
  `
})

export class AdminLogsPage implements OnInit {
  filterConditions: any;
  email: string;
  hideTable: boolean = false;

  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };

  consturctor() { }

  ngOnInit() {

  }

  getFilterConditions(action) {
    this.reducers(action);
  }

  reducers(action) {
    switch(action.type) {
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

  onEvent(event) {
    const row = event.value;
    const arr = [
      "Field Path",
      "Value",
      "Previous Path"
    ];
    const activities = [row.fieldPath, row.value, row.previousValue];
    row.expandableData = [...arr, ...activities];
  }
}