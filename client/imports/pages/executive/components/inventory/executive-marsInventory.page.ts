import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import * as funcs from '../../../../../../both/functions/common';
import { MeteorObservable } from "meteor-rxjs";
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from "../../../../services/UserService";
import { EventEmitterService } from '../../../../services/EventEmitter.service';
import { SystemLogsService } from "../../../../services/SystemLogs.service";
import { Random } from 'meteor/random';
import * as _ from "underscore";
import * as XLSX from 'xlsx';
type AOA = any[][];
@Component({
  selector: 'executive-marsInventory',
  template: `
    <mat-card class='fullHeight'>
      <h2 style='margin-top: 0px; float: left;'>MARS Inventory</h2>
      <span class='cardIcons'>
        <i class="material-icons" (click)="openFileBrowser('')">attach_file</i>
      </span>
      <span id='dashboardHeaderElement'>
        <mat-form-field style='margin-top: 0px; float: right; width: 15%;'>
          <mat-select (selectionChange)='onChange($event.value, "year")' [(value)]="selectedYear">
            <mat-option [value]="2018">2018</mat-option>
            <mat-option [value]="2019">2019</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field style='margin-top: 0px; float: right; padding: 0px 10px 0px 0px; width: 15%;'>
          <mat-select (selectionChange)='onChange($event.value, "month")' [(value)]="selectedMonth">
            <mat-option *ngFor="let month of months" [value]="month.number">
              {{month.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </span> 
      <hr style='clear: both;'>
      <input [hidden]='true' #fileInput id='fileInput' type="file" (change)="onFileChange($event)" multiple="false" />
      <div style="overflow-x:auto;" *ngIf="!loading">
        <table id='tables'>
        <tr>
            <th class="rowHead"></th>
            <th colspan="4" class="col" style='text-align: center;'>{{returnHeader(selectedMonth, selectedYear)}}</th>
            <th colspan="4" class="col" style='text-align: center;'>{{returnHeader(selectedMonth, selectedYear - 1)}}</th>
        </tr>
        <tr>
            <th class="rowHead"></th>
            <th *ngFor="let header of horizontalHeaders" class="col">{{header}}</th>
            <th *ngFor="let header of horizontalHeaders" class="col">{{header}}</th>
        </tr>
        <tr *ngFor="let row of totalRows;let i = index" (click)='changeView(row)'>
          <th class="rowHead">{{row?.productNameCurrent || row?.productNamePrevious}}</th>
            <td class='alignRight'>{{row?.beginningCurrent || 0}}</td>
            <td class='alignRight'>{{row?.purchasedCurrent || 0}}</td>
            <td class='alignRight'>{{row?.soldCurrent || 0}}</td>
            <td class='alignRight'>{{returnNumber(row.beginningCurrent) + returnNumber(row.purchasedCurrent) - returnNumber(row.soldCurrent)}}</td>
            <td class='alignRight'>{{row?.beginningPrevious || 0}}</td>
            <td class='alignRight'>{{row?.purchasedPrevious || 0}}</td>
            <td class='alignRight'>{{row?.soldPrevious || 0}}</td>
            <td class='alignRight'>{{returnNumber(row.beginningPrevious) + returnNumber(row.purchasedPrevious) - returnNumber(row.soldPrevious)}}</td>
        </tr>
        </table>
      </div>
        <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
    </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveMarsInventorysPage implements OnInit {

  @Input() data: any;
  @ViewChild('fileInput') fileInput: HTMLElement;
  filterConditions: any;
  objLocal: any = {};
  currentYear: any = Number(moment().format('YYYY'));
  previousYear: any = this.currentYear - 1;
  currentYearTotals: any;
  previousYearTotals: any;
  totalRows: any = [];
  loading: boolean = true;
  months: any = [];
  selectedMonth: any;
  selectedYear = this.currentYear;
  horizontalHeaders = [
    'Beginning', 'Purchased', 'Sold', 'Net'
  ];
  rows: any;
  // @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private userService: UserService, private systemLogsService: SystemLogsService) {
  }

  async init() {
    MeteorObservable.call('findOne', 'systemOptions', { name: 'months' }, {}).subscribe((res: any) => {
      this.months = res.value;
    })
    this.selectedMonth = moment().month()
    // console.log(this.selectedMonth);
    let yearlySlice = this.monthDiff(this.selectedMonth, this.selectedYear);
    this.getMarsInventoryTotals(this.selectedMonth, this.selectedYear, yearlySlice);
    // const sub = MeteorObservable.subscribe('systemOptions', { "displayOnMarsCard": true });
    // const autorun = MeteorObservable.autorun();
    // merge(sub, autorun).subscribe(() => {
    //   let result = AllCollections['systemOptions'].collection.find().fetch();
    //   console.log(result);
    //   this.getMarsInventoryTotals(this.selectedMonth);
    // })
    // this.hookEvents();
  }

  ngOnInit() {
    this.init();
  }

  onFileChange(evt){
    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      /* read workbook */
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      let sheetToJson = XLSX.utils.sheet_to_json(ws, { header: ['City', 'State', 'Order Dt.', 'Item Code', 'Order Qty.'] });
      let arr = []
      for (var i = 0; i < sheetToJson.length; i++) {
        arr.push({ ...sheetToJson[i] })
      }

      sheetToJson.forEach(element => {
        element['Order Qty.'] = parseInt(element['Order Qty.'])
      });
      let result = this.groupAndMap(sheetToJson, 'Item Code', 'productTotals')
      this.getStateTotalsByProduct(result);
      this.insertExcelData(result);
    };
    reader.readAsBinaryString(target.files[0]);
  }

  getStateTotalsByProduct(groupedProducts){
    groupedProducts.forEach(product => {
      let stateTotals = this.groupAndMap(product.productTotals, 'State', 'stateTotals')
      let arr = stateTotals.map(state => {
        return {
          state: state['State'],
          total: state['stateTotals'].reduce(function (a, b) {
            return a + b['Order Qty.'];
          }, 0)
        }
      }
      )
      product['totalsByState'] = arr;
    });
  }

  groupAndMap(items, itemKey, childKey, predic?) {
    let grouped = _.map(
      _.groupBy(items, itemKey), (obj, key) => ({
        [itemKey]: key,
        [childKey]: (predic && predic(obj)) || obj
      }),
    )
    return grouped;
  }
  
  openFileBrowser(event){
    let element: HTMLElement = document.getElementById('fileInput') as HTMLElement;
    element.click();
  }

  onChange(event, name) {
    switch (name) {
      case 'year':
      this.selectedYear = event;
        
        break;
      case 'month':
      this.selectedMonth = event;
        
        break;
      default:
        
    }
    let yearlySlice = this.monthDiff(this.selectedMonth, this.selectedYear);
    this.getMarsInventoryTotals(this.selectedMonth, this.selectedYear, yearlySlice);
  }

  async getMarsInventoryTotals(month, currentYear, yearlySlice){
    this.loading = true;
    month = month + 1;
    let dateRangeCurrentYear = {
      gteYearly: new Date(moment(1 + ', ' + 2018, 'M, YYYY').startOf('month').format()),
      lteYearly: new Date(moment(month + ', ' + currentYear, 'M, YYYY').endOf('month').subtract(1, 'month').format()),
      gte: new Date(moment(month + ', ' + currentYear, 'M, YYYY').startOf('month').format()),
      lte: new Date(moment(month + ', ' + currentYear, 'M, YYYY').endOf('month').format())
    };
    let dateRangePreviousYear = {
      gteYearly: new Date(moment(1 + ', ' + 2018, 'M, YYYY').startOf('month').format()),
      lteYearly: new Date(moment(month + ', ' + (currentYear - 1), 'M, YYYY').endOf('month').subtract(1, 'month').format()),
      gte: new Date(moment(month + ', ' + (currentYear - 1), 'M, YYYY').startOf('month').format()),
      lte: new Date(moment(month + ', ' + (currentYear - 1), 'M, YYYY').endOf('month').format())
    };
    this.currentYearTotals = await funcs.getMarsInventory(dateRangeCurrentYear, month - 1, currentYear, yearlySlice).catch(error => console.log(error));
    this.previousYearTotals = await funcs.getMarsInventory(dateRangePreviousYear, month - 1, currentYear - 1, yearlySlice - 12).catch(error => console.log(error));
    this.currentYearTotals = this.currentYearTotals['result'];
    this.previousYearTotals = this.previousYearTotals['result'];
    // console.log(this.currentYearTotals, this.previousYearTotals);
    this.formatCurrentAndPreviousYearArrays(this.currentYearTotals, 'Current');
    this.formatCurrentAndPreviousYearArrays(this.previousYearTotals, 'Previous');
    this.matchProducts();
    this.loading = false;
  }

  monthDiff(month, year) {
    let months = 12;
    let lowestYear = 2018;
    let slice;
    if (year > lowestYear) {
      slice = months * (year - lowestYear)
      slice = month + months;
    } else if (year === lowestYear) {
      slice = month;
    }
    return slice;
  }

  matchProducts(){
    this.totalRows = [];
    let resultCurrent = this.currentYearTotals.map(a => a['_idCurrent']);
    let resultPrevious = this.previousYearTotals.map(a => a['_idPrevious']);
    let arrayOfId = _.union(resultCurrent, resultPrevious);
    for (var i = 0; i < arrayOfId.length; i++) {
      let indexCurrent = this.currentYearTotals.findIndex(total => total['_idCurrent'] === arrayOfId[i]);
      let indexPrevious = this.previousYearTotals.findIndex(total => total['_idPrevious'] === arrayOfId[i]);
      let current = indexCurrent > -1 ? this.currentYearTotals[indexCurrent] : {};
      let previous = indexPrevious > -1 ? this.previousYearTotals[indexPrevious] : {};
      this.totalRows.push(Object.assign(current, previous));
    }
  }

  changeSold(row, value, year) {
    let newValue = value;
    let documentId = row.documentIdCurrent;
    let query = {
      _id: documentId,
      "totals.year": year
    }
    let update = {
      $set: {
        ['totals.$.amountSold.' + this.selectedMonth]: Number(newValue)
      }
    };
    MeteorObservable.call('update', 'systemOptions', query, update).subscribe((res: any) => {
      if (res > 0) {
        EventEmitterService.Events.emit({
          componentName: "dashboard",
          name: 'success',
          title: 'Amount Sold Updated',
          content: row.productNameCurrent
        });

        let value = {
          _id: Random.id(),
          documentId: documentId,
          collectionName: 'systemOptions',
          type: 'update',
          fieldPath: 'amountSold.' + this.selectedMonth + "number",
          log: Meteor.userId() + ' updated amountSold for ' + documentId,
          value: Number(newValue),
          createdAt: new Date(),
        };
        this.systemLogsService._log$(value).subscribe();
      }
    })
    if (year === this.currentYear) {
      row['soldCurrent'] = value;
    } else {
      row['soldPrevious'] = value;
    }
  }

  returnHeader(month, year){
    month = (month + 1).toString();
    year = year.toString();
    return moment((month + ',' + year), 'M,YYYY').format('MMM, YYYY');
  }

  returnNumber(value){
    let returnValue = isNaN(value) ? 0 : value;
    return returnValue;
  }

  addStringToKeys(object, string){
    for(let key in object) {
      object[key + string] = object[key];
      delete object[key]
    }
  }

  formatCurrentAndPreviousYearArrays(array, string){
    if (array) {
      array.forEach(element => {
        this.addStringToKeys(element, string)
      });
    }
  }

  emittedFunction(event){
    let formattedArr = this.formatDirtyRows(event.value.dirtyRows);
    let value = event.value;
    if (formattedArr.length > 0) {
      let query = {
        _id: value.params._id,
        "totals.year": parseInt(value.params.year),
      }
      let update = {
        $set: {
          ['totals.' + value.params.index + '.soldPerState.' + value.params.monthIndex]: formattedArr
        }
      };
      // console.log(JSON.stringify(query), JSON.stringify(update));
      MeteorObservable.call('update', 'systemOptions', query, update).subscribe((res: any) => {
        if (res > 0) {
          let yearlySlice = this.monthDiff(this.selectedMonth, this.selectedYear);
          this.getMarsInventoryTotals(this.selectedMonth, this.selectedYear, yearlySlice);
        }
      })
    }
  }

  async insertExcelData(excelData) {
    for (var i = 0; i < this.totalRows.length; i++) {
      let row = this.totalRows[i];
      let index = excelData.findIndex(excel => excel['Item Code'] === row['aliasCurrent']);
      console.log(excelData, index, excelData[index]);
      let query = {
        _id: row.documentIdCurrent,
        "totals.year": parseInt(this.selectedYear),
      }
      let update = {
        $set: {
          ['totals.' + row.arrayIndexCurrent + '.soldPerState.' + this.selectedMonth]: excelData[index]['totalsByState']
        }
      };
      await funcs.update('systemOptions', query, update)
    }
    let yearlySlice = this.monthDiff(this.selectedMonth, this.selectedYear);
    this.getMarsInventoryTotals(this.selectedMonth, this.selectedYear, yearlySlice);
  }

  formatDirtyRows(dirtyRows){
    let cleanArr = [];
    for (let i = 0; i < dirtyRows.length; i++) {
      let stateObj
      let row = dirtyRows[i]
      // if (row.override > 0) {
        stateObj = {
          state: row.stateCode,
          total: row.override
        }
        cleanArr.push(stateObj);
      // }
    }
    return cleanArr;
  }

  changeView(lookupData) {
    let obj = {
      view: 'marsStates',
      _id: lookupData.documentIdCurrent ? lookupData.documentIdCurrent : lookupData.documentIdPrevious,
      year: this.selectedYear,
      index: lookupData.arrayIndexCurrent ? lookupData.arrayIndexCurrent : lookupData.arrayIndexPrevious,
      monthIndex: this.selectedMonth,
      pageHeader: moment(this.selectedMonth + 1, 'M').format('MMMM').toUpperCase() + ' ' + this.selectedYear + ' ' + (lookupData.productNameCurrent ? lookupData.productNameCurrent : lookupData.productNamePrevious),
    }
    this.lookupView.emit(obj);
  } 

  reducers(action) {
    switch (action.type) {
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

  getRows(rows) {
  
  }

  select(event) {
    this.router.navigate(['customers/orders/' + event['_id']]);
  }

}
