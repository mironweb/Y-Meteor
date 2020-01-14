import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import {ActivatedRoute, Router} from '@angular/router';
import moment = require("moment");
import {SystemLookup} from "../../../../both/models/systemLookup.model";
import {UserService} from "../../services/UserService";
import {PrintService} from "../../services/Print.service";
import {NotificationsService} from "angular2-notifications";

import {bwipjs} from 'bwip-js';
import {of} from "rxjs/observable/of";
import {map, switchMap, take, tap} from "rxjs/operators";
import {EventEmitterService} from "../../services";

import * as cloneDeep from 'clone-deep';
import * as deepEqual from 'deep-equal';
import {Subscriber} from "rxjs/Subscriber";
import {LineItem, ProductionOrder, ProductionOrderModel} from "../../../../both/models/productionOrder.model";
import {MeteorObservable} from "meteor-rxjs";
import {Random} from 'meteor/random';
import {SystemOption} from "../../../../both/models/systemOption.model";
import {InventoryService} from "./inventory.service";

var JsBarcode = require('jsbarcode');

@Component({
  selector: 'inventory-work-order-release-detail',
  template: `
    <mat-card>
      <div fxLayout="row">
        <mat-card *ngIf="showBillOfMaterial" fxFlex="50">
          <h2 style='margin-top: 0px; float: left;'>Bill of Material</h2>
          <hr style='clear: both;'>
          <system-lookup 
              #billLookup 
              lookupName="workOrderReleaseDetail" 
              (onComplete)="onBillComplete()" 
              isModal="true"
              [data] = "lookupData"
              [documentId]="documentId"></system-lookup>
        </mat-card>
        <mat-card fxFlex="50" style="margin-left: 10px">
          <h2 style='margin-top: 0px; float: left;'>Production Quantities</h2>
          <hr style='clear: both;'>

          <div>
            <mat-form-field style="width: 200px;">
              <input matInput [matDatepicker]="picker" [disabled]="!isNew" (dateChange)="onDateChange($event)" placeholder="Forecast Date" [value]="endDate">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
            <mat-form-field style="width: 200px">
              <input matInput value="0.00" type="number" placeholder="Forecast Change Percent" (change)="onForecastPercentChange($event)" [disabled]="!isNew">
            </mat-form-field>
            <mat-form-field style="width: 200px">
              <input matInput placeholder="Forecast" value="{{forecast | number: '1.0-0'}}" readonly (click)="onForecastClick()" [disabled]="!isNew">
            </mat-form-field>
          </div>
          <div>
            <mat-form-field style="width: 200px">
              <input matInput placeholder="Finished" [(ngModel)]="qtyOnHand" readonly>
            </mat-form-field>
            <mat-form-field style="width: 200px">
              <input matInput placeholder="On SO" [value]="onSO" readonly>
            </mat-form-field>
            <mat-form-field style="width: 200px">
              <input matInput placeholder="On BO" [value]="onBO" readonly>
            </mat-form-field>
            <br>
            <mat-form-field style="width: 200px">
              <input matInput placeholder="Maximum" [value]="maximum" readonly (click)="onMaxiumnClick()" [disabled]="!isNew">
            </mat-form-field>
            <mat-form-field style="width: 200px">
              <input matInput placeholder="Receiving Case Qty" [value]="receivingCaseQty" readonly>
            </mat-form-field>
            <mat-form-field style="width: 200px">
              <input matInput placeholder="Shipping Case Qty" [value]="shippingCaseQty" readonly>
            </mat-form-field>
            <br>
            <mat-form-field style="width: 200px">
              <input matInput [disabled]="isQuantityToMakeDisabled || !isNew" placeholder="Quantity to Make" type="number" min="0" [max]="maximum" [(ngModel)]="quantityToMake" (change)="onQuantityMakeChange()">
            </mat-form-field>
          </div>
        </mat-card>

      </div>
      <br>
      <mat-card *ngIf="showPickingDetail">
        <h2 style='margin-top: 0px; float: left;'>Component Picking Detail</h2>
        <hr style='clear: both;'>
        <system-lookup 
            #componentsDetailLookup 
            (onComplete)="onDetailComplete()" 
            (emitDataChange)="onComponentDetailDataChange($event)" 
            lookupName="workOrderReleaseComponentsDetail"
            [data] = "lookupData"
            isModal="true" [documentId]="documentId"></system-lookup>
      </mat-card>
      <br>
      <br>
      <button mat-raised-button color="primary" [(disabled)]="!isEnabled_print" (click)="print()">Print</button>
      <!--<button mat-raised-button color="primary" (click)="barcode()">barcode</button>-->
    </mat-card>
  `
})

export class InventoryWorkOrderReleaseDetailPage implements OnInit, OnDestroy {

  @ViewChild('billLookup') billLookup;
  @ViewChild('componentsDetailLookup') componentsDetailLookup;

  productionOrder: ProductionOrder;
  productId: string;
  lookup: SystemLookup;
  documentId: string;
  startDate: Date;
  endDate:Date;
  data:any = {
    forecastPercent: 1
  };

  isNew: boolean = true;
  lookupData:any = {};
  showBillOfMaterial: boolean;
  showPickingDetail: boolean;
  isEnabled_print: boolean = false;
  itemCode: string;
  qtyOnHand:number = 0;
  onSO: number = 0;
  onBO: number = 0;
  maximum: number = 0;
  forecast: number = 0;
  quantityToMake: number;
  printerId;
  billDirtyRows = [];
  detailDirtyRows = [];
  isQuantityToMakeDisabled:boolean = true;
  shippingCaseQty = 0;
  receivingCaseQty = 0;
  version: String = '';
  qtyForecasted: number; // qty that is manufactured last year
  fakeDetailRows = [];
  eventSubscriber:Subscriber<any>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private printService: PrintService,
    private _service: NotificationsService,
    private inventoryService: InventoryService

  ) {
    pdfFonts.pdfMake;
    this.startDate = moment().startOf('day').toDate();
    this.endDate = moment().add(30, 'day').endOf('day').toDate();
    this.data.startDate = moment(this.startDate).subtract(1, 'year').toDate();
    this.data.endDate = moment(this.endDate).subtract(1, 'year').toDate();
  }

  async ngOnInit() {
    // JsBarcode("#pharmacode", "N4143", {format: "code39"});

    this.hookEvents();

    if (this.printService.printers && this.printService.printers.length > 0) {
      let findPrinter = this.printService.printers.find(_printer => _printer.printerName == 'workOrder');
      this.printerId = findPrinter.printerId;
    }




    let params:any = await this.route.params.pipe(take(1)).toPromise();
    let queryParams:any = await this.route.queryParams.pipe(take(1)).toPromise();


    if ('productionOrderId' in queryParams) {
      let res:any = await MeteorObservable.call('findOne', 'productionOrders', {_id: queryParams.productionOrderId}).toPromise();
      if (res) {
        this.productionOrder = new ProductionOrder(res);
        if (this.productionOrder.status == 'New') {
          this.isNew = true;
        } else {
          this.isNew = false;
        }

        this.lookupData = Object.assign({}, queryParams, {isNew: this.isNew});

        this.quantityToMake = this.productionOrder.productionQty;
        // this.loadProductionOrder();
      }
    }

    if(params.documentId) {
      this.documentId = params.documentId;
    }

    if (queryParams.endDate) {

      this.endDate = moment(new Date(queryParams.endDate)).endOf('day').toDate();
      this.data.endDate = moment(this.endDate).subtract(1, 'year').toDate();
    }

    let lookup:any = await SystemLookup._GetReferredLookup$(this.userService.user, 'workOrderRelease').toPromise();
    this.lookup = new SystemLookup(lookup);

    this.loadLookup();
  }

  getDetailProductCount() {
    this.billDirtyRows.forEach(_row => {
      if (_row.backgroundColor == 'green') {
        let count:any = {
          [_row.component]: 0
        };
        this.detailDirtyRows.forEach(row => {
          if (_row.component == row.component) {
            count[row.component]++;
            if (row.check == true) {
              row.isDisabled = false;
            } else {
              row.isDisabled = true;
            }
          }
        });

        if (count[_row.component] == 1) {
          let findDetailRow = this.detailDirtyRows.find(row => _row.component == row.component);
          findDetailRow.isDisabled = true;
        } else {
          if (_row.picked == _row.qtyAvail) {
            this.checkAllDetailComponent(_row.component);
          }
        }
      }
    });
  }

  loadProductionOrder() {
    if (this.productionOrder && this.detailDirtyRows.length > 0) {
      // this.detailDirtyRows.forEach(_row => {
      //   // let findItem:LineItem = this.productionOrder.lineItems.find((_item:LineItem) => _item.productId == _row._id.productId && _item.warehouseBinId == _row._id.binId);
      //   // // if (findItem) {
      //   // //   _row.qtyToPick = findItem.qtyToPick;
      //   // //   _row.qtyToPick = findItem.qtyToPick;
      //   // //   _row.check = true;
      //   // //   _row.isDisabled = false;
      //   // // } else {
      //   // //   _row.isDisabled = true;
      //   // // }
      // });
      this.detailDirtyRows.forEach(_row => {
        if (_row.qtyToPick > 0) {
          _row.check = true;
          _row.isDisabled = false;
        } else {
          _row.isDisabled = true;
        }
      })

      this.billDirtyRows.forEach(_row => {
        this.setBillRowComplete(_row);
      });
      this.getDetailProductCount();
      this.checkPrint();
    }
  }

  onForecastPercentChange(e) {
    if (Number(e.target.value) == 0 || !e.target.value ) {
      e.target.value = 0.00;
    }
    this.data.forecastPercent = 1 + Number(e.target.value)/100;

    this.forecast = this.qtyOnHand - this.qtyForecasted * this.data.forecastPercent;

    // this.loadLookup();
  }

  textToBase64Barcode(text){
    var canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {format: "CODE39"});
    return canvas.toDataURL("image/png");
  }

  checkPrint() {
    let len = 0;
    this.billDirtyRows.forEach(_row => {
      if (_row.backgroundColor == 'green') {
        len ++;
      }
    });
    if (len == this.billDirtyRows.length) {
      this.isEnabled_print = true;
    } else {
      this.isEnabled_print = false;
    }
  }

  async loadLookup() {
    if (this.lookup) {
      this.lookup.externalStages = [];

      if(this.productionOrder) {
        this.lookup.externalStages.push(
          {
            $addFields: {
              maximum: {
                $sum: ["$maximum", "$productionOrderQty"]
              }
            }
          }
        )
      }
      this.lookup.objLocal = {
        data: this.data
      };
      this.lookup.externalStages.push({
        $match: {
          _id: this.documentId
        }
      });

      this.lookup._getQueryAggregateResult()
        .then(result => {
          if (result.length > 0) {
            this.detailDirtyRows.forEach(_row => _row.isDisabled = true);
            this.itemCode = result[0].itemCode;
            this.productId = result[0].productId;
            this.receivingCaseQty = result[0].receivingCaseQty;
            this.shippingCaseQty = result[0].shippingCaseQty;
            this.version = result[0].version;
            // this.pageHeaderInput = "Work Order Release > " + this.itemCode;
            // EventEmitterService.Events.emit( {pageHeader: this.pageHeaderInput});
            this.qtyOnHand = result[0].qtyOnHand;
            this.onSO = result[0].onSO;
            this.onBO = result[0].onBack;

            this.maximum = result[0].maximum;
            this.forecast = result[0].forecast;
            this.qtyForecasted = this.qtyOnHand - this.forecast;
            if (this.maximum === 0 || !this.maximum) {
              this.isQuantityToMakeDisabled = true;
            } else {
              this.isQuantityToMakeDisabled = false;
            }

          } else {

          }

          // if (this.productionOrder) {
          //   this.loadProductionOrder();
          // }
          this.showPickingDetail = true;
          this.showBillOfMaterial = true;
        });

    }
  }

  onQuantityMakeChange() {

    this.billDirtyRows.forEach(_row => _row.backgroundColor ='red');

    if (this.quantityToMake > this.maximum) {
      this.quantityToMake = this.maximum;
    }
    if (this.quantityToMake && this.quantityToMake > 0) {
      of('start')
        .pipe(
          map(() => {
            this.billDirtyRows.forEach(_row => {
              _row.picked = Math.ceil(this.quantityToMake * _row.qtyRequired);
              _row.status = undefined;
            });
            return this.detailDirtyRows.reduce(function(rv, x) {
              rv[x['component']] ? "" : rv[x['component']] = 0;
              rv[x['component']]++;
              return rv;
            }, {});
          }),
          // get total finished qty of all bins
          tap((reducedObj) => {
            Object.keys(reducedObj).forEach(key => {
              if (reducedObj[key] == 1) {
                let findRow = this.detailDirtyRows.find(row => row.component == key);
                if (findRow) {
                  findRow.check = true;
                  findRow.isDisabled = true;

                  let findBillRow = this.billDirtyRows.find(row => row.component == findRow.component);
                  if (findBillRow) {
                    let toPick = Math.ceil(findBillRow.picked);
                    if (toPick > findRow.qtyOnHand) {
                      findRow.qtyToPick = findRow.qtyOnHand;
                      findBillRow.status = undefined;

                    } else {
                      findRow.qtyToPick = toPick;
                      this.setBillRowComplete(findBillRow);
                    }
                  }
                }
              } else {
                let findDetailRow = this.detailDirtyRows.find(row => row.component == key);
                let findBillRow = this.billDirtyRows.find(row => row.component == findDetailRow.component);

                findBillRow.status = findBillRow.picked + " left";

                if (findBillRow.picked == findBillRow.qtyAvail) {
                  this.checkAllDetailComponent(findBillRow.component);
                  this.setBillRowComplete(findBillRow);
                } else {
                  this.unCheckAllDetailComponent(findBillRow.component);
                }
              }
            })
          })
        )
        .subscribe(
          (res) => {

          }
        )
    } else {
      this.quantityToMake = 0;
      this.billDirtyRows.forEach(_row => {
        _row.picked = undefined;
        _row.status = undefined;
      });
      this.detailDirtyRows.forEach(_row => {
        _row.check = false;
        _row.isDisabled = true;
        _row.qtyToPick = undefined;
      })
    }
    this.checkPrint();
  }

  setBillRowComplete(row) {
    row.status = "✓";
    row.backgroundColor = 'green';
  }

  checkAllDetailComponent(component) {
    this.detailDirtyRows.forEach(_row => {
      if (_row.component == component) {
        _row.check = true;
        _row.isDisabled = true;
        _row.qtyToPick = _row.qtyOnHand;
      }
    })
  }

  unCheckAllDetailComponent(component) {
    this.detailDirtyRows.forEach(_row => {
      if (_row.component == component) {
        _row.check = false;
        _row.isDisabled = false;
        _row.qtyToPick = undefined;
      }
    })
  }

  onForecastClick() {
    if (this.forecast > 0) {
      this.quantityToMake = this.forecast;
      this.onQuantityMakeChange();
    }
  }

  onMaxiumnClick() {
    if (this.maximum > 0) {
      this.quantityToMake = this.maximum;
      this.onQuantityMakeChange();
    }
  }

  onComponentDetailDataChange(e) {
    switch(e.name) {
      case 'onNumberChange':
        this._onNumberChange$(e).subscribe(() => {
          this.fakeDetailRows = cloneDeep(this.detailDirtyRows);
        });
        break;
      case 'onCheckboxChange':
        this.onCheckboxChange(e);
        break;
      default:
        break;
    }
    this.checkPrint();
  }

  onCheckboxChange(e) {
    if (this.quantityToMake) {
      let row = e.value.row;
      // if row is checked
      if (row.check) {
        let findBillRow = this.billDirtyRows.find(_row => _row.component == row.component);
        let detailRow_toPick = this.calculateTotalPicked(row.component);
        let qtyLeft = findBillRow.picked - detailRow_toPick;

        if (row.qtyOnHand < qtyLeft) {
          row.qtyToPick = row.qtyOnHand;
        } else {
          row.qtyToPick = qtyLeft;
        }

        this._onNumberChange$(e)
          .pipe(
            tap(res => {
              detailRow_toPick = this.calculateTotalPicked(row.component);
              qtyLeft = findBillRow.picked - detailRow_toPick;
              if (qtyLeft == 0) {
                // gray out unchecked rows
                this.detailDirtyRows.forEach(_row => {
                  if (!_row.check && _row.component == row.component) {
                    _row.isDisabled = true;
                  }
                })
              } else {
                // testlog('qty not 0', qtyLeft);
              }
            })
          )
          .subscribe(() => {
            this.fakeDetailRows = cloneDeep(this.detailDirtyRows);
          });
      } else {
        // if row is not checked
        row.qtyToPick = undefined;
        this.detailDirtyRows.forEach(_row => {
          if (!_row.check) {
            _row.isDisabled = false;
          }
        });

        this._onNumberChange$(e)
          .subscribe(() => {
            this.fakeDetailRows = cloneDeep(this.detailDirtyRows);
          });
      }
    }
  }

  _onNumberChange$(e) {
    let row = e.value.row;
    let qtyToPick = e.value.value;
    if (qtyToPick > row.qtyOnHand) {
      row.qtyToPick = row.qtyOnHand;
    }
    let findBillRow = this.billDirtyRows.find(_row => _row.component == row.component);
    return of(row)
      .pipe(
        // get totoal to pick in detail lookup
        map(() => this.calculateTotalPicked(row.component)),
        // use total to pick number to check the status
        tap((totalToPick) => {
          let remaining = findBillRow.picked - totalToPick;

          if (remaining === 0) {
            this.setBillRowComplete(findBillRow);
          } else if (remaining > 0) {
            findBillRow.status = remaining + " left";
            findBillRow.backgroundColor = 'red';
            // enable related detial rows
            this.detailDirtyRows.forEach(_row => {
              if (_row.component == findBillRow.component) {
                _row.isDisabled = false;
              }
            })
          } else if (remaining < 0) {
            row.qtyToPick = findBillRow.picked - totalToPick + row.qtyToPick;
            if (row.qtyToPick == 0) {
              row.check = false;
            }
            this.setBillRowComplete(findBillRow);
          }
        })
      )
  }

  calculateTotalPicked(component) {
    let findDetailRows = this.detailDirtyRows.filter(_row => _row.component == component);
    let totalPicked = 0;
    findDetailRows.forEach(row => {
      if (row.qtyToPick) {
        totalPicked += row.qtyToPick;
      }
    });
    return totalPicked;
  }

  print() {
    if (this.printerId) {
      if (!this.quantityToMake) {
        this._service.warn(
          "Warning",
          "Quantity To Make is required"
        )
        return;
      }
      let model: ProductionOrderModel = {
        _id: Random.id(),
        billId: this.documentId,
        number: 0,
        createdAt: new Date(),
        productionQty: this.quantityToMake,
        tenantId: Session.get('tenantId'),
        createdUserId: Meteor.userId(),
        productId: this.productId,
        lineItems: []
      };

      let printedBy = this.getUser(Meteor.userId());
      let createdBy = this.productionOrder ? this.getUser(this.productionOrder.createdUserId) : this.getUser(Meteor.userId());
      let dateFormat = 'MMM DD, YYYY h:mm A';
      let extraInfo = {
        version: this.version,
        printedBy: printedBy[0].profile.firstName + " " + printedBy[0].profile.lastName,
        createdBy: createdBy[0].profile.firstName + " " + createdBy[0].profile.lastName,
        printedAt: moment().format(dateFormat),
        createdAt: this.productionOrder ? moment(this.productionOrder.createdAt).format(dateFormat) : moment().format(dateFormat)
      }
      console.log(this.productionOrder, extraInfo);
      
      this.detailDirtyRows.forEach(_row => {
        if(_row.check) {
          if (!model.destinationWarehouseBinId) {
            model.destinationWarehouseBinId = _row.primaryBinId;
          }
          model.lineItems.push({
            _id: Random.id(),
            productId: _row._id.productId,
            warehouseId: _row.warehouseId,
            warehouseBinId: _row._id.binId,
            warehouseBinName: _row.bin,
            warehouseName: _row.warehouse,
            qtyToPick: _row.qtyToPick,
            qtyPicked: 0,
            cost: _row.cost,
            createdUserId: Meteor.userId(),
            component: _row.component
          })
        }
      });
      let productionOrder = new ProductionOrder(model);

      let systemOption;
      if (this.productionOrder) {
        this.productionOrder.lineItems = model.lineItems;
        let productionOrder = new ProductionOrder(this.productionOrder);
        productionOrder._save$()
          .subscribe(() => {
            this.productionOrder.itemCode = this.itemCode;
            let docDefinition: any = this.inventoryService._getPDFData(this.productionOrder, extraInfo);
            pdfMake.createPdf(docDefinition).open();
          });
      } else {
        MeteorObservable.call('findOne', "systemOptions", {
          name: "productionOrdersNextNumber"
        })
          .pipe(
            switchMap((_systemOption: any) => {
              systemOption = new SystemOption(_systemOption);
              model.number = (systemOption.value + 1).toString();
              return ProductionOrder._Insert$(model);
            }),
            switchMap((res) => {
              if (typeof res == 'string') {
                systemOption.value = systemOption.value + 1;
                return systemOption._save$();
              } else {
                return of(res);
              }
            })
          )
          .subscribe(() => {
            console.log(model);
            console.log(this.lookup);
            console.log(this.productionOrder);
            
            let docDefinition: any = this._getPDFData(model, extraInfo);
            pdfMake.createPdf(docDefinition).open();

          })
      }

      // pdfDocGenerator.getBase64(data => {
      //   let printJobPayload = {
      //     "printerId": this.printerId,
      //     "title": "test printjob",
      //     "contentType": "pdf_base64",
      //     "content": data,
      //     "source": "javascript api client"
      //   };
      //   this.printService.print(printJobPayload);
      // })
    } else {
      this._service.warn(
        "Warning",
        "No printer is selected"
      )
    }
  }

  barcode() {
    let base64Str = this.textToBase64Barcode("N4143");
    let docDefinition = {
      content: [
        {
          image: base64Str,
          alignment: 'center',
          fit: [100, 100]
        }
      ]
    };
    pdfMake.createPdf(docDefinition).open();
  }
  
  getUser(userId){
    return Meteor.users.find({ _id: userId }).fetch();
  }

  _getPDFData(model, extraInfo) {
    let dirtyRows = this.componentsDetailLookup._getDirtyRows();
    const fieldSorter = (fields) => (a, b) => fields.map(o => {
      let dir = 1;
      if (o[0] === '-') { dir = -1; o=o.substring(1); }
      return a[o] > b[o] ? dir : a[o] < b[o] ? -(dir) : 0;
    }).reduce((p, n) => p ? p : n, 0);
    dirtyRows.sort(fieldSorter(['warehouse', 'bin']));

    let pdfTableHeaders = [
      "Bin",
      "Warehouse",
      "Component",
      "Unit of Measure",
      {text: "Total Qty", alignment: "right"},
      {text: "Qty Picked", alignment: "center"},
      {text: "Short/Over", alignment: "center"}
    ];

    let pdfTableRows = [];

    dirtyRows.forEach(row => {
      let arr = [];
      if (row.check) {
        arr.push(row.bin);
        arr.push(row.warehouse);
        arr.push(row.component);
        arr.push('Each');
        let key = 'qtyToPick';
        if (row[key]) {
          arr.push({text: row[key], alignment: "right"});
        } else {
          arr.push('');
        }
        arr.push({text: "____________", alignment: 'center', margin: [10, 10]});
        arr.push({text: "____________", alignment: 'center', margin: [10, 10]});
        pdfTableRows.push(arr);
      }
    });
    let billNumber_barcode = this.textToBase64Barcode(this.itemCode);
    let quantity_barcode = this.textToBase64Barcode(this.quantityToMake);
    let orderNo_barcode = this.textToBase64Barcode(model.number);

    return {
      fontSize: 20,
      pageSize: 'A4',
      pageMargins: [30, 30, 30, 30],
      content: [
        { text: 'Work Order Picking Sheet', style: 'header' },
        {
          margin: [0, 20, 0, 0],
          columns: [
            {
              columns: [
                {
                  text: "Bill Number :",
                  alignment: "right"
                },
                {
                  table: {
                    body: [
                      [{
                        image: billNumber_barcode,
                        fit: [100, 100],
                        alignment: "center",
                        border: [false, false, false, false]
                      }],
                      [{ text: 'Version: ' + extraInfo.version, alignment: "center", fontSize: 8, border: [false, false, false, false,] }]
                    ]
                  }
                }, 
              ]
            },
            {
              columns: [
                {
                  text: "Quantity:",
                  alignment: "right"
                },
                {
                  image: quantity_barcode,
                  fit: [100, 100],
                  alignment: "center"
                }
              ]
            }
          ]
        },
        {
          margin: [0, 5, 0, 0],
          columns: [
            {
              columns: [
                {
                  text: "Order No :",
                  alignment: "right"
                },
                {
                  image: orderNo_barcode,
                  fit: [100, 100],
                  alignment: "center"
                }
              ]
            },
            {
              columns: [
                {
                  margin: [85, 0, 0, 0],
                  table: {
                    body: [
                      [
                        {
                          text: 'Created:',
                          alignment: 'right',
                          border: [false, false, false, false]
                        },
                        {
                          text: extraInfo.createdAt + ' by ' + extraInfo.createdBy,
                          fontSize: 10,
                          margin: [10, 0],
                          border: [false, false, false, false]
                        }
                      ],
                      [
                        {
                          text: 'Printed:',
                          alignment: 'right',
                          border: [false, false, false, false]
                        },
                        {
                          text: extraInfo.printedAt + ' by ' + extraInfo.printedBy,
                          fontSize: 10,
                          margin: [10, 0],
                          border: [false, false, false, false]
                        }
                      ]
                    ]
                  }
                },
              ]
            }
          ]
        },
        {
          margin: [0, 15, 0, 15],
          fontSize: 10,
          // layout: 'lightHorizontalLines', // optional
          layout: {
            hLineWidth: function (i, node) {
              return ( i === 1) ? 2 : 0;
            },
            vLineWidth: function (i, node) {
              return (i === 0 || i === node.table.widths.length) ? 0 : 0;
            },
            hLineColor: function (i, node) {
              return (i === 0 || i === node.table.body.length) ? 'black' : 'black';
            },
            vLineColor: function (i, node) {
              return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
            },
            paddingLeft: function(i, node) { return 4; },
            paddingRight: function(i, node) { return 4; },
            paddingTop: function(i, node) { return 10; },
            paddingBottom: function(i, node) { return 2; },
            fillColor: function (rowIndex, node, columnIndex) { return null; }
          },
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: [ '*', '*', "*", '*', "auto", 'auto', "auto" ],
            body: [
              pdfTableHeaders,
              ...pdfTableRows
            ],


          }
        },
        {
          margin: [10, 10, 10, 10],
          columns: [
            '',
            { text: 'Boxer __________           Rcv __________', alignment: 'right' }
          ]
        }
      ],
      styles: {
        header: {
          fontSize: 20,
          alignment: "center"
        },
        table: {
          fontSize: 16
        }
      }
    }
  }

  onDetailComplete() {
    this.detailDirtyRows = this.componentsDetailLookup._getDirtyRows();
    this.fakeDetailRows.forEach(_row => {
      if(_row.check) {
        let findRow = this.detailDirtyRows.find(row => deepEqual(_row._id, row._id));
        if (findRow) {
          findRow.check = true;
          findRow.qtyToPick = _row.qtyToPick;
        }
      }
    });
    // this.getDetailProductCount();


    this.loadProductionOrder();
  }

  onBillComplete() {
    this.billDirtyRows = this.billLookup._getDirtyRows();
    this.billDirtyRows.forEach(_row => {
      _row.backgroundColor = 'red';
    })
    if (this.quantityToMake > 0) {
      this.onQuantityMakeChange();
    }
  }

  onDateChange(e) {
    this.endDate = moment(e.value).endOf('day').toDate();
    this.data.endDate = moment(this.endDate).subtract(1, 'year').toDate();
    this.loadLookup();
    // this.router.navigate([], {queryParams: {endDate: this.endDate}, queryParamsHandling: 'merge'});
  }

  hookEvents() {
    this.eventSubscriber = EventEmitterService.Events.subscribe((event:any) => {
      if (event.name == 'generatePDF') {
        this.generatePDF(event);
      }
    })
  }

  generatePDF(event) {

  }

  ngOnDestroy() {
    this.eventSubscriber.unsubscribe();
  }
}

// let p = "propertyName-object.propertyName-array.0-string"