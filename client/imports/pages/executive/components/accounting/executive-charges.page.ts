import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { UserService } from "../../../../services/UserService";
import * as funcs from '../../../../../../both/functions/common';
import * as XLSX from 'xlsx';

export interface GLAccount {
  _id: string;
  gl: string;
}

@Component({
  selector: 'executive-charges',
  template: `
    <mat-card class='fullHeight'>
      <h2 style='margin-top: 0px; float: left;'>Charges</h2>
      <span class='cardIcons'>
        <i class="material-icons" (click)="openFileBrowser()">attach_file</i>
      </span>
      <input [hidden]='true' #fileInput id='fileInput' type="file" (change)="onFileChange($event)" multiple="false" />
      <hr style='clear: both;'>
      <div style="overflow-x:auto;">
          <table id='tables'>
            <tr>
              <th *ngFor="let header of horizontalHeaders" class="col">{{header}}</th>
            </tr>
            <tr *ngFor="let row of rows">
                <td>{{row.date}}</td>
                <td>{{row.description}}</td>
                <td>{{row.cardMember}}</td>
                <td class='alignRight'>{{row.amount | customCurrency}}</td>
                <td>
                  <mat-form-field class="example-full-width" style='width: 100%;'>
                    <input type="text" placeholder="Pick one" aria-label="GL" matInput 
                    [matAutocomplete]="auto" [formControl]="glControl"
                    (blur)='InputControl($event)'
                    (focus)='setFilter()'
                    >
                    <mat-autocomplete #auto="matAutocomplete" 
                    [displayWith]="displayFn"
                    (optionSelected)='rowUpdate(row, "gl", $event.option.value._id)'>
                      <mat-option *ngFor="let account of filteredGlAccounts | async" 
                      [value]="account">
                        {{account.gl}}
                      </mat-option>
                    </mat-autocomplete>
                  </mat-form-field>
                </td>
                <td class='alignCenter'>
                  <mat-checkbox class="example-margin" (change)='rowUpdate(row, "onPO", $event.checked)'></mat-checkbox>
                </td>
                <td>
                  <mat-form-field style='width: 100%;'>
                    <mat-select placeholder="Status" (selectionChange)="rowUpdate(row, 'status', $event.value)">
                      <mat-option [value]="'test'">
                        Test
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </td>
            </tr>
          </table>
        </div>
    </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveChargesPage implements OnInit {

  @Input() data: any;
  glControl = new FormControl();
  filterConditions: any;
  objLocal: any = {};
  loading: boolean = true;
  pdfLoading: boolean = false;
  horizontalHeaders = [
    'Date',
    'Description',
    'Card Member',
    'Amount',
    'GL Code',
    'PO',
    'Status',
  ];
  glAccounts: GLAccount[];
  filteredGlAccounts: Observable<GLAccount[]>;
  rows: any = [
    {
      _id: '11111',
      date: '02/26/2019',
      description: 'PIZZA HUT 035208 0000 - KILGORE, TX',
      cardMember: 'Katherine Wollslager',
      amount: 38.44,
    },
    {
      _id: '22222',
      date: '02/26/2019',
      description: 'COURTYARD 3C7 - San Angelo, TX',
      cardMember: 'Christina Pitzer',
      amount: 120.91,
    }
  ]
  // rows: any;
  // @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private userService: UserService) {}

  
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    this.getGLCodes();
  }
  
  ngOnInit() {
    this.init();
  }
  
  private _filterAccounts(value: string) {
    const filterValue = value.toLowerCase();
    return this.glAccounts.filter(account => account.gl.toLowerCase().indexOf(filterValue) !== -1);
  }

  displayFn(account?: GLAccount) {
    return account ? account.gl : undefined;
  }

  async getGLCodes(){
    let pipeline = [
      { $match: { "category": "Expenses" } },
      {
        $project: {
          _id: 1,
          gl: { $concat: ['$number', ' - ', '$description'] }
        }
      },
      { $sort: { gl: 1 } }
    ]
    let glAccounts = await funcs.runAggregate('ledgerAccounts', pipeline);
    this.glAccounts = glAccounts['result'];
    // this.setFilter();
  }

  InputControl(event) {
    setTimeout(() => {
      let isValueTrue = this.glAccounts.filter(myAlias =>
        myAlias.gl === event.target.value);
        
      if (isValueTrue.length === 0) {
        event.target.value = null;
      }
    }, 300);
  }

  setFilter() {
    this.filteredGlAccounts = this.glControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.gl),
        map(account => account ? this._filterAccounts(account) : this.glAccounts.slice())
      );
  }

  rowUpdate(row:object, variable:string, value:any){
    row[variable] = value;
    console.log(row, variable, value);
    console.log(this.rows);
  }

  openFileBrowser() {
    let element: HTMLElement = document.getElementById('fileInput') as HTMLElement;
    element.click();
  }

  onFileChange(evt) {
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
      let columns = ['Date', 'Receipt', 'Description', 'Card Member', 'Account #', 'Amount', 'Receipt URL'];
      let sheetToJson = XLSX.utils.sheet_to_json(ws, { header: columns, range: 7 });
      sheetToJson.forEach(element => {
        element['Amount'] = parseFloat(element['Amount'])
      });
      console.log(sheetToJson);
      
      // let result = this.groupAndMap(sheetToJson, 'Item Code', 'productTotals')
      // this.getStateTotalsByProduct(result);
      // this.insertExcelData(result);
    };
    reader.readAsBinaryString(target.files[0]);
  }

  getFilterConditions(action) {
    this.reducers(action);
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

}
