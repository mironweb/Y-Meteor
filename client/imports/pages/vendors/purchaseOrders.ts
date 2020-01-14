import { Component, OnInit} from "@angular/core";
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'purchase-orders',
  template: `
    <mat-card>
      <div fxLayout="row" fxLayoutAlign="space-between center">
        <filterBox-component fxFlex='100' [lookupName]="'purchaseOrders'"></filterBox-component>
      </div>
      <section id="customerOrder">
        <system-lookup [lookupName]="'purchaseOrders'" [isModal]="false" (onSelected)="onSelect($event)" [documentId]="documentId"></system-lookup>
      </section>
    </mat-card>  
  `
})

export class PurchaseOrders implements OnInit {
  documentId: string;
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this.documentId = Meteor.userId();
  }

  onSelect(e) {
    if (e.name == 'onClick') {
      this.router.navigate([e.value['_id']], { relativeTo: this.activatedRoute});
    }
  }
}