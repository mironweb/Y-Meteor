import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ViewEncapsulation } from '@angular/core';
import * as funcs from '../../../../../../both/functions/common';
import { SystemLogsService } from "../../../../services/SystemLogs.service";
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from "../../../../services/UserService";
import { Random } from "meteor/random";
import * as XLSX from 'xlsx';
import { FormControl } from '@angular/forms';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Observable } from 'rxjs';
import { MeteorObservable } from "meteor-rxjs";
import { EventEmitterService } from "../../../../services/index";
import { map, startWith, switchMap } from 'rxjs/operators';
type AOA = any[][];

export interface Customer {
  _id: string;
  name: string;
  viewValue: string;
  selected?: boolean;
}

@Component({
  selector: 'executive-budgetReport',
  templateUrl: 'executive-budgetReport.page.html',
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveBudgetReport implements OnInit {

  @Input() data: any;
  @ViewChild(BaseChartDirective) chart: BaseChartDirective;
  @ViewChild('salesPeopleInput') salesPeopleInput;
  @ViewChild('productLineInput') productLineInput;
  @ViewChild('categoryInput') categoryInput;
  @ViewChild('customerInput') customerInput;
  @ViewChild('dataInput') dataInput;
  @ViewChild('fileInput') fileInput: HTMLElement;
  
  customerControl = new FormControl();
  accessAll: boolean = false;
  userId: string;
  filterConditions: any;
  objLocal: any = {};
  budgetObj: any = {};
  toggle: any = false;
  loading: any = true;
  insertLoading: any = 0;
  selectedToggle: string = 'budget';
  defaultData: any = ['Budget', 'Actual', 'Prior'];
  allData: any = ['Budget', 'Actual', 'Prior'];
  defaultCategoriesOfAccounts: any = ['Revenue'];
  allCategoriesOfAccounts: any = [];
  categories: Array<any> = [];
  customers: Array<any> = [];
  scrollResults: Array<any> = [];
  filteredCustomers: Observable<Customer[]>;
  selectedCategories: Array<any> = [];
  selectedCustomers: Array<any> = [];
  salesPeople: Array<any> = [];
  selectedSales: Array<any> = [];
  notOnlyRevenue: any = false;
  allCategories: any;
  categoriesOnBudget: any;
  month = moment().month();
  actualMonth = moment().month();
  thisYear = moment().year();
  thisYearRange: any = { startDate: moment().startOf('year'), endDate: moment()};
  lastYearRange: any = {};
  selected:any;
  selectedRange:any = {};
  numbersObject:any = {
    range: {},
    ytdSales: {},
    totalSales: {},
  };
  lineChartData: ChartDataSets[] = [
    { data: [], label: '' }
  ];
  lineChartDataControl: Array<any> = [
    { data: [], label: '' }
  ];
  lineChartLabels: Array<any> = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  lineChartOptions: (ChartOptions) = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10
      }
    },
    legend: {
      onClick: function (e, legendItem, chart?) {
        let index = legendItem.datasetIndex;
        let ci = !chart ? this.chart : chart;
        let meta = ci.getDatasetMeta(index);
        // See controller.isDatasetVisible comment
        meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
        ci.update();
      }
    },
    elements: {
      line: {
        tension: 0
      }
    },
    tooltips: {
      callbacks: {
        label: function (tooltipItem:any, data) {
          tooltipItem.yLabel = (Math.round(tooltipItem.yLabel * 100) / 100).toFixed(2);
          return '$' + tooltipItem.yLabel.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
      }
    },
    scales: {
      yAxes: [{
        ticks: {
          callback: function (value, index, values) {
            let base = Math.floor(Math.log(Math.abs(value)) / Math.log(1000));
            let suffix = 'kmb'[base - 1];
            return suffix ? String(value / Math.pow(1000, base)).substring(0, 3) + suffix : value;
          }
        }
      }]
    }
  };
  chartColors = {
    budget: { // blue
      backgroundColor: 'rgba(13, 213, 252,0.2)',
      borderColor: 'rgba(13, 213, 252,1)',
      pointBackgroundColor: 'rgba(13, 213, 252,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(13, 213, 252,0.8)'
    },
    actual: { // green
      backgroundColor: 'rgba(13, 253, 113,0.2)',
      borderColor: 'rgba(13, 253, 113,1)',
      pointBackgroundColor: 'rgba(13, 253, 113,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(13, 253, 113,1)'
    },
    prior: { // orange
      backgroundColor: 'rgba(255, 131, 0,0.2)',
      borderColor: 'rgba(255, 131, 0,1)',
      pointBackgroundColor: 'rgba(255, 131, 0,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 131, 0,1)'
    },
    ytd: { // black
      backgroundColor: 'rgba(251, 43, 17,0.2)',
      borderColor: 'rgba(251, 43, 17,1)',
      pointBackgroundColor: 'rgba(251, 43, 17,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(251, 43, 17,1)',
      pointStyle: 'rectRot',
      radius: 9,
    },
  }
  lineChartColors: Array<any> = [];
  lineChartLegend: boolean = true;
  lineChartType: string = 'line';
  private readonly RELOAD_TOP_SCROLL_POSITION = 220;


  @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private userService: UserService, private systemLogsService: SystemLogsService) {
  }

  emittedFunction(event) {
    let value = event.value;
    let userId = event.value.params.userId;
    let arr = [{
      ledgerId: value.row._id,
      creditAmounts: this.buildArr(value.row),
    }]

    this.update(arr, userId);

    let columnName = value.column.name;
    let updatedValue = value.row[value.column.prop];

    //Log updates
    let log = {
      _id: Random.id(),
      collectionName: 'ledgerAccounts',
      documentId: value.row._id,
      type: 'update',
      fieldPath: 'total_number.budgets_array',
      log: Meteor.userId() + ' updated ' + columnName + ' ' + this.thisYear + ' to ' + updatedValue + ' for userId ' + userId,
      createdAt: new Date(),
      url: window.location.pathname
    }
    this.systemLogsService._log$(log).subscribe();
  }

  async init() {
    console.log('start init')
    this.loading = true;
    this.userId = Meteor.userId();
    this.lineChartData = [];
    this.lineChartColors = [];
    if (this.defaultData.includes('Budget')) {
      this.lineChartColors.push(this.chartColors.budget);
      await this.budgetFunc(this.defaultCategoriesOfAccounts, this.thisYear, 'Budget');
    }
    if (this.defaultData.includes('Actual')) {
      this.lineChartColors.push(this.chartColors.actual);
      await this.actualFunc(this.thisYear, this.month, 'Actual');
    }
    if (this.defaultData.includes('Prior')) {
      this.lineChartColors.push(this.chartColors.prior);
      this.lineChartColors.push(this.chartColors.ytd);
      await this.priorFunc();
      await this.currentMonthPriorYTD();
    }
    if (this.selected.startDate) {
      await this.dateChange(this.selected);
    }
    this.lineChartDataControl = this.lineChartData;
    this.setVariable();
    this.loading = false;

    // console.log(this.lineChartData)
  }

  setVariable(){
    this.numbersObject = {
      range: {
        budget: this.getTotal('Budget', this.month, this.month + 1),
        actual: this.getTotal('Actual', this.month, this.month + 1),
        prior: this.getTotal('Prior', this.month, this.month + 1),
        mtd: this.getTotal('Prior MTD', this.actualMonth, this.actualMonth + 1)
      },
      ytdSales: {
        budget: this.getTotal('Budget', 0, this.month + 1),
        actual: this.getTotal('Actual', 0, this.month + 1),
        prior: this.getTotal('Prior', 0, this.month + 1),
        ytd: this.getTotal('Prior', 0, this.actualMonth) + this.getTotal('Prior MTD', 0, this.actualMonth + 1)
      },
      totalSales: {
        budget: this.getTotal('Budget', 0, 12),
        actual: this.getTotal('Actual', 0, 12),
        prior: this.getTotal('Prior', 0, 12)
      }
    }
    // console.log(this.numbersObject)
  }

  ngOnInit() {
    let p = MeteorObservable.call('checkSystemPermission', Meteor.userId(), { name: 'accessAllBudgetReport' })
      .pipe(
        map(permission => {
          this.accessAll = (permission['result'].length > 0 && permission['result'][0].status === 'enabled') ? true : false;
        }),
        switchMap(() => MeteorObservable.call('returnUser', Meteor.userId())),
        map((user) => this.getSalesPeople(this.accessAll, user)),
        switchMap(() => MeteorObservable.call('checkSystemPermission', Meteor.userId(), { name: { $in: ['budgetChartData_COS', 'budgetChartData_Expenses', 'budgetChartData_Revenue']}})),
        map((chartDataPermissions) => this.setChartData(chartDataPermissions['result'])),
    ).subscribe(async res => { 
      if (this.accessAll) {

      }
      this.getProductLines();
      this.getCustomers();
      this.allCategories = await funcs.find('categories', {}, {});
      this.init();
    });
  }

  opened(){
    setTimeout(() => {
      this.registerPanelScrollEvent()
    }, 4);
  }
  closed(){
    this.setFilter()
  }

  registerPanelScrollEvent() {
    const panel = this.customerInput.panel.nativeElement;
    panel.addEventListener('scroll', event => this.loadAllOnScroll(event));
  }

  loadAllOnScroll(event) {
    if (event.target.clientHeight + event.target.scrollTop == event.target.scrollHeight) {
      this.filteredCustomers = this.filteredCustomers.pipe(
        map(result => {
          return [...result, ...this.scrollResults.slice(result.length, (result.length + 10))]
        }),
      )
    }
  }

  setFilter() {
    this.filteredCustomers = this.customerControl.valueChanges
    .pipe(
      startWith(''),
      map(value => typeof value === 'string' ? value : value.name),
      map(customer => {
        let value = customer ? customer : this.customerControl.value;
        let res = typeof value === 'string' && value !== ''? this._filterCustomers(value) : this.customers;
        this.scrollResults = typeof value === 'string' && value !== ''? res : this.customers;
        return res.slice(0, 10);
        })
      );
  }

  private _filterCustomers(value: string) {
    if (typeof value === 'string'){
      const filterValue = value.toLowerCase();
      return this.customers.filter(customer => customer.name.toLowerCase().indexOf(filterValue) !== -1);
    } else {
      return this.customers;
    }
  }

  displayFn(customer?: Customer) {
    let displayValue;
    if (Array.isArray(customer)) {
      customer.forEach((el, index) => {
        if (index === 0) {
          displayValue = el.viewValue;
        } else {
          displayValue += ', ' + el.viewValue;
        }
      });
    } else {
      displayValue = customer;
    }
    return displayValue;
  }

  toggleSelection(customer: Customer) {
    customer.selected = !customer.selected;
    if (customer.selected) {
      this.selectedCustomers.push(customer);
    } else {
      const i = this.selectedCustomers.findIndex(value => value.name === customer.name);
      this.selectedCustomers.splice(i, 1);
    }
    this.customerControl.setValue(this.selectedCustomers);
    this.init();
  }

  async budgetFunc(categoryArr, year, label?) {
    let thisYearBudget: any
    // this.lineChartData
    // let index = this.lineChartData.findIndex(el => el.label == label);
    // if(index > -1) {
    //   this.lineChartData = this.lineChartData.splice(index, 1);
    // }


    if (this.selectedCategories.length > 0) {
      let ledgerIds = [];
      this.selectedCategories.map(category => {
        let index = this.categories.findIndex(cat => cat._id === category);
        let element = this.categories[index];
        ledgerIds.push(element.ledgerId)
      })
      thisYearBudget = await this.getGLAccountTotalForYear({ "_id": { $in: ledgerIds } }, year).catch(error => console.log(error));
    } else {
      thisYearBudget = await this.getGLAccountTotalForYear({ "category": { $in: categoryArr } }, year).catch(error => console.log(error));
    }

    thisYearBudget = thisYearBudget['result'][0] ? thisYearBudget['result'][0] : 0;
    delete thisYearBudget['_id'];
    if (this.defaultCategoriesOfAccounts.includes('Expenses') || this.defaultCategoriesOfAccounts.includes('Cost of Sales')) {
      thisYearBudget = this.swapValues(thisYearBudget);
    }

    let thisYearBudgetArr = Object.keys(thisYearBudget).map(key => thisYearBudget[key]);


    let index = this.lineChartData.findIndex(el => el.label == label);
    if (index > -1) {
      this.lineChartData = this.lineChartData.splice(index, 1);
    }

    return this.lineChartData.push({ data: thisYearBudgetArr, label: label })
  }

  async actualFunc(year, numberOfMonths, label?) {
    // console.log(this.lineChartData, label)
    let actualSalesObj: any = await this.getActualTotals(year, numberOfMonths);
    let actualSalesArr = Object.keys(actualSalesObj).map(key => actualSalesObj[key]);
    // console.log(label, actualSalesArr);

    let index = this.lineChartData.findIndex(el => el.label == label);
    if (index > -1) {
      this.lineChartData = this.lineChartData.splice(index, 1);
    }

    return this.lineChartData.push({ data: actualSalesArr, label: label })
  }

  async priorFunc() {
    return await this.actualFunc(this.thisYear - 1, 12, 'Prior');
  }

  async currentMonthPriorYTD() {
    // let currentmonthTD = await this.actualFunc(this.thisYear - 1, 12, 'Prior');
    let res, total = 0, obj = {};
    let range = {
      $gte: new Date(moment((this.actualMonth + 1).toString() + ' ' + (this.thisYear - 1).toString(), 'M YYYY').startOf('month').format()),
      $lte: new Date(moment((this.actualMonth + 1).toString() + ' ' + moment().format('DD') + ' ' + (this.thisYear - 1).toString(), 'M D YYYY').format())
    }

    if (this.defaultCategoriesOfAccounts.includes('Revenue')) {
      if (this.defaultCategoriesOfAccounts.length === 1 && this.selectedSales.length > 0) {
        // console.log('SALES PEOPLE');
        res = await this.getTotalSalespersonSalesInquiry(range, this.selectedSales, this.selectedCategories, this.selectedCustomers).catch(error => console.log(error));
        obj['total'] = res['result'].length > 0 ? res['result'][0].salesPersonTotal : 0;
      } else {
        res = await this.getTotalSales(range, this.selectedCategories, this.selectedCustomers).catch(error => console.log(error));
        obj = res['result'].length > 0 ? res['result'][0] : 0;
      }
    }
    let arr = []
    for (let index = 0; index < 12; index++) {
      arr.push(index == this.actualMonth ? obj['total'] : null)
    }
    return this.lineChartData.push({ data: arr, label: 'Prior MTD' })
    // return await this.actualFunc(this.thisYear - 1, 12, 'Prior');
  }

  async getActualTotals(year, numberOfMonths) {
    let yearSalesObj = {}, expGL: any, cos: any

    if (this.defaultCategoriesOfAccounts.includes('Expenses')) {
      expGL = await this.getGLAccountTotalForYear({ "category": { $in: ['Expenses'] } }, year, true).catch(error => console.log(error));
      expGL = expGL['result'][0] ? expGL['result'][0] : 0;
      expGL = this.swapValues(expGL);
    }
    if (this.defaultCategoriesOfAccounts.includes('Cost of Sales')) {
      cos = await this.getGLAccountTotalForYear({ "category": { $in: ['Cost of Sales'] } }, year, true).catch(error => console.log(error));
      cos = cos['result'][0] ? cos['result'][0] : 0;
      cos = this.swapValues(cos);
    }

    for (let i = 0; i < 12; i++) {
      let res, range, total = 0, obj = {};
      if (numberOfMonths >= i) {
        range = {
          $gte: new Date(moment((i + 1).toString() + ' ' + year.toString(), 'M YYYY').startOf('month').format()),
          $lte: new Date(moment((i + 1).toString() + ' ' + year.toString(), 'M YYYY').endOf('month').format())
        }
        if (this.defaultCategoriesOfAccounts.includes('Revenue')) {
          if (this.defaultCategoriesOfAccounts.length === 1 && this.selectedSales.length > 0) {
            // console.log('SALES PEOPLE');
            res = await this.getTotalSalespersonUserDefined(range, this.selectedSales, this.selectedCategories, this.selectedCustomers).catch(error => console.log(error));
            obj['total'] = res['result'].length > 0 ? res['result'][0].salesPersonTotal : 0;
          } else {
            res = await this.getTotalSales(range, this.selectedCategories, this.selectedCustomers).catch(error => console.log(error));
            obj = res['result'].length > 0 ? res['result'][0] : 0;
          }
        }
        // console.log('~~~', cos, obj['total']);
        if (this.defaultCategoriesOfAccounts.length === 1) {
          switch (this.defaultCategoriesOfAccounts[0]) {
            case 'Revenue':
              res = obj ? Math.abs(obj['total']) : 0;

              break;
            case 'Cost of Sales':
              res = obj ? Math.abs(cos[i.toString()]) : 0;

              break;
            case 'Expenses':
              res = obj ? Math.abs(expGL[i.toString()]) : 0;

              break;
            default:

          }
        } else if (this.defaultCategoriesOfAccounts.length > 1) {
          if (this.defaultCategoriesOfAccounts.includes('Revenue')) {
            total += obj['total'];
          }
          if (this.defaultCategoriesOfAccounts.includes('Cost of Sales')) {
            total -= cos[i.toString()];
          }
          if (this.defaultCategoriesOfAccounts.includes('Expenses')) {
            total -= expGL[i.toString()];
          }
          res = total;
        } else if (this.defaultCategoriesOfAccounts.length === 3) {
          // console.log(expGL);
        }

      }
      yearSalesObj[i] = res ? res : 0;
    }
    return yearSalesObj;
  }

  async getTotalSalespersonUserDefined(dateRange, salesIds, productLine, customerIds) {
    let res;
    let match = {
      'type': {
        $in: ['standard', 'credit memo', 'debit memo']
      },
      'status': 'complete',
      'date': dateRange,
      ...(customerIds.length > 0 && {
        "customerId": {
          "$in": this.returnArrayByObjKey(customerIds, '_id')
        }
      }),
    }

    res = await funcs.getTotalSalespersonUserDefined(match, salesIds, productLine);
    return res;
  }

  // getPercentChange(toggle, rangeStart, rangeEnd) {
  //   let options = {};
  //   let numerator, denominator;

  //   if (this.defaultData.length == 3){
  //     numerator = toggle == 'budget' ? 'Budget' : 'Prior';
  //     denominator = 'Actual';
  //   } else {
  //     numerator = this.includes(this.defaultData, 'Budget') ? 'Budget' : 'Prior';
  //     denominator = this.includes(this.defaultData, 'Actual') ? 'Actual' : 'Prior';
  //   }

  //   options = {
  //     numerator: this.getTotal(numerator, rangeStart, rangeEnd),
  //     denominator: this.getTotal(denominator, rangeStart, rangeEnd)
  //   }

  //   return funcs.percentChange(options);
  // }

  _getPercentChange(obj) {
    let options = {};
    let numerator, denominator;

    if (this.defaultData.length == 3){
      numerator = this.selectedToggle == 'budget' ? 'budget' : 'prior';
      denominator = 'actual';
    } else {
      numerator = this.includes(this.defaultData, 'Budget') ? 'budget' : 'prior';
      denominator = this.includes(this.defaultData, 'Actual') ? 'actual' : 'prior';
    }

    options = {
      numerator: obj[numerator],
      denominator: obj[denominator]
    }

    return funcs.percentChange(options);
  }

  
  // percentChange(numerator, denominator) {
  //   let options = { numerator, denominator};
  //   return funcs.percentChange(options);
  // }
  
  // getPlusOrMinus(toggle, rangeStart, rangeEnd) {
  //   let n, d;
  //   if (this.defaultData.length == 3) {
  //     n = toggle == 'budget' ? 'Budget' : 'Prior';
  //     d = 'Actual';
  //   } else {
  //     n = this.includes(this.defaultData, 'Budget') ? 'Budget' : 'Prior';
  //     d = this.includes(this.defaultData, 'Actual') ? 'Actual' : 'Prior';
  //   }
    
  //   n = this.getTotal(n, rangeStart, rangeEnd);
  //   d = this.getTotal(d, rangeStart, rangeEnd);
    
  //   return d - n;
  // }

  _getPlusOrMinus(obj) {
    let n, d;
    if (this.defaultData.length == 3) {
      n = this.selectedToggle == 'budget' ? 'budget' : 'prior';
      d = 'actual';
    } else {
      n = this.includes(this.defaultData, 'Budget') ? 'budget' : 'prior';
      d = this.includes(this.defaultData, 'Actual') ? 'actual' : 'prior';
    }
    
    n = obj[n];
    d = obj[d];
    
    return d - n;
  }

  getPercentChangeRange(toggle, selectedRange) {
    let options = {};
    let numerator, denominator;
    numerator = toggle == 'budget' ? 'budget' : 'prior';
    denominator = 'current';
    options = {
      numerator: selectedRange[numerator],
      denominator: selectedRange[denominator]
    }

    return funcs.percentChange(options);
  }

  getPlusOrMinusRange(toggle, selectedRange) {
    let n, d;
    n = toggle == 'budget' ? 'budget' : 'prior';
    d = 'current';

    n = selectedRange[n];
    d = selectedRange[d];

    return d - n;
  }

  reduceArr(arr, start, end) {
    let slicedArr = arr.slice(start, end);
    let sum = slicedArr.reduce(function (accumulator, currentValue) {
      return accumulator + currentValue;
    }, 0)
    return sum;
  }

  swapValues(obj) {
    for (let month in obj) {
      obj[month] = Math.abs(obj[month])
    }
    return obj;
  }

  includes(arr, element) {
    return arr.includes(element) ? true : false;
  }

  formatMonthName(month) {
    return moment(month + 1, 'M').startOf('month').format('MMMM')
  }

  async dateChange(event) {
    let format = 'MMM, DD'
    let current, prior, obj = {};
    if (event.startDate && event.endDate) {
      let range = {
        $gte: new Date(event.startDate.format()),
        $lte: new Date(event.endDate.format())
      }
      let rangePrior = {
        $gte: new Date(event.startDate.subtract(1, 'year').format()),
        $lte: new Date(event.endDate.subtract(1, 'year').format())
      }
      current = await this.getTotalSalespersonUserDefined(range, this.selectedSales, this.selectedCategories, this.selectedCustomers).catch(error => console.log(error));
      prior = await this.getTotalSalespersonUserDefined(rangePrior, this.selectedSales, this.selectedCategories, this.selectedCustomers).catch(error => console.log(error));
      obj['current'] = current['result'].length > 0 ? current['result'][0].salesPersonTotal : 0;
      obj['prior'] = prior['result'].length > 0 ? prior['result'][0].salesPersonTotal : 0;
      obj['budget'] = this.getBudgetRange(event);
      obj['title'] = event.startDate.format(format) + ' - ' + event.endDate.format(format);

      let n, d;
      n = this.includes(this.defaultData, 'Budget') ? 'budget' : 'prior';
      d = this.includes(this.defaultData, 'Actual') ? 'current' : 'prior';

      n = obj[n];
      d = obj[d];
      // obj['plusOrMinus'] = n > d ? d - n : (n - d) * -1;
      // obj['percentChange'] = this.percentChange(n, d);


      this.selectedRange = obj;
      //manually reset range
      this.selected = { startDate: event.startDate.add(1, 'year'), endDate: event.endDate.add(1, 'year') }
    }
  }

  getBudgetRange(range){
    let start = range.startDate;
    let end = range.endDate;
    let budgetRangeTotal = 0;
    for (let index = start.month(); index <= end.month(); index++) {
      let budget = this.getTotal('Budget', index, index + 1)
      let daysInMonthControl = moment(index + 1, 'M').daysInMonth();
      let daysInMonth = daysInMonthControl;
      if (start.month() != end.month()) {
        if (index == start.month()) {
          daysInMonth = daysInMonth - start.date();
        } else if (index == end.month()) {
          daysInMonth = end.date();
        }
      } else {
        daysInMonth = end.date() - start.date();
      }
      budgetRangeTotal += daysInMonth * (budget / daysInMonthControl);
    }
    return budgetRangeTotal;
  }

  arrayFromArrOfObj(arrOfObj, key) {
    let arr = [];
    for (var i = 0; i < arrOfObj.length; i++) {
      let element = arrOfObj[i];
      arr.push(element[key])
    }
    return arr;
  }

  async getSalesPeople(accessAll, user?) {
    let idArr:any = []
    let salesPeopleArr = await funcs.salesPeople({});
    this.salesPeople = salesPeopleArr['result'];
    if (!accessAll) {
      idArr = user["manages"] ? [...user["manages"], ...[Meteor.userId()]] : [[Meteor.userId()]];
      this.salesPeople = this.salesPeople.filter(person => idArr.includes(person._id));
    }
    this.selectedSales = this.salesPeople.map(person => person._id);

  }

  async getTotalSalespersonSalesInquiry(dateRange, salesIds, productLine, customerIds) {
    let match = {
      'type': {
        $in: ['standard', 'credit memo', 'debit memo']
      },
      'status': 'complete',
      'date': dateRange,
      ...(customerIds.length > 0 && {
        "customerId": {
          "$in": this.returnArrayByObjKey(customerIds, '_id')
        }
      }),
    }

    return await funcs.getTotalSalespersonSalesInquiry(match, salesIds, productLine);
  }

  onChange(event, selectName) {
    this.notOnlyRevenue = (this.defaultCategoriesOfAccounts.length !== 1 || this.defaultCategoriesOfAccounts[0] !== 'Revenue') ? true : false;
    if (this.notOnlyRevenue && this.accessAll) {
      this.selectedSales = []
    }

    switch (selectName) {
      case 'category':
        this.defaultCategoriesOfAccounts = event;
        // this.init();
        break;
      case 'chart':
        this.defaultData = event;
        // this.updateChart(event);
        break;
      case 'salesperson':
        if (this.accessAll){
          this.selectedSales = event;
        } else if (!this.accessAll && this.salesPeople.length > 1) {
          this.selectedSales = event.length > 0 ? event : [Meteor.userId()] 
        }
        // this.init();
        break;
      case 'productLine':
        this.selectedCategories = event;
        // this.init();
        break;
      default:
    }
    // this.init();
  }

  updateChart(event){
    let index, index2;
    switch (event) {
      case 'Budget':
      case 'Actual':
        index = this.chart.chart.legend.legendItems.findIndex(el => el.text === event)
        this.chart.options.legend.onClick('', this.chart.chart.legend.legendItems[index], this.chart.chart)
        break;
        case 'Prior':
        index = this.chart.chart.legend.legendItems.findIndex(el => el.text === event)
        index2 = this.chart.chart.legend.legendItems.findIndex(el => el.text === 'Prior MTD')
        
        this.chart.options.legend.onClick('', this.chart.chart.legend.legendItems[index], this.chart.chart)
        this.chart.options.legend.onClick('', this.chart.chart.legend.legendItems[index2], this.chart.chart)
        break;
    
      default:
        break;
    }
  }

  async getProductLines() {
    let pipeline = [
      {
        "$match": {
          "category": {
            "$in": [
              "Revenue"
            ]
          }
        }
      },
      {
        "$project": {
          "_id": 1,
          "number": 1,
          "description": 1,
          "category": 1
        }
      },
      {
        "$lookup": {
          "from": "categories",
          "let": {
            "ledgerId": "$_id"
          },
          "pipeline": [
            {
              "$match": {
                "$expr": {
                  "$eq": [
                    "$$ledgerId",
                    "$salesAccountId"
                  ]
                }
              }
            },
            {
              "$sort": {
                "name": 1
              }
            },
            {
              "$match": {
                "description": {
                  "$gt": ""
                }
              }
            },
            {
              "$group": {
                "_id": "$salesAccountId",
                'categoryId': { '$first': '$_id' },
                "number": {
                  "$first": {
                    "$concat": [
                      "$name",
                      " - ",
                      "$description"
                    ]
                  }
                }
              }
            }
          ],
          "as": "category"
        }
      },
      {
        "$unwind": "$category"
      },
      {
        "$project": {
          "_id": '$category.categoryId',
          "name": "$category.number",
          "ledgerId": "$_id"
        }
      },
      {
        "$sort": {
          "name": 1
        }
      }
    ];

    let categories = await funcs.runAggregate('ledgerAccounts', pipeline);
    this.categories = categories['result'];
    this.selectedCategories = this.categories.map(category => category._id);
  }
  async getCustomers() {
    let pipeline = [
      { "$match": { "_id": { "$ne": '' } } },
      {
        "$project": {
          "_id": 1,
          "viewValue": '$name',
          "name": {
            "$concat": [
              "$number",
              " - ",
              "$name"
            ]
          }
        }
      },
      {
        "$sort": {
          "name": 1
        }
      }
    ];

    let customers = await funcs.runAggregate('customers', pipeline);

    this.customers = customers['result'];
    this.setFilter();
  }

  async getTotalSales(dateRange, productLine, customerIds) {
    let match = {
      'type': {
        $in: ['standard', 'credit memo']
      },
      'status': 'complete',
      'date': dateRange,
      ...(customerIds.length > 0 && {
        "customerId": {
          "$in": this.returnArrayByObjKey(customerIds, '_id')
        }
      }),
    }

    return await funcs.getTotalSalesInquiry(match, productLine);
  }

  returnArrayByObjKey(arrOfObj, key) {
    return arrOfObj.map(x => x[key])
  }

  closeInput(event, name) {
    this[name].close();
  }

  chartClicked(e) {
    // console.log(e);
    // console.log(this.lineChartOptions.legend);
    if (e.active.length > 0) {
      this.monthChange(e.active[0]._index)
    }
  }

  setChartData(res) {
    for (let index = 0; index < res.length; index++) {
      const element = res[index];
      let data
      if (element.status == 'enabled'){
        switch (element.name) {
          case 'budgetChartData_Expenses':
            data = 'Expenses'
            break;
        
          case 'budgetChartData_COS':
            data = 'Cost of Sales'
            break;
        
          case 'budgetChartData_Revenue':
            data = 'Revenue'
            break;
        
          default:
            break;
        }
        this.allCategoriesOfAccounts.push(data);
      }
    }
    this.allCategoriesOfAccounts.sort();
  }

  monthChange(monthNumber) {
    this.month = monthNumber;
  }

  getTotal(label, start, end) {
    let index = this.lineChartData.findIndex(data => data.label === label);
    if (this.lineChartData[index]) {
      return this.reduceArr(this.lineChartData[index]['data'], start, end);
    } else {
      return 0;
    }
  }

  async getGLAccountTotalForYear(match, year, budgetArr?) {
    if (this.selectedSales.length > 0) {
      return await funcs.getMonthlyBudgetPerSalesPerson(match, year, this.selectedSales);
    } else {
      return await funcs.getMonthlyBudget(match, year, budgetArr);
    }
  }

  async onFileChange(evt) {
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
      let sheetToJson = XLSX.utils.sheet_to_json(ws, { header: ['name', '2019 BUDGET', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] });
      // this.formatBudgetArrays(salesPeopleBudget);
      this.format(sheetToJson)

    };
    reader.readAsBinaryString(target.files[0]);
  }

  async format(excelSheet) {
    console.log('start')
    let user, updateArr = [];
    for (let i = 0; i < excelSheet.length; i++) {
      let row = excelSheet[i];
      let category;
      let split = row.name.trim().split(' - ');
      if (split.length < 2) {
        split = row.name.trim().split('-');
      }
      if (row.name !== 'CREDITS') {
        if (i > 0) {
          category = this.returnCategory(split[0], this.allCategories);
          if (category) {
            let query = {
              _id: category.salesAccountId,
              "totals.year": 2019
            }
            let update = {
              "$addToSet": {
                "totals.$.budgets": {
                  _id: user._id,
                  creditAmounts: this.buildArr(row),
                  debitAmounts: []
                }
              }
            }
            updateArr.push({ ledgerId: category.salesAccountId, creditAmounts: this.buildArr(row) })

          }
        } else {
          user = this.returnUser(split[1]);
          user = user[0];
        }
      }

    }
    let holder = {};

    updateArr.forEach(function (d) {
      if (holder.hasOwnProperty(d.ledgerId)) {
        holder[d.ledgerId] = holder[d.ledgerId].map(function (num, idx) {
          return num + d.creditAmounts[idx];
        });

      } else {
        holder[d.ledgerId] = d.creditAmounts;
      }
    });
    let obj2 = [];

    for (var prop in holder) {
      obj2.push({ ledgerId: prop, creditAmounts: holder[prop] });
    }
    this.update(obj2, user._id)
  }

  async update(arr, userId) {
    for (let i = 0; i < arr.length; i++) {
      this.insertLoading = ((i + 1) / arr.length) * 100;
      let obj = arr[i];
      let query = {
        _id: obj.ledgerId,
        "totals.year": 2019
      }
      let update = {
        "$addToSet": {
          "totals.$.budgets": {
            _id: userId,
            creditAmounts: obj.creditAmounts,
            debitAmounts: []
          }
        }
      }
      let options = {
        arrayFilters: [
          {
            "i.year": this.thisYear
          },
          {
            "j._id": userId
          }
        ]
      }
      //Try and update first
      let updateResult = await funcs.updateWithOptions('ledgerAccounts', {
        _id: obj.ledgerId,
      }, {
          $set: {
            "totals.$[i].budgets.$[j]": {
              "_id": userId,
              "creditAmounts": obj.creditAmounts,
              "debitAmounts": []
            }
          }
        }, options);
      //insert if doesn't update
      if (updateResult['result'] == 0) {
        await funcs.update('ledgerAccounts', query, update);
      }

    }
    this.insertLoading = 0;
    this.init();
    // console.log('end')
  }

  buildArr(row) {
    let total, arr = [];
    for (let i = 1; i <= 12; i++) {
      if (typeof row[i] === 'string') {
        total = row[i].trim();
        if (total === '$-') {
          total = 0;
        } else if (total.includes('(')) {
          total = total.replace(/[()]/g, '');
          total = parseFloat(total.replace(/\$|,/g, '')) * -1;
        } else {
          total = parseFloat(total.replace(/\$|,/g, ''))
        }
      } else {
        total = row[i]
      }
      arr.push(total)
    }
    // console.log(arr)
    return arr;
  }

  findElement(value, key, arr) {
    let index = arr.findIndex((obj => obj[key] === value));
    return arr[index];
  }

  returnCategory(name, categories) {
    let category = name;
    let index = categories.findIndex(cat => cat.name === category)
    let categoryObj = categories[index];
    return categoryObj;
  }

  returnUser(name) {
    let salesPerson;
    name = this.titleCase(name);
    name = name.split(' ');

    if (name[0] === 'House') {
      salesPerson = Meteor.users.find({ _id: 'House' }).fetch();
    } else if (name[0] === 'Watermark') {
      salesPerson = Meteor.users.find({ _id: 'House-Watermark' }).fetch();
    } else {
      salesPerson = Meteor.users.find({ "profile.firstName": name[0], "profile.lastName": name[1] }).fetch();
    }
    return salesPerson;
  }

  titleCase(str) {
    return str.toLowerCase().split(' ').map(function (word) {
      return word.replace(word[0], word[0].toUpperCase());
    }).join(' ');
  }

  getIndexes(data) {
    let arrayOfIndexes = [];
    for (let i = 0; i < data[0].length; i += 6) {
      if (data[0][i]) {
        let name = data[0][i].trim().substring(7).split(' ');
        let salesPerson;
        if (name[0] === 'House') {
          salesPerson = [{ _id: 'House' }];
        } else {
          salesPerson = Meteor.users.find({ "profile.firstName": name[0], "profile.lastName": name[1] }).fetch();
        }
        if (salesPerson[0]['_id']) {
          arrayOfIndexes.push({
            "salesPerson": data[0][i].trim().substring(7),
            '_id': salesPerson[0]['_id'],
            "2019 BUDGET": i + 1,
            "2018 SALES": i + 2,
            "VARIANCE": i + 3,
            "VAR %": i + 4,
          })
        }
      }
    }
    return arrayOfIndexes;
  }

  buildCategoryObj(data, indexes, categories) {
    for (let i = 0; i < indexes.length; i++) {
      let individualSalesPerson = indexes[i];
      let arrayOfCategoryPerSalesPerson = [];
      this.categoriesOnBudget = [];
      for (let j = 1; j < data.length; j += 2) {
        if (data[j][0] !== 'CREDITS') {
          let total = data[j + 1] ? data[j + 1][individualSalesPerson['2019 BUDGET']].trim() : 0;
          if (total === '$-') {
            total = 0;
          } else if (total.includes('(')) {
            total = total.replace(/[()]/g, '');
            total = parseFloat(total.replace(/\$|,/g, '')) * -1;
          } else {
            total = parseFloat(total.replace(/\$|,/g, ''))
          }

          let category = data[j][0].split(' - ');
          let index = categories.findIndex(cat => cat.name === category[0])
          let categoryObj = categories[index];
          this.categoriesOnBudget.push({
            category: categoryObj.name,
            categoryId: categoryObj._id,
            salesAccountId: categoryObj.salesAccountId,
          })
          arrayOfCategoryPerSalesPerson.push({
            category: categoryObj.name,
            categoryId: categoryObj._id,
            salesAccountId: categoryObj.salesAccountId,
            budget: total,
          })
          if (data[j][0] === '9999 - SPECIAL INVENTORY') break;
        }
      }
      individualSalesPerson['budget'] = arrayOfCategoryPerSalesPerson;
    }
    return indexes;
  }

  formatBudgetArrays(salesPeopleArray) {
    // console.log(this.categoriesOnBudget);
    for (let i = 0; i < this.categoriesOnBudget.length; i++) {
      let categoryOnBudget = this.categoriesOnBudget[i];
      let arr = this.getArrayOfBudget(salesPeopleArray, categoryOnBudget);
      // console.log(categoryOnBudget.category, categoryOnBudget.salesAccountId, arr);
    }
  }

  getArrayOfBudget(salesPeopleArray, categoryOnBudget) {
    let arr = []
    for (let i = 0; i < salesPeopleArray.length; i++) {
      let salesperson = salesPeopleArray[i];

      let index = salesperson.budget.findIndex(person => person.categoryId === categoryOnBudget.categoryId);
      arr.push({
        _id: salesperson._id,
        budget: salesperson.budget[index].budget
      })
    }
    return arr;
  }


  openFileBrowser(event) {
    let element: HTMLElement = document.getElementById('fileInput') as HTMLElement;
    element.click();
  }

  getHiddenColumns() {
    let hideColumns = [];
    if (!this.defaultData.includes('Budget')) {
      hideColumns = [...hideColumns, ...['budgetMonth', 'budgetYTD', 'AYTDVSBYTD', 'AMTDVSBMTD']];
    }
    if (!this.defaultData.includes('Actual')) {
      hideColumns = [...hideColumns, ...['actualMonth', 'actualYTD', 'AYTDVSBYTD', 'AMTDVSBMTD', 'AYTDVSPYTD', 'AMTDVSPMTD', 'rangeCurrent', 'rangePrevious']];
    }
    if (!this.defaultData.includes('Prior')) {
      hideColumns = [...hideColumns, ...['previousMonth', 'previousYTD', 'AYTDVSPYTD', 'AMTDVSPMTD']];
    }
    if(this.selected.startDate){
      hideColumns = [...hideColumns, ...['budgetMonth', 'actualMonth', 'previousMonth', 'AMTDVSBMTD', 'AMTDVSPMTD']];
    }
    let unique = [...new Set(hideColumns)];
    console.log(unique)
    return unique;
  }

  changeView(event) {
    let user = Meteor.users.find({ _id: this.selectedSales[0] }).fetch();
    let obj = {};
    let range = this.selected.startDate ? true : false;
    
    switch (event) {
      case 'budgetUpdate':
        obj = {
          view: 'budgetUpdate',
          userId: this.selectedSales[0],
          pageHeader: 'Budget > ' + user[0].profile.firstName + ' ' + user[0].profile.lastName,
        }
        break;

      case 'userDefinedBudget':
        obj = {
          view: 'userDefinedBudget',
          userId: this.selectedSales,
          currentYear: this.thisYear,
          month: this.month,
          currentYearGte: new Date(this.thisYearRange.startDate.format()),
          priorYearGte: new Date(this.thisYearRange.startDate.subtract(1, 'years').format()),
          currentYearLte: new Date(this.thisYearRange.endDate.format()),
          priorYearLte: new Date(this.thisYearRange.endDate.subtract(1, 'years').format()),
          pageHeader: 'User Defined Sales Report > ' + (this.selectedSales.length > 1 ? this.selectedSales.length + ' Salespeople Selected' : user[0].profile.firstName + ' ' + user[0].profile.lastName),
          hideColumns: this.getHiddenColumns(),
          ...(range && { 
            currentYearGteRange: new Date(this.selected.startDate.format()),
            priorYearGteRange: new Date(this.selected.startDate.subtract(1, 'years').format()),
            currentYearLteRange: new Date(this.selected.endDate.format()),
            priorYearLteRange: new Date(this.selected.endDate.subtract(1, 'years').format()),
          })
        }
        //manually reset range
        if(this.selected.startDate){
          this.selected = { startDate: this.selected.startDate.add(1, 'year'), endDate: this.selected.endDate.add(1, 'year') }
        }
        break;

      default:
        break;
    }
    console.log(obj)
    this.lookupView.emit(obj);
  }

  async overviewFunc() {
    EventEmitterService.Events.emit({
      "name": "overviewReport",
      "value": {
        "name": "executive-budgetReport",
        "title": 'Budget',
        "value": await this.returnData()
      }
    });
  }

  returnData(){
    // this.numbersObject
    let rows = [
      {
        columnOne: '',
        columnTwo: !this.selected.startDate ? `${this.formatMonthName(this.month)} Sales` : this.selectedRange.title,
        columnThree: ''
      },
      (this.includes(this.defaultData, 'Budget')? {
        columnOne: 'Budget',
        columnTwo: funcs.formatMoney(!this.selected.startDate ? this.numbersObject.range.budget : this.selectedRange.budget),
        columnThree: funcs.formatMoney(!this.selected.startDate? this._getPlusOrMinus(this.numbersObject.range) : this.getPlusOrMinusRange(this.selectedToggle, this.selectedRange))
      } : undefined),
      (this.includes(this.defaultData, 'Actual')? {
        columnOne: 'Actual',
        columnTwo: funcs.formatMoney(!this.selected.startDate ? this.numbersObject.range.actual : this.selectedRange.current),
        columnThree: ((!this.selected.startDate ? this._getPercentChange(this.numbersObject.range) : this.getPercentChangeRange(this.selectedToggle, this.selectedRange)) * 100).toFixed(2)
      } : undefined),
      (this.includes(this.defaultData, 'Prior')? {
        columnOne: 'Prior',
        columnTwo: funcs.formatMoney(!this.selected.startDate ? this.numbersObject.range.prior : this.selectedRange.prior),
        columnThree: ''
      } : undefined),
      (this.includes(this.defaultData, 'Prior') && (this.month == this.actualMonth) ? {
        columnOne: `${this.thisYear - 1} MTD`,
        columnTwo: funcs.formatMoney(this.numbersObject.range.mtd),
        columnThree: ''
      } : undefined),
      {
        columnOne: '',
        columnTwo: `YTD Sales`,
        columnThree: ''
      },
      (this.includes(this.defaultData, 'Budget')? {
        columnOne: 'Budget',
        columnTwo: funcs.formatMoney(this.numbersObject.ytdSales.budget),
        columnThree: funcs.formatMoney(this._getPlusOrMinus(this.numbersObject.ytdSales))
      } : undefined),
      (this.includes(this.defaultData, 'Actual')? {
        columnOne: 'Actual',
        columnTwo: funcs.formatMoney(this.numbersObject.ytdSales.actual),
        columnThree: (this._getPercentChange(this.numbersObject.ytdSales) * 100).toFixed(2)
      } : undefined),
      (this.includes(this.defaultData, 'Prior')? {
        columnOne: 'Prior',
        columnTwo: funcs.formatMoney(this.numbersObject.ytdSales.prior),
        columnThree: ''
      } : undefined),
      (this.includes(this.defaultData, 'Prior') && (this.month == this.actualMonth) ? {
        columnOne: `${this.thisYear - 1} YTD`,
        columnTwo: funcs.formatMoney(this.numbersObject.ytdSales.ytd),
        columnThree: ''
      } : undefined),
      {
        columnOne: '',
        columnTwo: `Total Sales`,
        columnThree: ''
      },
      (this.includes(this.defaultData, 'Budget')? {
        columnOne: 'Budget',
        columnTwo: funcs.formatMoney(this.numbersObject.totalSales.budget),
        columnThree: funcs.formatMoney(this._getPlusOrMinus(this.numbersObject.totalSales))
      } : undefined),
      (this.includes(this.defaultData, 'Actual')? {
        columnOne: 'Actual',
        columnTwo: funcs.formatMoney(this.numbersObject.totalSales.actual),
        columnThree: (this._getPercentChange(this.numbersObject.totalSales) * 100).toFixed(2)
      } : undefined),
      (this.includes(this.defaultData, 'Prior')? {
        columnOne: 'Prior',
        columnTwo: funcs.formatMoney(this.numbersObject.totalSales.prior),
        columnThree: ''
      } : undefined),
    ].filter(x => x !== undefined);
    
    let table = {
      rows: rows,
      columns: [
        {
          "prop": "columnOne",
          "type": "string",
        },
        {
          "prop": "columnTwo",
          "type": "string",
        },
        {
          "prop": "columnThree",
          "type": "string",
        },
      ]
    }
    return table;
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
