import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {MatDialog} from '@angular/material';
import {NotificationsService} from 'angular2-notifications';
import { FormGroup, FormControl} from '@angular/forms';

import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';

import {MeteorObservable} from "meteor-rxjs";

@Component({
  selector: 'developer-alerts',
  template: `
    <mat-card class="box">
      <div>
        <!--<button mat-raised-button color="primary" (click)="openDialog()">Filter</button>-->
        <button mat-raised-button color="primary" (click)="addButton()">Add Alerts</button>
      </div>
      <div [hidden]="hideTable">
        <system-lookup [lookupName]="'systemAlerts'" (onSelected)="onSelect($event)" [(data)]="data"></system-lookup>
      </div>
      <div [hidden]="hideAddForm">
        <form [formGroup]="newAlert" (submit)="addAlert()">
          <mat-form-field>
            <input matInput formControlName="name" type="text" placeholder="Name" required>
          </mat-form-field>
          <small style="color: red" [hidden]="newAlert.controls.name.valid || newAlert.controls.name.pristine">
            Name is required
          </small>
          <button mat-raised-button color="warn" type="submit">Add Alert</button>
        </form>
      </div>
    </mat-card>
  `
})

export class DeveloperAlertsPage implements OnInit{
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };

  hideTable: boolean = false;
  hideAddForm: boolean = true;

  newAlert: FormGroup;



  constructor(public dialog: MatDialog, private router: Router, private _service: NotificationsService) {}


  ngOnInit() {
    this.newAlert = new FormGroup({
      name: new FormControl('')
    })

  }

  addAlert() {
    MeteorObservable.autorun().subscribe(() => {
      if (Session.get('parentTenantId')) {
        let query = {
          name: this.newAlert.value.name,
          parentTenantId: Session.get('parentTenantId')
        };

        MeteorObservable.call('insert', 'systemAlerts', query).subscribe((res:any) => {

          this._service.success(
            "System Alert Added",
            this.newAlert.value.name,
            {
              timeOut: 5000,
              showProgressBar: true,
              pauseOnHover: false,
              clickToClose: false,
              maxLength: 10
            }
          );

          this.router.navigate(['/admin/alerts', res]).catch(error => console.log(error));
        });

      }
    });

    this.hideAddForm = true;
    this.hideTable = false;
  }

  openDialog() {
    if (this.hideTable === false) {
      let dialogRef = this.dialog.open(FilterDialogComponent);
      dialogRef.afterClosed().subscribe(event => {
        let result = true;
        if (event === true) {
          result = false;
        }
        this.data = {
          value : event,
          hidden: result
        }
      });
    }

    this.hideAddForm = true;
    this.hideTable = false;
  }

  addButton() {
    this.hideAddForm = false;
    this.hideTable = true;
  }

  onSelect(event) {
    // this.router.navigate(['/admin/alert/' + event._id]);
    this.router.navigate(['/admin/alerts',  event._id]).catch(error => console.log(error));
  }
}
