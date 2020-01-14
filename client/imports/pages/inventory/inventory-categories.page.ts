import { Component, OnInit, Input } from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'inventory-categories',
  template: `
    <mat-card>
      <div>
        <system-lookup [lookupName]="'categories'" (onSelected)="onSelect($event)" [(data)]="data"></system-lookup>
      </div>
    </mat-card>
  `,
})

export class InventoryCategoriesPage implements OnInit{

  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
  }

  onSelect(event) {
    this.router.navigate(['./inventory/categories/' + event.value._id]);
  }

}
