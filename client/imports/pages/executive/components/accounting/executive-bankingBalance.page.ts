import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as funcs from '../../../../../../both/functions/common';
import { MeteorObservable } from "meteor-rxjs";
import { Observable } from "rxjs/Observable";
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { AllCollections } from "../../../../../../both/collections/index";
import { NotificationsService } from 'angular2-notifications';
import { Random } from 'meteor/random';
import { PageResolver } from "../../../../resolvers/PageResolver";
import { EventEmitterService } from '../../../../services/EventEmitter.service';
import { SystemLogsService } from "../../../../services/SystemLogs.service";
import { merge } from 'rxjs';
import * as _ from "underscore";
import { find, findIndex } from 'rxjs/operators';

@Component({
  selector: 'executive-bankingBalance',
  template: `
    <mat-card class='fullHeight'>
      <h2 style='margin-top: 0px; float: left;'>Banking Balance</h2>
      <span class='cardIcons'>
        <h3 style='margin-top: 0px; margin-bottom: 0px; float: right;'>{{mostRecentUpdatedDateTime.user}}</h3><br>
        <small style='float: right; font-weight: bold;'>{{mostRecentUpdatedDateTime.time}}</small>
      </span>
      <hr style='clear: both;'>
      <div style="overflow-x:auto;">
        <table id='tables' *ngIf="!loading">
          <ng-template ngFor let-account [ngForOf]="bankingBalanceAccounts" let-i="index">
            <tr *ngIf='account.displayOnBankingBalanceCard'>
              <th class="rowHead" [ngClass]="{alignCenter: account.align === 'center'}">{{account.description}}</th>
              <td class='alignRight' *ngIf="editBalance">
                <span style='float: left; cursor: pointer;' 
                (click)='verifyRow(account)' 
                matTooltip="Click To Verify Amount">$</span>
                <input style='text-align: right; width: 90%;' matInput placeholder="Balance" 
                step=".01"
                (click)="$event.target.select()"
                (keyup.enter)='rowEdit(account, $event)' 
                (keydown.tab)='rowEdit(account, $event)' 
                (keyup)="onChange(account, $event, i)"
                [ngModel]="bankingBalanceAccounts[i].latestYearFinalBalance | withoutCommaPipe">
              </td>
              <td *ngIf="!editBalance">
                <span style="float: right">{{account.latestYearFinalBalance | customCurrency}}</span><br>
              </td>
            </tr>
          </ng-template>
          <tr *ngIf="AP.latestYearFinalBalance">
            <th class="rowHead" [ngClass]="{alignCenter: AP.align === 'center'}">{{AP.description}}</th>
            <td><span style="float: right">{{AP.latestYearFinalBalance | customCurrency}}</span><br></td>
          </tr>
          <tr *ngIf="frostAccount.latestYearFinalBalance">
            <th class="rowHead" [ngClass]="{alignCenter: frostAccount.align === 'center'}">{{frostAccount.description}}</th>
            <td><span style="float: right">{{frostAccount.latestYearFinalBalance | customCurrency}}</span><br></td>
          </tr>
        </table>
        <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]=""
                     class="app-spinner"></mat-spinner>
      </div>
    </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveBankingBalancePage implements OnInit {

  @Input() data: any;
  filterConditions: any;
  objLocal: any = {};
  bankingBalanceAccounts = [];
  loading: boolean = true;
  editBalance: boolean = false;
  lastUpdatedAccountInfo: any;
  accountIdArr: any;
  mostRecentUpdatedDateTime: any = {};
  AP: any = {};
  frostAccount: any = {};
  // rows: any;
  @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private _service: NotificationsService,
    private systemLogsService: SystemLogsService) {
  }

  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
  }

  onChange(account, event, index) {
    let number = event.target.value;
    number = number.toString().replace(/,/g, '');
    this.bankingBalanceAccounts[index].latestYearFinalBalance = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  ngOnInit() {
    this.init();

    MeteorObservable.call('checkSystemPermission', Meteor.userId(), {name: 'manageBankingBalance'}).subscribe(permission => {
      if (permission['result'].length > 0 && permission['result'][0].status === 'enabled') {
        this.editBalance = true;
      }
    });

    // const sub = MeteorObservable.subscribe('systemOptions', { displayOnBankingBalanceCard: true });
    // const autorun = MeteorObservable.autorun();

    // this.getBalances()
    this.accountIdArr = [];
    this.getAccounts();
    this.getAccountsPayable();
    // merge(sub, autorun).subscribe(() => {
    //   let result = AllCollections['systemOptions'].collection.find().fetch();
    //   result = result.filter(el => el.displayOnBankingBalanceCard === true);
    //   // console.log(result);
    //   // if (result.length === 12) {
    //   // if (this.bankingBalanceAccounts.length < 1) {
    //   // console.log(result);
    //   result.forEach((account) => {
    //     this.accountIdArr.push(account._id)
    //   });
    //   if (this.accountIdArr.length > 0) {
    //     this.findLastUpdated(this.accountIdArr);
    //   }

    //   // this.bankingBalanceAccounts = result;
    //   // } else {
    //   this.checkAndUpdate(result)
    //   // this.getUpdatedDateTime(this.bankingBalanceAccounts)
    //   // }
    //   // console.log(this.bankingBalanceAccounts);
    //   this.loading = false;
    //   // }
    // })
    //******************UNCOMMENT WHEN SYNCING WORKS FOR LEDGER ACCOUNTS*/
    // const sub = MeteorObservable.subscribe('ledgerAccounts', {displayOnBankingBalanceCard: true});
    // const autorun = MeteorObservable.autorun();

    // merge(sub, autorun).subscribe(() => {
    //   this.accountIdArr = [];
    //   let result = AllCollections['ledgerAccounts'].collection.find().fetch();
    //   result.forEach((account) => {
    //     this.accountIdArr.push(account._id)
    //     if (account.override) {
    //       account.latestYearFinalBalance = account.override;
    //     } else {
    //       this.calculateBalance(account);
    //     }
    //   });
    //   if (this.accountIdArr.length > 0) {
    //     this.findLastUpdated(this.accountIdArr);
    //   }
    //   this.bankingBalanceAccounts = result;
    //   this.loading = false;
    // })

    // this.getBalances()
  }

  //HARDCODING ACCOUNTS
  getBalances() {
    let sub = MeteorObservable.call('findOne', 'systemOptions', { name: 'bankingBalanceAccounts' }).subscribe(bankingBalanceAccounts => {
      // console.log(bankingBalanceAccounts);
      this.accountIdArr = [];
      this.bankingBalanceAccounts = [];
      let accounts = bankingBalanceAccounts['value'];
      for (var i = 0; i < accounts.length; i++) {
        this.accountIdArr.push(accounts[i]._id)
        this.bankingBalanceAccounts.push(accounts[i])
      }
      if (this.accountIdArr.length > 0) {
        this.findLastUpdated(this.accountIdArr);
      }
      // console.log(this.bankingBalanceAccounts);
      this.loading = false;
    })
  }

  checkAndUpdate(newResults) {
    for (var i = 0; i < newResults.length; i++) {
      let newAccount = newResults[i];
      let index = this.bankingBalanceAccounts.findIndex(function (el) {
        return el._id === newAccount._id;
      });
      // console.log(found);
      if (index === -1) {
        this.bankingBalanceAccounts.push(newAccount);
      } else {
        this.bankingBalanceAccounts[index].latestYearFinalBalance = parseFloat(newAccount.latestYearFinalBalance.toString().replace(/,/g, '')).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      }
    }
  }

  verifyRow(account) {
    let ledgerAccountId = account._id;
    let query = {
      _id: ledgerAccountId
    }
    let update = {
      $set: {
        'latestYearFinalBalance': account.latestYearFinalBalance
      }
    };
    console.log(query, update);
    MeteorObservable.call('update', 'systemOptions', query, update).subscribe((res: any) => {
      EventEmitterService.Events.emit({
        componentName: "dashboard",
        name: 'success',
        title: 'Banking Balance Verified',
        content: account.description
      })

      let value = {
        _id: Random.id(),
        documentId: account._id,
        collectionName: 'systemOptions',
        type: 'update',
        fieldPath: 'latestYearFinalBalance_number',
        log: Meteor.userId() + ' verified balance for ' + account.description,
        value: account.latestYearFinalBalance,
        createdAt: new Date(),
      }
      this.systemLogsService._log$(value).subscribe();
      this.findLastUpdated(this.accountIdArr)
    })
  }
  
  rowEdit(account, event) {
    let ledgerAccountId = account._id;
    let overrideValue = event.target.value !== '' ? parseFloat(event.target.value.toString().replace(/,/g, '')).toFixed(2) : '0';
    // if (overrideValue) {
    let query = {
      _id: ledgerAccountId
    }
    let update = {
      $set: {
        'latestYearFinalBalance': parseFloat(overrideValue)
      }
    };
    console.log(query, update);
    this.checkAndUpdate(this.bankingBalanceAccounts);
    MeteorObservable.call('update', 'systemOptions', query, update).subscribe((res: any) => {
      if (res > 0) {
        EventEmitterService.Events.emit({
          componentName: "dashboard",
          name: 'success',
          title: 'Banking Balance Updated',
          content: account.description
        })

        let value = {
          _id: Random.id(),
          documentId: ledgerAccountId,
          collectionName: 'systemOptions',
          type: 'update',
          fieldPath: 'latestYearFinalBalance_number',
          log: Meteor.userId() + ' updated balance for ' + account.description,
          value: parseFloat(overrideValue),
          previousValue: account.latestYearFinalBalance,
          createdAt: new Date(),
        }
        this.systemLogsService._log$(value).subscribe();
        this.findLastUpdated(this.accountIdArr)
      }
    })
    // }
  }
  //END HARDCODING

  calculateBalance(account) {
    const latestYearBalance = account.totals[account.totals.length - 1];
    const totalCreditAmounts = latestYearBalance.creditAmounts.reduce((a, b) => a.plus(b));
    const totalDebitAmounts = latestYearBalance.debitAmounts.reduce((a, b) => a.plus(b));
    account.latestYearFinalBalance = latestYearBalance.beginningBalance.minus(totalCreditAmounts).plus(totalDebitAmounts);
  }
  //******************UNCOMMENT WHEN SYNCING WORKS FOR LEDGER ACCOUNTS*/
  // verifyRow(account) {
  //   let ledgerAccountId = account._id;
  //   let query = {
  //     _id: ledgerAccountId
  //   }
  //   let update = {
  //     $set: {
  //       'override': account.latestYearFinalBalance
  //     }
  //   };
  //   MeteorObservable.call('update', 'ledgerAccounts', query, update).subscribe((res: any) => {
  //     EventEmitterService.Events.emit({
  //       componentName: "dashboard",
  //       type: 'success',
  //       title: 'Banking Balance Verified',
  //       content: account.description
  //     })

  //     let value = {
  //       _id: Random.id(),
  //       documentId: account._id,
  //       collectionName: 'ledgerAccounts',
  //       type: 'update',
  //       field: 'override',
  //       log: Meteor.userId() + ' verified balance for ' + account.description,
  //       value: account.latestYearFinalBalance,
  //       date: new Date(),
  //     }
  //     this.systemLogsService.log(value);
  //     this.findLastUpdated(this.accountIdArr)
  //   })
  // }

  // rowEdit(account, event) {
  //   let ledgerAccountId = account._id;
  //   let overrideValue = parseFloat(event.target.value).toFixed(2);
  //   if (parseFloat(overrideValue) !== NaN) {
  //     let query = {
  //       _id: ledgerAccountId
  //     }
  //     let update = {
  //       $set: {
  //         'override': parseFloat(overrideValue)
  //       }
  //     };
  //     MeteorObservable.call('update', 'ledgerAccounts', query, update).subscribe((res: any) => {
  //       if (res > 0) {
  //         EventEmitterService.Events.emit({
  //           componentName: "dashboard",
  //           type: 'success',
  //           title: 'Banking Balance Updated',
  //           content: account.description
  //         })

  //         let value = {
  //           _id: Random.id(),
  //           documentId: account._id,
  //           collectionName: 'ledgerAccounts',
  //           type: 'update',
  //           field: 'override',
  //           log: Meteor.userId() + ' updated balance for ' + account.description,
  //           value: parseFloat(overrideValue),
  //           previousValue: account.latestYearFinalBalance,
  //           date: new Date(),
  //         }
  //         this.systemLogsService.log(value);
  //       }
  //     })
  //   }
  // }

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

  findLastUpdated(idArr) {
    let query = [
      {
        "$match": {
          "parentTenantId": Session.get('tenantId')
        }
      },
      {
        "$unwind": "$actions"
      },
      { $match: { 'actions.documentId': { $in: idArr } } },
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
      //SWTICH WHEN SYNCING WORKS
      // {$match: {documentType: 'ledgerAccounts', type: 'update'}},
      { $match: { documentType: 'systemOptions', type: 'update' } },
      //
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
      this.lastUpdatedAccountInfo = account['result'];
      this.bankingBalanceAccounts.forEach(account => {
        account.updatedInfo = this.lastUpdatedAccountInfo.find(function (element) {
          return element._id === account._id;
        });
        if (account.updatedInfo) {
          account.updatedInfo.date = moment(account.updatedInfo.date).format();
        }
      });
      let accounts = this.bankingBalanceAccounts
      this.getUpdatedDateTime(accounts)
    })

  }

  async getAccounts(){
    let sub = MeteorObservable.call('find', 'systemOptions', { displayOnBankingBalanceCard: true }).subscribe((result: any) => {
      let accounts = result;
      for (let index = 0; index < accounts.length; index++) {
        const account = accounts[index];
        this.accountIdArr.push(account._id);
        this.checkAndUpdate(result);
      }
      this.findLastUpdated(this.accountIdArr);
      this.loading = false;
    });
  }

  async getAccountsPayable(){
    let sub = MeteorObservable.call('find', 'ledgerAccounts', { number: { $in: ['2000-00', '1000-00']} }).subscribe((result: any) => {
      let apIndex = result.findIndex(el =>  el.number === '2000-00');
      let frostIndex = result.findIndex(el =>  el.number === '1000-00');
      
      let AP = result[apIndex];
      this.calculateBalance(AP);
      this.AP = AP;

      let frostAccount = result[frostIndex];
      this.calculateBalance(frostAccount);
      this.frostAccount = frostAccount;
    });
  }

  getRows(rows) {
    this.rows.emit(rows);
  }
  async overviewFunc() {
    EventEmitterService.Events.emit({
      "name": "overviewReport",
      "value": {
        "name": "bankingBalance",
        "title": 'Banking Balance',
        "value": await this.returnData()
      }
    });
  }
  async returnData() {
    let value = this.bankingBalanceAccounts;
    let rows = [];
    for (let index = 0; index < value.length; index++) {
      const el = value[index];
      let obj = {
        label: `${el.description}`,
        amount: el.latestYearFinalBalance
      }
      rows.push(obj)
    }
    let table = {
      rows: rows,
      columns: [
        {
          "prop": "label",
          "type": "string",
        },
        {
          "prop": "amount",
          "type": "dollar",
        },
      ]
    }
    return table;
  }

  getUpdatedDateTime(accounts) {
    let account = accounts[0]
    for (var i = 0; i < accounts.length; i++) {
      if (accounts[i].updatedInfo) {
        account = account.updatedInfo.date > accounts[i].updatedInfo.date ? account : accounts[i];
      }
    }
    let updatedDate = moment(account.updatedInfo.date).format('M/D/YY') + ' ' + moment(account.updatedInfo.date).format('h:mmA');
    let splitName = account.updatedInfo.user.split(' ');
    this.mostRecentUpdatedDateTime['user'] = splitName[0] + ' ' + splitName[1].charAt(0).toUpperCase() + '. ';
    this.mostRecentUpdatedDateTime['time'] = updatedDate;
  }

  select(event) {
    this.router.navigate(['customers/orders/' + event['_id']]);
  }
}
