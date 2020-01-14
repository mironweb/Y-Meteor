import { Component } from '@angular/core';

@Component({
  selector: 'select-customer',
  template: `
    <button mat-icon-button style='float: right;'>
      <mat-icon class="mat-24">close</mat-icon>
    </button>
    <system-lookup [isModal]="true" lookupName="selectCustomer"></system-lookup>
  `
})

export class SelectCustomerComponent {
  subMenus = [];
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };
  constructor() {}

  onSelect(event) {
  }
}
