import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import * as funcs from '../../../../../../both/functions/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from "../../../../services/UserService";
import { Random } from "meteor/random";
import * as XLSX from 'xlsx';
import * as moment from 'moment';
import { SystemLookup } from "../../../../../../both/models/systemLookup.model";
import { SystemLogsService } from "../../../../services/SystemLogs.service";
import { EventEmitterService } from '../../../../services/EventEmitter.service';

@Component({
    selector: 'executive-paymentApprovals',
    template: `
    <mat-card class='fullHeight'>
      <h2 style='margin-top: 0px; float: left;'>Payment Approval</h2>
      <span class='cardIcons'>
        <i class="material-icons" (click)="changeView('paymentDocuments')">exit_to_app</i>
        <i class="material-icons" *ngIf='canCodeAndUpload' (click)="openFileBrowser()">attach_file</i>
      </span>
      <input [hidden]='true' #fileInput id='fileInput' type="file" (change)="onFileChange($event)" multiple="false" />
      <hr style='clear: both;'>
      <div style="overflow-x:auto;">
        <span *ngIf="!loading">
          <div fxLayout="row" fxLayout.xs="column" fxLayout.sm="column" fxLayout.md="column" fxLayoutAlign="space-around center">
            <div fxFlex="50" style='text-align: center'>
              <span style='font-size: 1.7em;'>{{paymentApprovalInfo.charges}}</span>
              <br>
              <span style='font-size: 1.5em;'>
                Charges Need {{!canCodeAndUpload ? 'Review' : 'Codes' }}
              </span>
            </div>
            <div fxFlex="50" style='text-align: center'>
              <span style='font-size: 1.7em;'>{{paymentApprovalInfo.total | customCurrency}}</span>
              <br>
              <span style='font-size: 1.5em;'>Total Amount of Charges</span>
            </div>
          </div>
          <br>
          <div style='font-size: .9em;'>*Last uploaded by {{paymentApprovalInfo.user}} on {{paymentApprovalInfo.date}}</div>
        </span>
        <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
      </div>
    </mat-card>
  `,
    styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutivePaymentApprovals implements OnInit {

  @Input() data: any;
  @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();
  filterConditions: any;
  objLocal: any = {};
  paymentApprovalInfo: any = {};
  lookupData: any = {};
  canCodeAndUpload: boolean = false;
  canReview: boolean = false;
  preApprovePaymentApprovals: boolean = false;
  hiddenColumns: any = [];
  lookupName: any = '';
  secondLookupName: any = '';
  loading: boolean = true;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private userService: UserService, private systemLogsService: SystemLogsService) {
  }

  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.data = {};

    //SET REAL PERMISSION//
    let canCodeAndUpload = await this.userService.user._checkPermission('uploadPaymentApprovals');
    let canReview = await this.userService.user._checkPermission('reviewPaymentApprovals');
    let preApprovePaymentApprovals = await this.userService.user._checkPermission('preApprovePaymentApprovals');

    this.canCodeAndUpload = canCodeAndUpload;
    this.canReview = canReview;
    this.preApprovePaymentApprovals = preApprovePaymentApprovals;
    this.initalVariableSet();

    let name = this.lookupName;
    this.getPaymentApprovalData(name);
    this.findLastUpdated();
  }

  ngOnInit() {
    this.init();
  }

  initalVariableSet(){
    let view = '';
    let secondView = '';
    if (this.canReview) {
      view = 'paymentDocuments'
      secondView = 'paymentReviewLookup';
      this.lookupData.data = { status: 'preapproved' }
    } 
    if (this.canCodeAndUpload || this.preApprovePaymentApprovals) {
      view = 'paymentDocuments';
      secondView = 'paymentCodingLookup';
      if (this.canCodeAndUpload){
        this.lookupData.data = {status: 'pending' };
      }
      if (this.preApprovePaymentApprovals){
        this.lookupData.data = { status: 'coded' };
      }
    }
    this.lookupName = view;
    this.secondLookupName = secondView;
  }

  async getPaymentApprovalData(name) {
    let sub = MeteorObservable.call('findOne', 'systemLookups', { name: name }).subscribe(async (lookup) => {
      let parsed = funcs.parseAll(lookup['methods'][0].args, this.lookupData);
      parsed = this.removeLimitAndSkipAndSort(parsed[0]);
      // if (this.canCodeAndUpload){
      //   parsed.shift();
      // }
      // parsed.push(
      //   {
      //     $addFields: {
      //       amount: { $toDouble: "$amount" }
      //     }
      //   }
      // )
      // console.log(JSON.stringify(parsed))
      let paymentApprovalData = await funcs.runAggregate(lookup['methods'][0].collectionName, parsed)
      // console.log('res',paymentApprovalData)
      paymentApprovalData = paymentApprovalData['result'];
      this.reviewCardInfo(paymentApprovalData)
    });
  }

  csv(rows){
    console.log(rows)
    let formatted = this.csvFormat(rows);
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(formatted)
    XLSX.utils.book_append_sheet(wb, ws, 'test')
    XLSX.writeFile(wb, `${moment().format('M-D-YY')} AMEX.csv`)
  }

  csvFormat(rows){
    let today = moment().format('MMMM D, YYYY');
    let csvArray = [
      ['', 'Transaction Details', '', `Business Centurion® Card / ${today} to ${today}`, '', '', '', ''],
      ['', 'Prepared for', '', '', '', '', '', ''],
      ['', 'Dick Sirotiak', '', '', '', '', '', ''],
      ['', 'Account Number', '', '', '', '', '', ''],
      ['', 'XXXX-XXXXXX-88007', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['Date', 'Receipt', 'Description', 'Card Member', 'Account #', 'Amount', 'GL', 'DESCRIPTION'],
    ];

    for(let row of rows){
      let index = row.accounts.findIndex((obj => obj._id == row.ledgerAccountId));
      let ledgerAccount = row.accounts[index];
      let chargeRow = [
        moment(row.date).format('MM/DD/YYYY'), 
        '', 
        row.description, 
        row.cardMember,
        row.accountNumber,
        row.amount,
        ledgerAccount.label.slice(0,7),
        ledgerAccount.label.slice(10),
      ]
      csvArray.push(chargeRow);
    };

    return csvArray;
  }

  reviewCardInfo(rows){
    this.paymentApprovalInfo = Object.assign(this.paymentApprovalInfo, {
      charges: rows.reduce((a, b) => a + (b['chargesCount'] || 0), 0),
      total: rows.reduce((a, b) => a + (b['charges'] || 0), 0)
    })
    this.loading = false;
  }

  removeLimitAndSkipAndSort(pipeline) {
    let removeValFromIndex = [];
    let arr = pipeline;
    arr.forEach((element, index, object) => {
      if ('$limit' in element || '$skip' in element || '$sort' in element) {
        removeValFromIndex.push(index)
      }
    });
    for (let i = removeValFromIndex.length - 1; i >= 0; i--) {
      arr.splice(removeValFromIndex[i], 1)
    }
    return arr;
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
      this.buildDocumentAndInsert(sheetToJson);
    };
    reader.readAsBinaryString(target.files[0]);
  }

  buildDocumentAndInsert(docs){ 
    let paymentDocument = {
      "_id": Random.id(),
      "type": 'AMEX',
      "createdUserId": Meteor.userId(),
      "charges": this.getDocArray(docs),
      "createdAt": new Date(),
      "tenantId": Session.get('tenantId'),
      "parentTenantId": Session.get('parentTenantId')
    }
    // console.log('paymentDocument', paymentDocument)
    MeteorObservable.call('insert', 'paymentApprovals', paymentDocument)
      .subscribe((result: any) => {
        // console.log(result)
        if(result) {
          EventEmitterService.Events.emit({
            componentName: "dashboard",
            name: 'success',
            title: 'Excel Successfully Uploaded',
            content: ''
          })
          let value = {
            _id: Random.id(),
            documentId: result,
            collectionName: 'paymentApprovals',
            type: 'insert',
            fieldPath: 'paymentApprovals',
            log: Meteor.userId() + ' uploaded document ' + `${result} to payment approvals`,
            value: 'doc',
            createdAt: new Date(),
          }
          this.systemLogsService._log$(value).subscribe();
          this.init()
        } else {
          console.log('error')
        }
      });
  }

  findLastUpdated() {
    let query = [
      {
        "$match": {
          "parentTenantId": Session.get('tenantId')
        }
      },
      {
        "$unwind": "$actions"
      },
      { 
        $match: { 
          'actions.type': 'insert',
          'actions.collectionName': 'paymentApprovals' 
        } 
      },
      {
        "$lookup": {
          "from": "users",
          "localField": "createdUserId",
          "foreignField": "_id",
          "as": "user"
        }
      },
      {
        "$unwind": "$user"
      },
      {
        "$project": {
          "user": {
            "$ifNull": [
              {
                "$concat": [
                  "$user.profile.firstName",
                  " ",
                  "$user.profile.lastName"
                ]
              },
              "$user.email"
            ]
          },
          "documentType": "$actions.collectionName",
          'type': "$actions.type",
          "documentId": "$actions.documentId",
          "date": "$actions.createdAt",
        }
      },
      {
        "$group": {
          "_id": "$documentId",
          "date": {
            "$max": "$date"
          },
          'docs': {
            "$push": {
              "user": "$user",
              "date": "$date"
            }
          }
        }
      },
      {
        "$project": {
          "docs": {
            "$setDifference": [
              {
                "$map": {
                  "input": "$docs",
                  "as": "doc",
                  "in": {
                    "$cond": [
                      { "$eq": ["$date", "$$doc.date"] },
                      "$$doc",
                      false
                    ]
                  }
                }
              },
              [false]
            ]
          }
        }
      },
      { $unwind: '$docs' },
      {
        $project: {
          _id: 1,
          user: '$docs.user',
          date: '$docs.date'
        }
      },
    ]
    MeteorObservable.call('aggregate', 'systemLogs', query).subscribe(account => {
      if (account['result'][0]){
        this.paymentApprovalInfo = Object.assign(this.paymentApprovalInfo, {
          user: account['result'][0].user,
          date: moment(account['result'][0].date).format('M/D/YY h:mmA')
        })
      }
    })
  }

  getDocArray(charges){
    console.log(charges)
    let documents = []
    charges.forEach(charge => {
      let obj = {
        "_id": Random.id(),
        "description": charge.Description,
        "amount": new Decimal(charge.Amount),
        "status": "pending",
        "accountNumber": charge['Account #'], 
        "cardMember": charge['Card Member'], 
        "date": new Date(charge['Date']), 
        "receiptURL": charge['Receipt URL'], 
        "sync": false
      };
      documents.push(obj)
    });

    // console.log('documents', documents)
    return documents;
  }

  clearUrlParams() {
    this.router.navigate(["./", {}], { queryParams: {}, relativeTo: this.activatedRoute });
  }

  emittedFunction(event) {
    // console.log('pyamentApprovals', event)
  }

  async finishReview(rows){
    let reviewRows = [];
    await Promise.all(rows.map(async (row: any) => {
      let status = row.reviewed ? 'review' : 'approved';
      
      if (status == 'review'){
        reviewRows.push(row);
      }

      let query = {
        "_id": row.mainDocId,
        "charges._id": row._id
      }
      let update = {
        $set:
        {
          'charges.$.status': status
        }
      }
      let result = await funcs.callbackToPromise(MeteorObservable.call('update', 'paymentApprovals', query, update));
      let value = {
        _id: Random.id(),
        documentId: row.mainDocId,
        collectionName: 'paymentApprovals',
        type: 'update',
        fieldPath: 'charges.$.status',
        log: Meteor.userId() + ' updated the status for charge ' + `${row.mainDocId}.${row._id} from uploaded to ${status}`,
        value: status,
        createdAt: new Date(),
      }
      this.systemLogsService._log$(value).subscribe();
    }))

    EventEmitterService.Events.emit({
      componentName: "dashboard",
      name: 'success',
      title: 'Charges Reviewed Successfully',
      content: ''
    })

    //sendEmail
    if (reviewRows.length > 0) {
      this.sendEmail(reviewRows);
    }
    
    this.clearUrlParams();
    this.init();
  }

  async sendEmail(rows) {
    function formLayout(obj) {
      return `
      Card Member: ${obj.cardMember}<br>
      Card Member: $${obj.amount}<br>
      Description: ${obj.description}<br>
      Assigned GL: ${obj.glCode}<br>
      Date: ${moment(obj.date).format('M/D/YY h:mmA')}<br>
      <br>
    `}
    let alert = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemAlerts', { name: 'reviewPaymentCharges' }));
    let html = `<body><h3>Charges to Review:</h3>`;
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      html += formLayout(row);      
    }

    let emailData = {};
    emailData['to'] = alert['email'].to;
    emailData['from'] = alert['email'].from;
    emailData['subject'] = alert['email'].subject;
    emailData['html'] = html;
    MeteorObservable.call('sendSupportEmail', emailData).subscribe(email => { })
  }

  async finishCodes(rows, status){
    let valid = false;
    //check if all rows complete
    for (const row of rows) {
      if (!row.ledgerAccountId){
        valid = false
        break;
      } else {
        valid = true;
      }
    }
    if (valid) {
      await Promise.all(rows.map(async (row: any) => {
        if (row.ledgerAccountId){
          let query = {
            "_id": row.mainDocId,
            "charges._id": row._id
          }
          let update = {
            $set:
            {
              'charges.$.status': status,
              'charges.$.ledgerAccountId': row.ledgerAccountId,
              'charges.$.customerId': row.customerId
            }
          }
          let result = await funcs.callbackToPromise(MeteorObservable.call('update', 'paymentApprovals', query, update));
          let value = {
            _id: Random.id(),
            documentId: row.mainDocId,
            collectionName: 'paymentApprovals',
            type: 'update',
            fieldPath: 'charges.$.ledgerAccountId',
            log: Meteor.userId() + ` ${status == 'coded' ? 'added' : 'reviewed'} gl code ${row.ledgerAccountId} for charge ` + `${row.mainDocId}.${row._id}`,
            value: row.ledgerAccountId,
            createdAt: new Date(),
          }
          this.systemLogsService._log$(value).subscribe();
        }
      }))
  
      EventEmitterService.Events.emit({
        componentName: "dashboard",
        name: 'success',
        title: `Charges ${status == 'coded' ? 'Added' : 'Reviewed'} Successfully`,
        content: ''
      })
  
      if (status == 'preapproved') {
        console.log('export to csv')
        this.csv(rows);
      }
      this.clearUrlParams();
      this.init();
    } else {
      EventEmitterService.Events.emit({
        componentName: "dashboard",
        name: 'error',
        title: 'All Charges Need Codes',
        content: ''
      })
    }

  }

  changeView(lookup) {
    let lookupData = Object.assign({
      view: lookup,
      secondLookup: this.secondLookupName,
      pageHeader: 'Payment Approvals',
    }, this.lookupData.data);
    this.lookupView.emit(lookupData);
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

    getRows(rows) {
      this.rows.emit(rows);
    }

    select(event) {
      // this.router.navigate(['customers/orders/' + event['_id']]);
      // window.location.href = 'https://app.yibas.com/orders/' + event._id;
    }
}
