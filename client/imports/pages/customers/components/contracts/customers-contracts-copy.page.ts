import {Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import { MatDialog } from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { Subscription } from 'rxjs/Subscription';

import * as funcs from "../../../../../../both/functions/common";
import {SystemLogsService} from "../../../../services/SystemLogs.service";
import {Action} from "../../../../../../both/models/systemLog.model";
import {EventEmitterService} from "../../../../services";

@Component({
  selector: 'customers-contracts-copy',
  styleUrls: ["../customers.scss"],
  template: `    
    <mat-card>
      <div fxLayout="row" fxLayout.xs="column" fxLayoutAlign="space-between center" fxLayoutAlign.xs="space-between stretch"
           class="ph-24 selectorForm">
        <div fxFlex="100" fxFlex.xs="100" class="select-containter" (click)="showView('selectfromcustomer')">
          <label>FROM CUSTOMER</label>
          <mat-form-field class="full-width">
            <input matInput placeholder="Select From Customer" readonly aria-readonly [(ngModel)]="state.fromCustomerLabel">
          </mat-form-field>
        </div>
        <div fxFlex="4" fxFlex.xs="none">
        </div>
        <div fxFlex="100" fxFlex.xs="100" class="select-containter" (click)="showView('selecttocustomer')">
          <label>TO CUSTOMER</label>
          <mat-form-field class="full-width">
            <input matInput placeholder="Select To Customer" readonly aria-readonly [(ngModel)]="state.toCustomerLabel">
          </mat-form-field>
        </div>
      </div>
      <div class="ph-24">
        <mat-chip-list>
          <mat-chip *ngFor="let customer of state.toCustomersList"
                   selected="true"
                   fxLayout="row wrap" class="filter-tag">
            <div fxFlex="" class="filter-name cursor-pointer" (click)="navigateCategory(customer)">
              <span>{{customer.name}}</span>
            </div>
            <div class="float-right filter-icon cursor-pointer" fxFlex="30px">
              <div fxFlex="auto" class="filter-remove" (click)="removeFromToCustomersList(customer)">
                <mat-icon>clear</mat-icon>
              </div>
            </div>
          </mat-chip>
        </mat-chip-list>
      </div>
      <div>
        <div style="width: 200px">
          <mat-form-field>
            <input matInput placeholder="Increase price by %" type="number" [(ngModel)]="state.increasePercentage" (change)="onPercentageChange()">
          </mat-form-field>  
        </div>
        
        <div *ngIf="state.copyData.contractId">
          <system-lookup [isModal]="true" #copyContractLookup [lookupName]="'contractProductsCategories'" [config]="config" [(data)]="state.copyData"></system-lookup>
        </div>

      </div>

      <div class="m-10" *ngIf="state.toCustomersList.length > 0">
        <button mat-raised-button color="primary" [disabled]="isDisabled_copy" (click)="copy()">Copy</button>
      </div>
    </mat-card>
  `,
})

export class CustomersContractsCopyPage implements OnInit, OnDestroy {
  @ViewChild('copyContractLookup') copyContractLookup;

  @Input() state:any = {
    fromCustomer: {},
    fromCustomerLabel: '',
    toCustomerLabel: '',
    selectedToCustomer: {},
    toCustomersList: [],
    increasePercentage: 0,
    copyData: {
      contractId: ''
    }
  };
  @Output() onClick = new EventEmitter<any>();

  isDisabled_copy: boolean = false;
  config = {
    enableMultipleUsersUpdate: true
  };

  constructor(
    public snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private _service: NotificationsService,
    private logService: SystemLogsService
  ) {
    EventEmitterService.Events.emit({pageHeader: this.pageHeader});
  }
  filterConditions: any;

  pageHeader: string = 'Copy Customer Contracts';
  documentId: string;
  subscription: Subscription;


  ngOnInit() {

  }

  showView(view) {
    this.onClick.emit(view);
  }

  removeFromToCustomersList(customer) {
    this.state.toCustomersList = this.state.toCustomersList.filter(_customer => {
      if (_customer._id != customer._id) {
        return true;
      }
    });
    if (customer._id == this.state.selectedToCustomer._id) {
      this.state.selectedToCustomer = {};
      this.state.toCustomerLabel = '';
    }
  }

  async copy() {

    this.isDisabled_copy = true;
    let checkedRows = this.copyContractLookup._returnCheckedRows();
    let categoryIds = checkedRows.map(row => row._id);

    let action: Action = {
      collectionName: "COPY_CONTRACT",
      type: "COPY_PRESSED",
      url: window.location.pathname,
      createdAt: new Date(),
      log: "",
      documentId: this.state.copyData.contractId,
    };

    action.log = `
      Copy button is pressed ${categoryIds}
    `;
    this.logService._log$(action).subscribe();


    // find all products in this contract using product lines
    // update the price, and get all updated products array
    let updatedProducts:any = await funcs.getUpdatedContractProducts(
      this.state.copyData.contractId,
      categoryIds,
      1 + 0.01 * this.state.increasePercentage).catch(error => console.log(error));

    // replace toCustomers' products with updated products
    let numberOfFailUpdate = 0;
    await Promise.all(this.state.toCustomersList.map(async (customer) => {
      let contractId = await funcs.getContractIdByCustomerId(customer._id).catch(error => console.log(error));
      if (contractId) {
        let contractProducts:any = await funcs.getContractProductsById(contractId).catch(error => console.log(error));

        updatedProducts.forEach(updatedProduct => {
          let index = contractProducts.findIndex(product => product._id == updatedProduct._id);
          if (index > -1) {
            // replace
            if (contractProducts[index].price) {
              contractProducts[index].previousPrice = contractProducts[index].price;
            }
            contractProducts[index].price = new Decimal(updatedProduct.newPrice.toFixed(2));
            contractProducts[index].isSynced = false;

          } else {
            // insert
            contractProducts.push({
              _id: updatedProduct._id,
              price: new Decimal(updatedProduct.newPrice.toFixed(2)),
              createdAt: new Date(),
              createdUserId: Meteor.userId(),
              isSynced: false
            })
          }
        });
        let update = {
          $set: {
            products: contractProducts
          }
        };
        await funcs.update('customerContracts', {_id: contractId}, update).catch(error => console.log(error));

      } else {
        numberOfFailUpdate++;
      }
    })).catch(error => console.log(error));

    if (numberOfFailUpdate > 0) {
      this._service.error("Error", 'Failed');

    } else {
      this._service.success("Success", 'Copy customers contract complete');

    }


    this.copyContractLookup.reloadData('after copy');
    this.isDisabled_copy = false;
  }

  onPercentageChange() {
    let action: Action = {
      collectionName: "COPY_CONTRACT",
      type: "PERCENTAGE_CHANGE",
      url: window.location.pathname,
      createdAt: new Date(),
      log: "",
      documentId: this.state.copyData.contractId,
    };

    action.log = `
      Change percentage to  ${this.state.increasePercentage}
    `;
    this.logService._log$(action).subscribe();
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }
}
