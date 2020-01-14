import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'developer-parent-tenants',
  template: `
    <mat-card class="box">
      <div>
        <button mat-raised-button color="primary" routerLink="create">Add</button>
      </div>
      <br>
  
      <div [hidden]="hideTable">
        <system-lookup [lookupName]="'parentTenants'" (onSelected)="returnResult($event)"></system-lookup>
      </div>
    </mat-card>
  `,
})

export class DeveloperParentTenantsPage implements OnInit{

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}
  hideTable = false;

  ngOnInit() {

  }

  returnResult(e) {

  }

  startCron() {
    Meteor.call('startCron');
  }

  stopCron() {
    Meteor.call('stopCron');

  }
}
