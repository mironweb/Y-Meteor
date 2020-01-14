import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router} from "@angular/router";
import {MeteorObservable} from "meteor-rxjs";

@Component({
  selector: 'developer-synctool',
  template: `
    <div>
      <table>
        <tr>
          <th>
            check
          </th>
          <th>
            Collections
          </th>
        </tr>
        <tr *ngFor="let row of rows">
          <td>
            <mat-checkbox color="primary" [(ngModel)]="row.check"></mat-checkbox>
          </td>
          <td>
            {{row.collectionName}}
          </td>
        </tr>
      </table>
      <div *ngIf="!isSyncing">
        <button color="primary" mat-raised-button (click)="sync()">
          Sync
        </button>
      </div>
      <div *ngIf="isSyncing">
        <mat-progress-bar mode="buffer" color="primary" [value]="progressPercentage"></mat-progress-bar>
        {{syncText}}
      </div>
    </div>
  `
})

export class DeveloperSynctoolPage implements OnInit{
  data: any={};
  name: string = '';
  email: any = {};
  start: boolean = false;
  status: string = '';
  alert: any = {};
  rows:any = [];

  progressPercentage = 0;
  isSyncing = false;
  syncText = 'Please wait......';
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}


  ngOnInit() {
    this.init();
  }

  init() {
    this.progressPercentage = 0;
    this.syncText = 'Please wait....';

    this.rows = [
      {
        check: false,
        collectionName: "categories"
      },
      {
        check: false,
        collectionName: "customerBranches"
      },
      {
        check: false,
        collectionName: "customerContracts"
      },
      {
        check: false,
        collectionName: "customerInvoices"
      },
      {
        check: false,
        collectionName: "customerMeetings"
      },
      {
        check: false,
        collectionName: "customerOrders"
      },
      {
        check: false,
        collectionName: "customerQuotes"
      },
      {
        check: false,
        collectionName: "customerShipments"
      },
      {
        check: false,
        collectionName: "customers"
      },
      {
        check: false,
        collectionName: "customerPendingData"
      },
      {
        check: false,
        collectionName: "ledgerAccounts"
      },
      {
        check: false,
        collectionName: "ledgerTransactions"
      },
      {
        check: false,
        collectionName: "customerContracts"
      },
      {
        check: false,
        collectionName: "products"
      },
      {
        check: false,
        collectionName: "productionOrders"
      },
      {
        check: false,
        collectionName: "productionRuns"
      },
      {
        check: false,
        collectionName: "userGroups"
      },
      {
        check: false,
        collectionName: "systemPermissions"
      },
      // {
      //   check: false,
      //   collectionName: "users"
      // },
      {
        check: false,
        collectionName: "vendorOrders"
      },
      {
        check: false,
        collectionName: "vendors"
      },
      {
        check: false,
        collectionName: "warehouseBins"
      },
      {
        check: false,
        collectionName: "warehouses"
      },
    ];
  }

  sync() {
    this.isSyncing = true;
    const syncCollections = this.rows.filter(row => row.check);
    const collections = syncCollections.map(collection => collection.collectionName);

    let count = 0;
    let length = collections.length;
    Promise.all(collections.map((collectionName) => {
      return new Promise(resolve => {
        MeteorObservable.call('syncDatabase', collectionName).subscribe((res) => {
          if (res) {
            count++;
            this.progressPercentage = count/length * 100;
            resolve(true);
          } else {
            resolve(false);
          }
        });
      })
    })).then(res => {
      this.syncText = 'Done';
      setTimeout(() => {
        this.isSyncing = false;
        this.init();
      }, 3000);
    });
  }
}
