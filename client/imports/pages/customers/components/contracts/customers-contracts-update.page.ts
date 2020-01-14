import {Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, OnChanges} from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";

import * as funcs from "../../../../../../both/functions/common";
import {CustomersService} from '../../customers.service';
import {NotificationsService} from "angular2-notifications";
import {EventEmitterService} from "../../../../services";
import {Random} from "meteor/random";
import {SystemLogsService} from "../../../../services/SystemLogs.service";

@Component({
  selector: 'customers-contracts-update',
  styleUrls: ["../customers.scss"],
  template: `
    <mat-card>
      <div fxLayout="row" fxLayout.xs="column" fxLayoutAlign="space-between center" fxLayoutAlign.xs="space-between stretch"
           class="ph-24 selectorForm">
        <div fxFlex="50" fxFlex.xs="100" class="select-containter" (click)="showView('selectUpdatedCustomer')">
          <label>SELECT CUSTOMER</label>
          <mat-form-field class="full-width">
            <input matInput [(placeholder)]="placeholder" readonly aria-readonly [(ngModel)]="toCustomerLabel">
          </mat-form-field>
        </div>
        <div fxFlex="50" fxFlex.xs="100" style="padding-left: 20px">
          <mat-slide-toggle           
              [(checked)]="isSlideChecked"
              color="primary"
              (change)="onSlideChange($event)"
          >Select All Customers</mat-slide-toggle>
        </div>
      </div>
      <div class="ph-24">
        <mat-chip-list *ngIf="updatedCustomers.length > 0">
          <mat-chip *ngFor="let customer of updatedCustomers"
                   selected="true"
                   fxLayout="row wrap" class="filter-tag">
            <div fxFlex="" class="filter-name cursor-pointer" (click)="navigateCategory(customer)">
              <span>{{customer.name}}</span>
            </div>
            <div class="float-right filter-icon cursor-pointer" fxFlex="30px">
              <div fxFlex="auto" class="filter-remove" (click)="removeUpdatedCustomers(customer)">
                <mat-icon>clear</mat-icon>
              </div>
            </div>
          </mat-chip>
        </mat-chip-list>

        <mat-chip-list *ngIf="excludedCustomers.length > 0">
          <mat-chip *ngFor="let customer of excludedCustomers"
                   selected="true"
                   fxLayout="row wrap" class="filter-tag">
            <div fxFlex="" class="filter-name cursor-pointer" (click)="navigateCategory(customer)">
              <span>Except:{{customer.name}}</span>
            </div>
            <div class="float-right filter-icon cursor-pointer" fxFlex="30px">
              <div fxFlex="auto" class="filter-remove" (click)="removeExcludedCustomers(customer)">
                <mat-icon>clear</mat-icon>
              </div>
            </div>
          </mat-chip>
        </mat-chip-list>
      </div>
      <div>
        <mat-form-field style="width: 200px">
          <input matInput placeholder="Increase price by %" min="0" type="number" [(ngModel)]="increasePercentage">
        </mat-form-field>
        <mat-checkbox [disabled]='increasePercentage != 0' [(ngModel)]="removeCategories">Remove Categories</mat-checkbox>
        <br>
        <system-lookup [isModal]="true" #updateContractLookup [lookupName]="'checkProductsCategories'" [config]="config" (emitDataChange)="emitEvnet($event)"></system-lookup>
      </div>

      <div class="m-10" *ngIf="isUpdateButtonShown">
        <button mat-raised-button color="primary" (click)="update()">Update</button>
      </div>

      <div *ngIf="isSpinShown">
        <mat-progress-bar mode="determinate" [value]="progressPercentage"></mat-progress-bar>
        Please Wait......
      </div>
    </mat-card>
  `,
})

export class CustomersContractsUpdatePage implements OnInit, OnDestroy {
  @ViewChild('updateContractLookup') updateContractLookup;

  @Input() props:any;
  @Output() onClick = new EventEmitter<any>();

  toCustomerLabel = '';
  // properties
  private _progressPercentage = 0;
  get progressPercentage() {
    return this._progressPercentage;
  }
  set progressPercentage(value) {
    this._progressPercentage = value;
    this._state.progressPercentage = value;
  }
  private _isSpinShown:boolean = false;
  get isSpinShown() {
    return this._isSpinShown;
  }
  set isSpinShown(value) {
    this._isSpinShown = value;
    this._state.increasePercentage = value;
  }

  private _isUpdateButtonShown:boolean = false;
  get isUpdateButtonShown() {
    return this._isUpdateButtonShown;
  }
  set isUpdateButtonShown(value) {
    this._isUpdateButtonShown = value;
    this._state.increasePercentage = value;
  }

  private _increasePercentage:number = CustomersService.increasePercentage;
  get increasePercentage() {
    return this._increasePercentage;
  }
  set increasePercentage(number:number) {
    this._increasePercentage = number;
    this._state.increasePercentage = number;
    CustomersService.increasePercentage = number;
  }

  private _removeCategories: boolean = false;
  get removeCategories() {
    return this._removeCategories;
  }
  set removeCategories(value) {
    this._removeCategories = value;
  }

  private _updatedCustomers:Array<Object> = [];
  get updatedCustomers() {
    return this._updatedCustomers;
  }

  set updatedCustomers(customers:Array<Object>) {
    this._updatedCustomers = customers;
    this._state.updatedCustomers = customers;
    CustomersService.selectedCustomers = customers;
    this.updatedCustomerIds = customers.map((customer:any) => customer._id);
  }

  private _updatedCustomerIds:Array<string> = [];
  get updatedCustomerIds() {
    return this._updatedCustomerIds;
  }
  set updatedCustomerIds(ids:Array<string>) {
    this._updatedCustomerIds = ids;
    this._state.updatedCustomerIds = ids;
    if (ids.length > 0 ) {
      this.isUpdateButtonShown = true;
    }
  }

  private _excludedCustomers:Array<Object> = [];
  get excludedCustomers() {
    return this._excludedCustomers;
  }
  set excludedCustomers(customers:Array<Object>) {
    this._excludedCustomers = customers;
    this._state.excludedCustomers = customers;
    CustomersService.selectedCustomers = customers;
    this.excludedCustomersIds = customers.map((customer:any) => customer._id);
  }

  private _excludedCustomersIds = [];
  get excludedCustomersIds() {
    return this._excludedCustomersIds;
  }
  set excludedCustomersIds(ids:Array<string>) {
    this._excludedCustomersIds = ids;
    this._state.excludedCustomersIds = ids;
    if (ids.length > 0 ) {
      this.isUpdateButtonShown = true;
    }
  }

  private _isSlideChecked:boolean = CustomersService.isSlideChecked;
  get isSlideChecked() {
    return this._isSlideChecked;
  }
  set isSlideChecked(checked: boolean) {
    this._isSlideChecked = checked;
    this._state.isSlideChecked = checked;
    CustomersService.isSlideChecked = checked;

    if (checked) {
      this.isUpdateButtonShown = checked;
      this.placeholder = 'Exclude a Customer';
    } else {
      this.placeholder = 'Select a Customer to Update';
    }
  }

  private _state:any = {};

  get state() {
    return this._state;
  }

  config = {
    enableMultipleUsersUpdate: true
  };

  placeholder:string;
  pageHeader: string = 'Update Customer Contracts';
  // _removeCategories: boolean = false;


  constructor(private _service: NotificationsService, private systemLogService: SystemLogsService) {
    EventEmitterService.Events.emit({pageHeader: this.pageHeader});
    this.isSlideChecked = CustomersService.isSlideChecked;
  }

  ngOnInit() {
    this.checkUpdatedCustomers(CustomersService.selectedCustomers);
  }

  showView(view) {
    this.onClick.emit(view);
  }

  async update() {
    this.isUpdateButtonShown = false;
    this.isSpinShown = true;
    let totalUpdate = 0;

    let rows = this.updateContractLookup._getDirtyRows();
    let checkboxFieldName = 'check';
    let copyRows = rows.filter(row => row[checkboxFieldName]);
    let categoryIds = copyRows.map(row => row._id);

    // get all product ids by selected categories
    let updatedProducts:any = await funcs.callbackToPromise(MeteorObservable.call('getCategoriesProducts', categoryIds));
    let updatedProductIds = updatedProducts.map(product => product._id);

    let updatedContractIds:any = [];
    if (this.isSlideChecked) {
      // get all contractIds
      updatedContractIds = await funcs.callbackToPromise(MeteorObservable.call('getAllContractIds', Session.get('tenantId')));

      if (this.excludedCustomersIds.length > 0) {
        const excludedContractIds:any = await MeteorObservable.call('getContractIdsByCustomerIds', this.excludedCustomersIds).toPromise();
        updatedContractIds = updatedContractIds.filter(contractId => {
          if (excludedContractIds.includes(contractId)) {
            return false;
          } else {
            return true;
          }
        });
      }

    } else {
      updatedContractIds = await MeteorObservable.call('getContractIdsByCustomerIds', this.updatedCustomerIds).toPromise();
    }

    // updatedProductIds = ['b4FfceHYI820wqM8b'];

    if (this.increasePercentage != 0 && !this._removeCategories) {
      let length = updatedContractIds.length; //
      let count = 0;
      let logs = [];
      let contractLogs = [];

      const result = await Promise.all(updatedContractIds.map((contractId:string, contractIndex) => {

        return new Promise(async (resolve) => {
          if (contractId && contractId != '' && typeof contractId == 'string') {
            funcs.getContractProductsById(contractId).then(async (contractProducts:any) => {
              let needUpdate = false;
              let numberProducts = 0;

              updatedProductIds.forEach(productId => {
                let productIndex = contractProducts.findIndex(product => product._id == productId);
                if (productIndex > -1) {
                  //******* */NEEDED FOR UPDATING SPECIFIC PRODUCT TO SAME PRICE//
                  // let product = contractProducts[productIndex];
                  // // if (product.price != '' && product.price) {
                  // //   product.previousPrice = product.price;
                  // // }
                  // // product.price *= (1 + this.increasePercentage/100);
                  // // product.price = Number(product.price.toFixed(2));

                  // if (product._id == 'sdo0ZLQ4IWvcWyzco') {
                  //   product.price = Number(51.97)
                  //   product.isSynced = false;
                  //   console.log('HIT', productIndex, product )
                  //   needUpdate = true;
                  //   let log: any = {
                  //     _id: Random.id(),
                  //     documentId: contractId,
                  //     collectionName: 'customerContracts',
                  //     document: contractId,
                  //     type: 'update',
                  //     fieldPath: `products_${product._id}.price_double`,
                  //     field: 'products',
                  //     log: '',
                  //     date: new Date(),
                  //     value: product.price,
                  //     previousValue: product.previousPrice,
                  //     pathname: window.location.pathname
                  //   };
  
                  //   totalUpdate++;
                  //   log.log = `Update Product (${product._id}) in contract (${contractId}), contractPrice from ${product.previousPrice} to ${product.price}`;
                  //   if (logs.length < 2500) {
                  //     logs.push(log);
                  //   } else {
                  //     contractLogs.push(logs);
                  //     logs = [];
                  //   }
                  // } else {
                  //   product.previousPrice = product.previousPrice;
                  //   product.price = product.price;
                  // }


                  // // product.isSynced = false;
                  // numberProducts++;
                  // // needUpdate = true;
                  //*******END*///

                  let product = contractProducts[productIndex];
                  if (product.price != '' && product.price) {
                    product.previousPrice = product.price;
                  }
                  product.price *= (1 + this.increasePercentage / 100);
                  product.price = Number(product.price.toFixed(2));
                  product.isSynced = false;
                  numberProducts++;
                  needUpdate = true;

                  let log: any = {
                    _id: Random.id(),
                    documentId: contractId,
                    collectionName: 'customerContracts',
                    document: contractId,
                    type: 'update',
                    fieldPath: `products_${product._id}.price_double`,
                    field: 'products',
                    log: '',
                    date: new Date(),
                    value: product.price,
                    previousValue: product.previousPrice,
                    pathname: window.location.pathname
                  };

                  totalUpdate++;
                  log.log = `Update Product (${product._id}) in contract (${contractId}), contractPrice from ${product.previousPrice} to ${product.price}`;
                  if (logs.length < 2500) {
                    logs.push(log);
                  } else {
                    contractLogs.push(logs);
                    logs = [];
                  }
                }
              });

              // console.log('need update', needUpdate, count);
              count++;
              this.progressPercentage = count/length * 100;
              if (needUpdate) {
                let update = {
                  $set: {
                    products: contractProducts
                  }
                };

                let result:any = await funcs.update('customerContracts', {_id: contractId}, update);

                this.progressPercentage = count/length * 100;
                resolve(result);


              } else {
                // console.log("no update", contractId);
                resolve(false);
              }
            });
          } else {
            resolve(false);
          }
        })
      }));

      contractLogs.push(logs);


      const insertLogs = contractLogs.map(_logs => {
        let sessionId = funcs.uuidv4();
        let systemLog = {
          _id: Random.id(),
          sessionId: sessionId,
          createdAt: new Date(),
          createdUserId: Meteor.userId(),
          parentTenantId: Session.get('parentTenantId'),
          actions: [..._logs]
        };

        return systemLog;
      });

      console.log(JSON.stringify(insertLogs))
      MeteorObservable.call('rawInsert', 'systemLogs', insertLogs)
        .subscribe(res => {
          // console.log('res', res);
        })

      this.updatedCustomers = [];
      this.excludedCustomers = [];
      this.isSpinShown = false;
      this._service.success("Success", 'Update customers contract complete');
      this.updateContractLookup.reloadData('after update');

    }

    if (this._removeCategories) {
      console.log('remove function')
      let length = updatedContractIds.length; //
      let count = 0;
      let logs = [];
      let contractLogs = [];
      const result = await Promise.all(updatedContractIds.map((contractId: string, contractIndex) => {

        return new Promise(async (resolve) => {
          
          if (contractId && contractId != '' && typeof contractId == 'string') {
            let deletedProductsArray = []
            
            funcs.getContractProductsById(contractId).then(async (contractProducts: any) => {
              let needUpdate = false;
              let numberProducts = 0;
              updatedProductIds.forEach(productId => {
                let productIndex = contractProducts.findIndex(product => product._id == productId);
                
                if (productIndex > -1) {
                  let product = contractProducts[productIndex];
                  deletedProductsArray.push(product._id)
                  contractProducts.splice(productIndex, 1);
                  numberProducts++;
                  needUpdate = true;
                  
                  let log: any = {
                    _id: Random.id(),
                    documentId: contractId,
                    collectionName: 'customerContracts',
                    document: contractId,
                    type: 'update',
                    fieldPath: `products_${product._id}`,
                    field: 'products',
                    log: '',
                    createdAt: new Date(),
                    value: product.price,
                    previousValue: product.previousPrice,
                    pathname: window.location.pathname
                  };
                  totalUpdate++;
                  log.log = `Removed (${product._id}) from contract (${contractId})`;
                  if (logs.length < 2500) {
                    logs.push(log);
                  } else {
                    contractLogs.push(logs);
                    logs = [];
                  }
                }
              });

              // console.log('need update', needUpdate, count);
              count++;
              this.progressPercentage = count / length * 100;
              
              if (needUpdate) {
                let update = {
                  $set: {
                    products: contractProducts,
                    deletedProducts: deletedProductsArray
                  }
                };
                
                let result: any = await funcs.update('customerContracts', { _id: contractId }, update);
                // console.log('~~', 'contractId', contractId, result);
                
                this.progressPercentage = count / length * 100;
                
                resolve(result);


              } else {
                
                resolve(false);
              }
            });
          } else {
            resolve(false);
          }
        })
      }));

      contractLogs.push(logs);


      const insertLogs = contractLogs.map(_logs => {
        let sessionId = funcs.uuidv4();
        let systemLog = {
          _id: Random.id(),
          sessionId: sessionId,
          createdAt: new Date(),
          createdUserId: Meteor.userId(),
          parentTenantId: Session.get('parentTenantId'),
          actions: [..._logs]
        };

        return systemLog;
      });
      if (insertLogs.length > 0){
        MeteorObservable.call('rawInsert', 'systemLogs', insertLogs)
          .subscribe(res => {
            // console.log('res', res);
          })
      }
      this.updatedCustomers = [];
      this.excludedCustomers = [];
      this.isSpinShown = false;
      this._service.success("Success", 'Update customers contract complete');
      this.updateContractLookup.reloadData('after update');

    }
  }

  removeUpdatedCustomers(customer) {
    this.updatedCustomers = this.updatedCustomers.filter((_customer:any) => _customer._id != customer._id);
  }

  removeExcludedCustomers(customer) {
    this.excludedCustomers = this.excludedCustomers.filter((_customer:any) => _customer._id != customer._id);
  }

  onSlideChange(event) {
    this.isSlideChecked = event.checked;
    this.excludedCustomers = [];
    this.updatedCustomers = [];
  }

  checkUpdatedCustomers(customers) {
    if (this.isSlideChecked) {
      this.excludedCustomers = customers;
    } else {
      this.updatedCustomers = customers;
    }
  }

  emitEvnet(event) {

  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }
}
