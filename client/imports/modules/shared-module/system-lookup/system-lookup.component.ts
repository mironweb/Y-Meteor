import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ViewChildren,
  ElementRef,
  Inject
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import {Router, ActivatedRoute} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Session } from 'meteor/session';
import { Observable } from 'rxjs/Observable';
import { MatSort } from '@angular/material';
import { MatPaginator } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { DataSource } from '@angular/cdk/collections';
import { AllCollections } from '../../../../../both/collections';

import * as funcs from '../../../../../both/functions/common';
import * as pdfFuncs from '../../../../../both/functions/lookupPdf';
import * as userDefinedPdfFuncs from '../../../../../both/functions/userDefinedPdf';
import * as SystemConfig from '../../../../../both/config/systemConfig';
import { NotificationsService } from 'angular2-notifications';
import { Random } from 'meteor/random';
import * as pdfMake from 'pdfmake/build/pdfmake';

import * as deepEqual from 'deep-equal';
import * as cloneDeep from 'clone-deep';

import { DialogComponent } from '../dialog/dialog.component';
import { UserService } from '../../../services/UserService';

import { isEmptyObject } from '../../../../../both/functions/common';
import {SystemLookup} from "../../../../../both/models/systemLookup.model";
import {Action} from "../../../../../both/models/systemLog.model";
import {SystemLogsService} from "../../../services/SystemLogs.service";
import {debounceTime, map, switchMap, take, tap, startWith, findIndex} from "rxjs/operators";
import {merge} from "rxjs";
import {UserGroupsService} from "../../../services/UserGroups.service";
import {DeveloperAlertService} from "../../../services/DeveloperAlert.service";
import {EventEmitterService} from "../../../services";
import {of} from "rxjs";
import {animate, state, style, transition, trigger} from "@angular/animations";
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { isArray } from 'util';
import { FormControl } from '@angular/forms';




export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
  description: string;
}

export interface dropDownValue {
  _id: string;
  label: string;
  value: string;
}

@Component({
  selector: 'system-lookup',
  templateUrl: 'system-lookup.component.html',
  styleUrls: ['system-lookup.component.scss'],
  providers: [DeveloperAlertService],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})

export class SystemLookupComponent implements OnInit, OnChanges, OnDestroy {
  @Input() config: any = {
    isReactiveUpdate: true,
    enableMultipleUsersUpdate: true
  };
  @Input() lookupName: string;
  @Input() documentId: any;
  @Input() filterConditions: any = [];
  @Input() data: any;
  @Input() externalStages: any;
  @Input() isModal: boolean = false;
  @Input() isWidget: boolean = false;
  @Output() onSelected = new EventEmitter<any>();
  @Output() emitDataChange = new EventEmitter<any>();
  @Output() onEvent = new EventEmitter<any>();
  @Output() onComplete = new EventEmitter<any>();
  @Output() aggregate = new EventEmitter<any>();
  @Output() onLastAggregate = new EventEmitter<any>();
  @Output() tableRows = new EventEmitter<any>();
  @Output() isLoading = new EventEmitter<any>();
  @Output() _onMobileClick = new EventEmitter<any>();

  @ViewChild('filter') filter: ElementRef;
  @ViewChild('searchInput') searchInput: ElementRef;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChildren('dropDown_autoCmplTmpl') dropDown_autoCmplTmpl;
  @ViewChildren('dropDown_autoCmplInput') dropDown_autoCmplInput;
  @ViewChildren('dropDown_autoCmplTmpl_second') dropDown_autoCmplTmpl_second;
  @ViewChildren('dropDown_autoCmplInput_second') dropDown_autoCmplInput_second;

  permissionStatus = [
    { value: 'enabled', label: 'Enabled' },
    { value: 'disabled', label: 'Disabled' },
    { value: '', label: 'Not Configured' }
  ];

  eventSub: any;

  methodsToBeRun = [];

  Device = Meteor['Device'];
  aggregateSub:any;

  url: string = '';
  showTable = false;
  displayedColumns: any[] = [];
  // displayedColumns = [];
  exampleDatabase: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);


  dataSource: ExampleDataSource | null | any;
  expandedElement: PeriodicElement;
  // columnsToDisplay = ['name', 'weight', 'symbol', 'position'];
  columns: any[];
  expandedColumns: any[];



  systemLog: any;
  extraStages = [];
  // component state
  state: any = {
    initRows: [],
    isDirty: false,
    actionsToBeUploaded: [],
    isSaveButtonEnabled: false,
    queryParams: {}
  };

  user: any = {
    status: {
      editable: false
    }
  };

  lookup: SystemLookup;
  isPaginationShown: boolean = true;
  // datatable
  sortActive = '';
  sortDirection = '';
  // columns: any[] = []; // headers in the data table
  quickFilters: any[] = [];
  rows: any[] = [];
  returnable: boolean = false; //
  selected: any[] = []; // current selected items
  oldSelected: any[] = []; // old selected items for the datatable
  dataTableOptions: any = {
    searchable: true
  }; // options for the datatable
  dataTable: any = {};
  count: number = 0; // count for the data table
  pageIndex: number = 0; // offset for the data table
  pageSize: number = 25; // limit for the data table
  skip: number = 0; // skip for the data table
  selectedIds: string[] = [];
  keywords: string = ''; // keywords to search the database
  isClick: boolean = false; // detect if the event is click event
  loading: boolean = true;
  pdfLoadingPercentage: any = 0;
  needRefresh: boolean = false;
  selectedColumn: any = {};

  firstInit: boolean = true;

  searchable: boolean = true;
  routeSub: Subscription;
  subscriptions: Subscription[] = []; // all subscription handles
  observeSubscriptions: Subscription[] = []; // all subscription handles
  subscribeSubscriptions = []; // subscription handles for field subscriptions in systemlookup
  autorunSubscriptions: Subscription[] = []; // subscription handles for field subscriptions in systemlookup
  systemLookup: any = {}; // current system lookup object
  objLocal: any = {}; // used to store variables data to be substitute for the params
  methods: any[] = []; // all functions
  method: any = {}; // current method
  hideDelete: boolean = false;
  showPdf: boolean = false;
  pdfOptions: any = {};
  groupByPDF: any = [];
  sortByPDF: any = [];
  showSummary: boolean = false;
  totalObj: any;
  totalLogic: any;
  test: any;
  queryParams: any = {};
  params: any = {};

  dropDownValueOptions: dropDownValue[];
  dropDownValueOptions_second: dropDownValue[];
  filteredDropDownValue: Observable<dropDownValue[]>;
  filteredDropDownValue_second: Observable<dropDownValue[]>;
  scrollResults: Array<any> = [];
  scrollResults_second: Array<any> = [];
  firstAutoCompleteControl = new FormControl();
  secondAutoCompleteControl = new FormControl();

  public options = SystemConfig.alertOptions;

  selectedLevelHeader: string;
  mobile: boolean;

  constructor(public dialog: MatDialog,
              private _service: NotificationsService,
              private router: Router,
              private route: ActivatedRoute,
              private userService: UserService,
              private systemLogsService: SystemLogsService,
              public userGroupService: UserGroupsService,
              private developerAlertService: DeveloperAlertService
  ) {

    this.user = Meteor.user();
    this.mobile = funcs.checkMobile();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    }, 0);
  }

  loadObjLocal() {
    this.objLocal['data'] = this.data;
    if (UserService.user) {
      this.objLocal.user = UserService.user;
    }
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    if (this.documentId) {
      this.objLocal.documentId = this.documentId;
    }
    if (this.userGroupService.userGroup) {
      this.objLocal.userGroup = this.userGroupService.userGroup._getModel();
    }
  }

  async asyncFunctions() {
    this.loadObjLocal();

    let lookup:any = await SystemLookup._GetReferredLookup$(this.userService.user, this.lookupName).toPromise()
      .catch((error)=> console.log("caught it", error));
    this.lookup = new SystemLookup(lookup);

    this.lookup.init(this.objLocal);

    if (this.externalStages) {
      this.lookup.externalStages = this.externalStages;
    }

    if (this.lookup.dataTable.options) {
      this.showPdf = !!this.lookup.dataTable.options.reportTitle;

      this.showSummary = this.lookup.dataTable.options.summary ? this.lookup.dataTable.options.summary : false;

    }
    Object.assign(this.dataTableOptions, this.lookup.dataTable.options);

    if (this.dataTable && 'columns' in this.dataTable) {
      this.lookup.dataTable = this.dataTable;
      Object.assign(this.dataTableOptions, this.dataTable.options);
    }
    
    if (this.lookup && !isEmptyObject(this.lookup)) {

      if (this.isModal) {
        this.showTable = false;
        if (this.documentId === undefined) {
        } else {
          this.objLocal['documentId'] = this.documentId;
        }
        //modalParams
        this.route.params
          .pipe(take(1))
          .subscribe(res => {
            this.params = res;
          })
        this.routeSub = this.route.queryParams.subscribe(async (params) => {
          let isChanged = !deepEqual(this.queryParams, params);
          this.lookup.setParams(params);
          if (isChanged || this.firstInit) {
            this.queryParams = Object.assign({}, params);
            // this.reloadData('uniqueid');
          }
        });

        let message = '3. ' + this.lookup.name + ' ' + Meteor.user().username + ' ' + window.location.pathname + ' ' + 'request render datatable';
        funcs.consoleLog(message);
        this.reloadData(Random.id());
      } else {
        this.columns = this.lookup.columns;
        this.expandedColumns = this.lookup.dataTable.expandedColumns;
        this.emitDataChange.emit({name: "onLoadColumns", value: this.columns});
        this.onEvent.emit({name: "onLoadColumns", value: this.columns});

        let message = '0. ' + this.lookup.name + ' ' + UserService.user.username + ' ' + window.location.pathname + ' ' + 'request route query params';
        funcs.consoleLog(message);

        this.setPdfOptions();
        if (this.pdfOptions.defaultToPdf) {
          this.pdfOptions.active = true;
          this.setLoading(false);
        } else {
          // this.logService.log()
  
          this.route.params
            .pipe(take(1))
            .subscribe(res => {
              this.params = res;
            })
  
          this.routeSub = this.route.queryParams.subscribe(async (params) => {
            let isChanged = !deepEqual(this.queryParams, params);
            
            this.lookup.setParams(params);
  
            if (isChanged || this.firstInit) {
  
              this.queryParams = Object.assign({}, params);
              // this.isLoading.emit(true);
              this.reloadData('uniqueid');
            }
          });
        }

      }
      // this.onDatabaseChange();
    }
  }

  setPdfOptions(){
    this.pdfOptions = this.lookup.dataTable.options.pdfOptions ? this.lookup.dataTable.options.pdfOptions : {};
  }

  pdfColumn(column, sortOrGroup){
    let hide = false;
    if (column.hidden) {
      hide = true
    }
    if (column.pdfColumnOption) {
      hide = !column.pdfColumnOption[sortOrGroup];
    }
    
    return !hide;
  }

  setDefaultConfig() {
    // this.setDefaultSort();
    this.setDefaultPageSize();
  }

  onMobileClick(row) {
    if (this.Device.isPhone()) {

      this._onMobileClick.emit(row);
    }
  }

  ngOnInit() {
    // Session.set('enableCheckUpdate', true);
    this.systemLog = this.systemLogsService.systemLog;
    // assign the path name to objLocal object
    Object.assign(this.objLocal, { pathname: window.location.pathname });

    this.asyncFunctions();
    this.hookEvents();
  }

  onDatabaseChange() {
    this.lookup.subscriptions.map((subscription, index) => {
      let args = subscription.args;
      args = funcs.parseAll(args, this.objLocal);

      this.subscribeSubscriptions[index] = MeteorObservable.subscribe(subscription.name, ...args)
        .pipe(
          debounceTime(1000)
        )
        .subscribe(() => {
          let autoSubscribe = MeteorObservable.autorun().subscribe(() => {
            // Tracker.autorun(() => {
            let result = AllCollections[subscription.name].collection.find().fetch();
            if (!this.firstInit) {
              this.reloadData(Random.id());
            }
          });
          this.autorunSubscriptions.push(autoSubscribe);
        });
    })
  }

  renderModalTable(uniqueId) {
    this.columns = this.lookup.columns;
    this.displayedColumns = [];
    this.displayedColumns = this.lookup.displayedColumns;

    let hideParams = 'hideColumns' in this.lookup.params ? this.lookup.params : this.params;
    
    if ('hideColumns' in hideParams) {
      this.displayedColumns = this.displayedColumns.filter(x => !hideParams.hideColumns.includes(x));
      this.lookup.displayedColumns = this.displayedColumns;
    } else {
      this.displayedColumns = this.lookup.columns.filter(x => x['hidden'] == false).map(x => x['prop']);
      this.lookup.displayedColumns = this.displayedColumns;
    }

    if (this.lookup.dataTable.options.hasColorColumn === true) {
      if (this.displayedColumns.indexOf('colorColumn') == -1) {
        this.displayedColumns.unshift('colorColumn');
      }
    }

    this.setUIPagination();

    if (this.lookup.params) {
    } else {
      this.lookup.setParams({});
    }
    this.setDefaultConfig();

    this.setLoading(true);



    this.lookup._getAggregateResult$()
      .pipe(
        tap((aggregateResult:any) => {
          // console.log('get result', new Date(), aggregateResult);
          this.rows = [];
          aggregateResult.forEach((doc, index) => {
            if (doc.enabled === true) {
              this.selected.push(doc);
              this.selectedIds.push(doc._id);
            }
            this.addRow(doc);
          });

          funcs.consoleLog('5. ' + 'uniquid ' + " " + this.lookup.name + ' ' + Meteor.user().username + ' ' + window.location.pathname + ' loading complete');

          if (this.dataTableOptions && 'hasActionsCell' in this.dataTableOptions) {
            this.exampleDatabase.value.forEach(_row => _row.hasActionsCell = true);
          }

          this.onComplete.emit({
            name: 'onComplete',
            value: {
              isFirstInit: this.firstInit
            }
          });

          if ('selectOnOneResult' in this.lookup.dataTable.options) {
            if (this.lookup.dataTable.options.selectOnOneResult) {
              if (this.rows.length == 1) {
                this.onSelected.emit({name: "onOneResult", value: this.rows[0]});
              }
            }
          }
          this.firstInit = false;
          this.needRefresh = false;

        }),
        switchMap(() => {
          return this.lookup._getAggregateResultCount$();
        }),
        tap((res:any) => {
          // console.log('get count', new Date());
          if (res && res.length > 0 && res[0].count > 0) {
            this.count = res[0].count;
          } else {
            this.count = 0;
          }
        })
      )
      .subscribe((aggregateResult:any) => {
        this.checkPagination();
        this.setLoading(false);
        this.dataSource = new ExampleDataSource(this.exampleDatabase);
      })

  }

  checkPagination() {
    if (this.count < this.pageSize) {
      this.isPaginationShown = false;
    } else {
      this.isPaginationShown = true;
    }
  }

  reloadData(uniqueId) {
    this.setLoading(true);
    this.rows = [];
    this.exampleDatabase = new BehaviorSubject<any[]>([]);
    this.dataSource = new ExampleDataSource(this.exampleDatabase);

    if (this.isModal) {
      this.renderModalTable(uniqueId)
    } else {
      this.renderTable(uniqueId);
    }

    // this.setLoading(false);
  }

  renderTable(uniqueId) {
    this.state.isSaveButtonEnabled = false;

    this.lookup.setParams(this.queryParams);
    this.setDefaultConfig();

    this.setUIPagination();

    if ('keywords' in this.queryParams) {
      this.setKeywords(this.queryParams.keywords);
    }
    // set sort only if params has only one sort
    if (this.lookup.sort && this.lookup.sort.length == 1) {
      this.setSort(this.lookup.sort[0]);
    }

    // set keywords if exists
    if ('keywords' in this.lookup) {
      this.keywords = this.lookup.keywords;
    }

    if (this.lookup.quickFilters && this.lookup.quickFilters.length > 0) {
      this.quickFilters = this.lookup.quickFilters;
    }

    this.displayedColumns = [];
    this.displayedColumns = this.lookup.displayedColumns;

    let hideParams = 'hideColumns' in this.lookup.params ? this.lookup.params : this.params;
    if ('hideColumns' in hideParams) {
      this.displayedColumns = this.displayedColumns.filter(x => !hideParams.hideColumns.includes(x));    
      this.lookup.displayedColumns = this.displayedColumns;
    } 
    else {
      this.displayedColumns = this.lookup.columns.filter(x => x['hidden'] == false).map(x => x['prop']);
      this.lookup.displayedColumns = this.displayedColumns;
    }
    
    if (this.lookup.dataTable.options.hasColorColumn === true) {
      if (this.displayedColumns.indexOf('colorColumn') == -1) {
        this.displayedColumns.unshift('colorColumn');
      }
    }

    this.setLoading(true);

    this.lookup._getAggregateResult$()
      .pipe(
        tap((aggregateResult:any) => {
          this.rows = [];
          aggregateResult.forEach((doc, index) => {
            if (doc.enabled === true) {
              this.selected.push(doc);
              this.selectedIds.push(doc._id);
            }
            this.addRow(doc);
          });

          funcs.consoleLog('5. ' + 'uniquid ' + " " + this.lookup.name + ' ' + Meteor.user().username + ' ' + window.location.pathname + ' loading complete');
          this.tableRows.emit(this.rows);

          if ('selectOnOneResult' in this.lookup.dataTable.options) {
            if (this.lookup.dataTable.options.selectOnOneResult) {
              if (this.rows.length == 1) {
                this.onSelected.emit({name: "", value: this.rows[0]});
              }
            }
          }
        }),
        switchMap(() => {
          // return of([10]);
          // console.log('need count', this.lookup.dataTable.options.needCount);

          return this.lookup._getAggregateResultCount$();

          // if (this.lookup.dataTable.options.needCount === false) {
          //   return of([]);
          // } else {
          // }
        }),
        tap((res:any) => {
          // console.log('get count', new Date());
          if ('error' in res) {
            this.count = 500;
          }
          if (res && res.length > 0 && res[0].count > 0) {
            this.count = res[0].count;
          } else {
            this.count = 0;
          }

          if (this.dataTableOptions && 'hasActionsCell' in this.dataTableOptions) {
            this.exampleDatabase.value.forEach(_row => _row.hasActionsCell = true);
          }

          this.onComplete.emit({
            name: 'onComplete',
            value: {
              isFirstInit: this.firstInit
            }
          });

          this.firstInit = false;
          this.needRefresh = false;

        })
      )
      .subscribe((res:any) => {
      // console.log('end', new Date(), res);

      this.onLastAggregate.emit(this.lookup.lastMethodArgs);

      this.setLoading(false);
      this.checkPagination();

      this.dataSource = new ExampleDataSource(this.exampleDatabase);
      this.lookup.columns.map(column => {
        if (column['cellTemplate'] == 'dropDown_autoCmplTmpl' || column['cellTemplate'] == 'dropDown_autoCmplTmpl_second') {
          switch (column['control']) {
            case 'firstAutoCompleteControl':
              this.dropDownValueOptions = this.dataSource._database._value[0][column['prop']];
              this.setAutoCompleteFilter();
              break;
            case 'secondAutoCompleteControl':
              this.dropDownValueOptions_second = this.dataSource._database._value[0][column['prop']];
              this.setAutoCompleteFilter_second();
              break;
            default:
              break;
          }
          this.checkForandSetPresetValues(this.dataSource._database._value, column, column['control']);
        }
      })
    })
  }

  testing(event, row){
    console.log(event, row)
  }
  
  checkForandSetPresetValues(rows, column, control) {
    let i = 0;
    for(let row of rows){
      let autoCompleteArray = row[column.prop];
      let presetFieldName = column['autoCompletePresetValueProp']
      let value = row[presetFieldName];
      let index = autoCompleteArray.findIndex((obj => obj._id == value))
      if(index > -1) {
        if (control == 'firstAutoCompleteControl') {
          this.dropDown_autoCmplInput._results[i].nativeElement.value = autoCompleteArray[index].label;
        } else if (control == 'secondAutoCompleteControl') {
          this.dropDown_autoCmplInput_second._results[i].nativeElement.value = autoCompleteArray[index].label;
        }
      }
      i++
    }
  }

  
  openedAutoComplete(event, index){
    setTimeout(() => {
      this.registerPanelScrollEvent(index)
    }, 400);
  }

  closedAutoComplete(){
    this.setAutoCompleteFilter();
  }
  openedAutoComplete_second(event, index){
    setTimeout(() => {
      this.registerPanelScrollEvent_second(index)
    }, 400);
  }

  closedAutoComplete_second(){
    this.setAutoCompleteFilter_second();
  }

  clearValueIfEmpty(value, row, key){
    if(value == ''){
      row[key] = null;
    }
  }

  registerPanelScrollEvent(index) {
    const panel = this.dropDown_autoCmplTmpl._results[index].panel.nativeElement;
    panel.addEventListener('scroll', event => this.loadAllOnScroll(event));
  }

  loadAllOnScroll(event) {
    if (event.target.clientHeight + event.target.scrollTop == event.target.scrollHeight) {
      this.filteredDropDownValue = this.filteredDropDownValue.pipe(
        map(result => {
          return [...result, ...this.scrollResults.slice(result.length, (result.length + 10))]
        }),
      )
    }
  }
  registerPanelScrollEvent_second(index) {
    const panel = this.dropDown_autoCmplTmpl_second._results[index].panel.nativeElement;
    panel.addEventListener('scroll', event => this.loadAllOnScroll_second(event));
  }

  loadAllOnScroll_second(event) {
    if (event.target.clientHeight + event.target.scrollTop == event.target.scrollHeight) {
      this.filteredDropDownValue_second = this.filteredDropDownValue_second.pipe(
        map(result => {
          return [...result, ...this.scrollResults_second.slice(result.length, (result.length + 10))]
        }),
      )
    }
  }

  setAutoCompleteFilter(){
    this.filteredDropDownValue = this.firstAutoCompleteControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.label),
        map(name => {
          let value = name ? name : this.firstAutoCompleteControl.value;
          let res = typeof value === 'string' && value !== '' ? this._filter(value) : this.dropDownValueOptions;
          this.scrollResults = typeof value === 'string' && value !== '' ? res : this.dropDownValueOptions;
          return res.slice(0, 10);
        })
      );
  }
  setAutoCompleteFilter_second(){
    this.filteredDropDownValue_second = this.secondAutoCompleteControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.label),
        map(name => {
          let value = name ? name : this.secondAutoCompleteControl.value;
          let res = typeof value === 'string' && value !== '' ? this._filter_second(value) : this.dropDownValueOptions_second;
          this.scrollResults_second = typeof value === 'string' && value !== '' ? res : this.dropDownValueOptions_second;
          return res.slice(0, 10);
        })
      );
  }

  private _filter(name: string) {
    if (typeof name === 'string') {
      let filterValue = name.toLowerCase();
      return this.dropDownValueOptions.filter(option => option.label.toLowerCase().indexOf(filterValue) !== -1);
    } else {
      return this.dropDownValueOptions;
    }
  }
  private _filter_second(name: string) {
    if (typeof name === 'string') {
      let filterValue = name.toLowerCase();
      return this.dropDownValueOptions_second.filter(option => option.label.toLowerCase().indexOf(filterValue) !== -1);
    } else {
      return this.dropDownValueOptions_second;
    }
  }

  resetAutoCompleteDropDown(event) {
    this.setAutoCompleteFilter();
    this.setAutoCompleteFilter_second();
  }

  displayFn(option?: dropDownValue) {
    return option ? option.label : null;
  }

  addRow(row: any) {
    this.rows.push(row);
    const dataTable = this.lookup.dataTable;

    this.displayedColumns.forEach(column => {
      let temp;
      if (column.indexOf('.') !== -1) {
        let arrParam = column.split('.');
        temp = Object.assign({}, row);

        arrParam.forEach(value => {
          temp = temp[value];
        });
        row[column] = temp;
      }
    });

    if ('options' in dataTable) {
      if ('controlFieldName' in dataTable.options) {
        if (row[dataTable.options.controlFieldName]) {
          if ('highlightFieldName' in dataTable.options) {
            row['highlightFieldName'] = dataTable.options.highlightFieldName;
          }
          // if ('compareFields' in dataTable.options) {
          //   dataTable.options.compareFields.forEach(fieldName => {
          //     console.log(fieldName);
          //     if (Number(row[fieldName].toFixed(2)) == row[dataTable.options.highlightFieldName]) {
          //       row['highlightFieldName'] = fieldName;
          //     }
          //   })
          // }
        }
      }
    }

    const copiedData = this.exampleDatabase.value.slice();
    copiedData.push(this.createNewRow(row));
    this.exampleDatabase.next(copiedData);
  }

  updateTotalRow(row: any) {
    this.rows.push(row);
    const dataTable = this.lookup.dataTable;

    this.displayedColumns.forEach(column => {
      let temp;
      if (column.indexOf('.') !== -1) {
        let arrParam = column.split('.');
        temp = Object.assign({}, row);

        arrParam.forEach(value => {
          temp = temp[value];
        });
        row[column] = temp;
      }
    });
    const copiedData = this.exampleDatabase.value.slice();
    copiedData.pop();
    copiedData.push(this.createNewRow(row));
    this.exampleDatabase.next(copiedData);
  }

  private createNewRow(row: any) {
    let newRow: any = Object.assign({}, row);
    // this.displayedColumns.forEach((column) => {
    //   newRow[column] = row[column];
    //   if ('_id' in row) {
    //     newRow['_id'] = row['_id'];
    //   }
    // });
    if ('highlightFieldName' in row) {
      newRow.highlightFieldName = row.highlightFieldName;
    }

    const dataTable = this.lookup.dataTable;
    if ('options' in dataTable) {
      if ('checkGrossProfit' in dataTable.options) {
        if (row[dataTable.options.checkGrossProfit] >= 27) {
          newRow.backgroundColor = 'green';
        } else if (row[dataTable.options.checkGrossProfit] >= 18) {
          newRow.backgroundColor = 'yellow';
        } else {
          newRow.backgroundColor = 'red';
        }
      } else if ('checkDifference' in dataTable.options) {
        if ((Math.round(row[dataTable.options.checkDifference] * 100) / 100) > 0) {
          newRow.backgroundColor = 'red';
        } else if ((Math.round(row[dataTable.options.checkDifference] * 100) / 100) < 0) {
          newRow.backgroundColor = 'green';
        } else {
          newRow.backgroundColor = 'yellow';
        }
      } else if ('percentChange' in dataTable.options) {
        if ((Math.round(row[dataTable.options.percentChange] * 100) / 100) > 0) {
          newRow.backgroundColor = 'green';
        } else if ((Math.round(row[dataTable.options.percentChange] * 100) / 100) < 0) {
          newRow.backgroundColor = 'red';
        } else {
          newRow.backgroundColor = 'yellow';
        }
      } else if ('checkInContract' in dataTable.options){
        if (row.inContract) {
          newRow.backgroundColor = 'green';
        } else {
          newRow.backgroundColor = 'red';
        }
      } else if ('colorColumnDefined' in dataTable.options){
        if (row[dataTable.options.colorColumnDefined] == 'green') {
          newRow.backgroundColor = 'green';
        } else if (row[dataTable.options.colorColumnDefined] == 'red') {
          newRow.backgroundColor = 'red';
        } else {
          newRow.backgroundColor = 'yellow';
        }
      }
    }
    return newRow;
  }

  isLastPage() {
    return ((Math.ceil(this.count / this.pageSize) - 1) === Number(this.pageIndex));
  }

  ngOnChanges(changes) {

    this.pageIndex = 0;
    this.pageSize = 25;
    this.skip = 0;
    if (!this.data) {
      this.data = {};
    }
    Object.keys(changes).forEach(key => {
      if (key == 'data') {
        if (changes[key].currentValue) {
          this.data = changes[key].currentValue;
          this.objLocal['data'] = this.data;
        }
        // if ('keywords' in this.data) {
        //   this.setKeywords(this.data.keywords);
        // }
      } else {
        this.data[key] = changes[key].currentValue;
        this.objLocal['data'] = this.data;
        this.objLocal[key] = changes[key].currentValue;
      }
    });

    if (this.lookup) {
      this.lookup.objLocal = this.objLocal;
    }

    if (!funcs.isEmptyObject(this.lookup)) {
      this.setDefaultConfig();

      this.rows = [];
      this.reloadData('reload table');
    }
  }

  setDefaultSort() {
    let defaultSort = this.lookup.defaultSort;
    if (defaultSort) {
      this.setSort(defaultSort);
    }
  }

  setSort(sort) {

    if (sort) {
      if ('direction' in sort) {
        if (Number(sort.direction) == 1) {
          this.sortDirection = 'asc';
        } else if (Number(sort.direction) == -1) {
          this.sortDirection = 'desc';
        } else {
          this.sortDirection = '';
        }

        this.sortActive = sort.active;
        // this.aggregateSortOption = {
        //   "$sort": {
        //     [sort.active]: sort.direction
        //   }
        // }
      }
    }
  }

  setDefaultPageSize() {
    if (this.pageSize) {

    } else {
      this.pageSize = this.lookup.defaultPageSize;
    }
  }

  onStatusChange(event, selectedRow, column) {
    console.log('hit', event, selectedRow, column)
    selectedRow.status = event.value;

    this.objLocal['selectedRow'] = selectedRow;

    if ('emitMethodName' in column) {
      this.emitDataChange.emit({
        name: 'emitMethodName',
        value: {
          row: selectedRow,
          column
        }
      });
      this.onEvent.emit({
        name: 'emitMethodName',
        value: {
          row: selectedRow,
          column
        }
      });
    } else {
      let findMethod = this.lookup.methods.find(_method => _method.name == column.methodName);
      let methodArgs = [];
      methodArgs = funcs.parseAll(findMethod.args, this.objLocal);
      funcs.update(findMethod.collectionName, methodArgs[0], methodArgs[1]);
    }
  }

  async runActions() {
    this.user = Meteor.user();
    this.state.isSaveButtonEnabled = false;
    // let allConnections:any = await funcs.getPageConnections(window.location.pathname);
    // const userConnection = allConnections.find(connection => {
    //   if (connection._id == Meteor.userId()) {
    //     return connection;
    //   }
    // });
    // if (this.config.enableMultipleUsersUpdate || (userConnection && userConnection.editable)) {

    if (this.config.enableMultipleUsersUpdate) {
      let updateSuccess = 0;
      let updateFailed = 0;

      let removeMethodRowIds = new Set();
      let updateInsertMethodRowIds = new Set();
      let normalMethodRowIds = new Set();
      let updateInsertMethods = [];
      let updateRemoveMethods = [];
      let normalMethods = [];
      this.methodsToBeRun.forEach(method => {
        if (method.type == 'update.remove') {
          updateRemoveMethods.push(method);
          removeMethodRowIds.add(method.rowId);
        } else if (method.type == 'update.insert') {
          updateInsertMethods.push(method);
          updateInsertMethodRowIds.add(method.rowId);
        } else {
          normalMethods.push(method);
          normalMethodRowIds.add(method.rowId);
        }
      });

      this.methodsToBeRun = [...updateInsertMethods, ...updateRemoveMethods, ...normalMethods];
      //
      if (removeMethodRowIds.size > 0) {
        this.methodsToBeRun = this.methodsToBeRun.filter((method, index) => {
          if (!removeMethodRowIds.has(method.rowId)) {
            return true;
          } else if (method.type == 'update.remove') {
            return true;
          }
        })
      }

      if (this.methodsToBeRun.length > 0) {
        if ('saveLog' in this.lookup.dataTable.options) {
          let saveLog = this.lookup.dataTable.options.saveLog;
          let log: any = funcs.parseParams(saveLog, this.objLocal);

          Object.assign(log.value, { _id: Random.id(), date: new Date() });
          this.systemLogsService._log$(log.value).subscribe();
        }
      }

      let failedArray = [];

      await Promise.all(this.methodsToBeRun.map(async (method: any) => {
        let result = await funcs.callbackToPromise(MeteorObservable.call(method.type, method.collectionName, method.updateQuery, method.update, method.options));

        if (!result && 'insert' in method) {
          method.type = 'update.insert';
          method.updateQuery = method.insertQuery;
          method.update = method.insert;

          result = await funcs.callbackToPromise(MeteorObservable.call(method.type, method.collectionName, method.updateQuery, method.update, method.options));

          if ('insertLog' in method) {
            this.systemLogsService._log$(method.insertLog).subscribe();
          }          
        } else {
          if ('updateLog' in method) {
            this.systemLogsService._log$(method.updateLog).subscribe();
          }
        }

        if (result) {
          updateSuccess++;
        } else {
          let obj: any = {
            query: method.updateQuery
          };
          if ('update' in method) {
            obj.update = method.update;
          }
          if ('collectionName' in method) {
            obj.collectionName = method.collectionName;
          }
          if ('document' in method) {
            obj.document = method.document;
          }
          failedArray.push(obj);
          updateFailed++;
        }

      })).catch(error => console.log(error));

      this.methodsToBeRun = [];

      if (updateSuccess > 0) {
        this._service.success(
          "Success",
          updateSuccess + " updated successfully"
        );
        this.reloadData(updateSuccess + ' updated successfully');
      }
      if (updateFailed > 0) {
        failedArray.forEach(fail => {
          let log = {
            log: JSON.stringify(fail.query) + " " +
            "______" +
            JSON.stringify(fail.update),
            createdAt: new Date(),
            type: fail.collectionName + " Failed Update",
            _id: Random.id()
          };

          this.systemLogsService._log$(log).subscribe();
        })

        this._service.error(
          "Error",
          updateFailed + " update failed"
        );
      }
    } else {
      this._service.error('Error', "Can't edit");
    }
  }

  onChange(event, row, column, index) {
    this.objLocal['selectedRow'] = row;
    row.backgroundColor = 'green';

    if (this.config.isReactiveUpdate) {
      // this.reactiveUpdate(event, row, column, index);
    } else {
      this.nonReactiveUpdate(event, row, column, index);
    }
  }

  _getCheckboxFieldName() {
    let checkboxFieldName;
    if ('checkboxFieldName' in this.lookup.dataTable.options) {
      checkboxFieldName = this.lookup.dataTable.options.checkboxFieldName;
    }
    return checkboxFieldName;
  }

  async overrideChange(event, row, column, index) {
    row['newHighlightFieldName'] = column.prop;
    if (this.lookup.category == 'contractPricing') {
      // let checkboxFieldName = this._getCheckboxFieldName();
      //
      // let checked = row[checkboxFieldName];
      // if (checked) {
      //   let query = {
      //     _id: row._id + '.' + this.lookup.dataTable.options.updatedFieldName
      //   };
      //   // this.removeMethodsToBeRun(query);
      //   this.onChange(event, row, column, index);
      // } else {
      //   // this.updateContractProducts(row, column, true);
      // }
    } else {
      this.onChange(event, row, column, index);
    }
    this.checkSaveButton();
  }

  reactiveUpdate(event, row, fieldName) {
    this.methods.forEach(method => {
      let methodArgs = [];

      if (method.type === 'update' && method.name == fieldName) {
        this.objLocal['selectedRow'].value = row[fieldName];
        this.objLocal['selectedRow'].fieldName = fieldName;

        // let logOption = this.findLogOption(method, fieldName);

        let index = this.state.initRows.findIndex((doc) => {
          if (doc._id == row._id) {
            return true;
          }
        });
        let newPrice = this.objLocal['selectedRow'].newValue;

        if (this.lookupName == 'manageCategoryProducts') {
          if (newPrice == this.state.initRows[index].price) {
            this.objLocal['selectedRow'].value = this.state.initRows[index].previousPrice;
          }
        }

        methodArgs = funcs.parseAll(method.args, this.objLocal);
        MeteorObservable.call('update', method.collectionName, ...methodArgs).subscribe(() => {
          let logMessage = 'Update ' + fieldName + ' to ' + this.objLocal['selectedRow'].newValue + ' from ' + this.objLocal['selectedRow'].value;

          let log: Action = {
            _id: Random.id(),
            documentId: row._id,
            collectionName: method.collectionName,
            type: 'update',
            log: logMessage,
            createdAt: new Date(),
            value: this.objLocal['selectedRow'].newValue,
            previousValue: this.objLocal['selectedRow'].value,
            url: window.location.pathname,
          };

          this.systemLogsService._log$(log).subscribe();

        });
      } else {

      }
    });
  }

  nonReactiveUpdate(event, row, column, index) {

    let path = "dataTable.options.controlFieldName";

    if (!funcs.checkNullFromObject(this.lookup, path)) {
      if (!row[funcs.getObjectValue(this.lookup, path)]) {
        return;
      }
    }

    let initRow = this.rows[index];
    this.exampleDatabase.value[index]['newHighlightFieldName'] = column.prop;
    // this.exampleDatabase.value[index].isChanged = true;

    this.lookup.methods.forEach((originMethod:any) => {
      let methodArgs = [];

      let method: any = {};
      Object.assign(method, originMethod);

      if (originMethod.name === column.methodName) {

        if (row[column.updatedFieldName]) {
          this.objLocal['selectedRow']['value'] = initRow[column.updatedFieldName];
        } else {
          if (column.type == 'number') {
            this.objLocal['selectedRow']['value'] = Number(initRow[column.updatedFieldName]);
          } else
            this.objLocal['selectedRow']['value'] = initRow[column.updatedFieldName];
        }

        if ('value' in event.target) {
          row[column.prop] = event.target.value;
        }
        if (column.type == 'number') {
          row[column.prop] = Number(Number(row[column.prop]).toFixed(2));
        }
        this.objLocal['selectedRow']['newValue'] = row[column.prop];

        methodArgs = funcs.parseAll(originMethod.args, this.objLocal);


        method = {
          _id: row._id + '.' + this.lookup.dataTable.options.updatedFieldName,
          rowId: row._id,
          type: originMethod.type,
          name: originMethod.name,
          collectionName: originMethod.collectionName,
          query: methodArgs[0],
          update: methodArgs[1]
        };

        if ('log' in originMethod) {
          let log = funcs.parseParams(originMethod.log, this.objLocal);

          let obj = {
            _id: Random.id(),
            date: new Date(),
            pathname: window.location.pathname
          };
          Object.assign(log.value, obj);
          method.log = log.value;
        }

        let newMethodArr = [];

        this.methodsToBeRun.forEach((methodToBeRun) => {
          if (methodToBeRun._id != method._id) {
            newMethodArr.push(methodToBeRun);
          }
        });

        if (!funcs.checkNullFromObject(this.lookup, path)) {
          if (row[funcs.getObjectValue(this.lookup, path)]) {
            newMethodArr.push(method);
          }
        }
        this.methodsToBeRun = newMethodArr;
      }
    });
    this.checkSaveButton();
  }

  setPrice(event, row, column) {
    let checkboxFieldName = this._getCheckboxFieldName();
    if (row[checkboxFieldName]) {
      if (!('updatedFieldName' in column)) {
        this.developerAlertService.developerAlert('UpdatedFieldName is required in this column');
      }

      let method = this.lookup.methods.find(_method => _method.name == column.methodName);
      row.backgroundColor = 'green';
    }
  }

  unsetPrice(event, row, column) {
    let checkboxFieldName = this._getCheckboxFieldName();

    if (row[checkboxFieldName]) {
      // if row is checked
      if (!('updatedFieldName' in column)) {
        this.developerAlertService.developerAlert('UpdatedFieldName is required in this column');
        return ;
      }

      row['newHighlightFieldName'] = undefined;
      row.backgroundColor = undefined;
      this.removeMethodsToBeRunByMethodId(row._id + "." + column.updatedFieldName);
      row['newHighlightFieldName'] = column.prop;
      row.backgroundColor = 'green';

    } else {
      // else if not checked, do nothing
    }
  }

  hightlightChangedRows() {
    const set = new Set();
    this.methodsToBeRun.forEach(row => {
      set.add(row.rowId);
    });
    this.rows.forEach((row, index) => {
      this.exampleDatabase.value[index].isChanged = set.has(row._id);
    })
  }

  selectColumn(column) {
    for (let i = 0; i < this.dataSource._database._value.length; i++) {
      if (this.selectedLevelHeader !== column) {
        this.dataSource._database._value[i].selectedLevelPrice = Math.round(this.dataSource._database._value[i][column] * 100) / 100
        this.dataSource._database._value[i]['highlightFieldName'] = column
      } else {
        this.dataSource._database._value[i].selectedLevelPrice = undefined;
        this.dataSource._database._value[i]['highlightFieldName'] = undefined
      }
    }
    this.selectedLevelHeader = (this.selectedLevelHeader !== column) ? column : undefined;
    this.onSelected.emit({name: "quoteReturn", value: this.dataSource._database._value});
  }

  quoteOnChange(event, row, column, index, fieldName) {
    if (row[column.prop] != 0 || event.target.value != 0) {
      this.exampleDatabase.value[index]['highlightFieldName'] = column.prop;
      if (fieldName == 'override') {
        // event.target.blur();
      }
      this.objLocal['selectedRow'] = row;
      if (event.target.type == 'number') {
        this.objLocal['selectedRow'].newValue = Number(event.target.value);
        if (row.selectedLevelPrice !== Number(event.target.value)) {
          if (Number(event.target.value) > 0) {
            row.selectedLevelPrice = Number(event.target.value);
            row.highlightFieldName = column.prop;
          }
          if (column.prop === 'override') {
            // row.override = row.selectedLevelPrice
            if (Number(event.target.value) > 0) {
              row.override = row.selectedLevelPrice
            } else {
              row.selectedLevelPrice = null;
              row.highlightFieldName = null;
            }
          }
        } else {
          row.selectedLevelPrice = null;
          row.highlightFieldName = null;
        }
      } else {
        this.objLocal['selectedRow'].newValue = event.target.value;
      }
      this.onSelected.emit({name: "quoteReturn", value: [row]});
    }
  }

  quoteReviewLevelChange(event, row, fieldName) {
    this.objLocal['selectedRow'] = row;
    if (event.target.type == 'number') {
      this.objLocal['selectedRow'].newValue = Number(event.target.value);
      if (row.selectedLevelPrice !== Number(event.target.value)) {
        row.selectedLevelPrice = Number(event.target.value);
        if (fieldName === 'override') {
          // row.override = row.selectedLevelPrice
          if (Number(event.target.value) > 0) {
            row.override = row.selectedLevelPrice
          }
        }
        this.runMethods(this.methods, { name: "quotePrice", type: 'update' })
        row.quotePrice = row.selectedLevelPrice
      } else {
        // row.selectedLevelPrice = null;
      }
    } else {
      this.objLocal['selectedRow'].newValue = event.target.value;
    }
    this.updateGrossProfit(row);
    // this.updateRows(row);
    this.onSelected.emit({name: "", value: row});
    // this.onSelected.emit([row]);
  }

  quoteReviewSelectColumn(column) {
    let rows = this.dataSource._database._value;
    for (let i = 0; i < rows.length; i++) {
      let target = {
        target: {
          type: "number",
          value: rows[i][column.prop].toFixed(2)
        }
      }
      this.quoteReviewLevelChange(target, rows[i], 'price');
    }
  }

  updateRows(row) {
    let objIndex = this.rows.findIndex((obj => obj._id == row._id));
    this.rows[objIndex].quotePrice = row.override;
  }

  updateGrossProfit(row) {
    row.grossProfit = (((row.quotePrice - row.stdCost) / row.quotePrice) * 100)
  }

  log(action) {
    let query = {
      _id: this.systemLog._id
    };
    let update = {
      $push: {
        actions: action
      }
    };

    MeteorObservable.call('update', 'systemLogs', query, update).subscribe();
  }

  onClickRow(row) {
    // Log which collection/row was clicked
    const log = {
      log: `Row selected ${row._id}`,
      collectionName: row.name,
      url: window.location.pathname,
      createdAt: new Date(),
      _id: Random.id()
    };
    this.systemLogsService._log$(log).subscribe();

    // if (this.lookup.dataTable.options.returnable) {
    //   this.onSelected.emit({name: "onClickRow", value: row});
    // }
    if (this.lookup.dataTable.options.expandableTemplate && this.lookup.dataTable.options.expandableTemplate != '') {
      if (this.expandedElement == row) {
        this.expandedElement = null;
      } else {
        this.expandedElement = row;
      }
    }
    this.onSelected.emit({name: "onClickRow", value: row});
    this.onEvent.emit({name: "onClickRow", value: row});
  }

  prevent(event) {
    event.stopPropagation();
  }

  onClickAction(event, row, column, action) {

    this.objLocal['selectedRow'] = row;

    this.emitDataChange.emit({
      name: "actions." + action.name,
      value: {
        row,
        column
      }
    });
    this.onEvent.emit({
      name: "actions." + action.name,
      value: {
        row,
        column
      }
    });

    // if (selectedMethod !== null) {
    //   if (selectedMethod.name === 'remove' || selectedMethod.name === 'disable' || selectedMethod.type === 'remove') {
    //     this.openDialog(selectedMethod);
    //   } else {
    //     this.runMethods(this.methods, selectedMethod);
    //   }
    // } else {
    //   let dialogRef = this.dialog.open(DialogComponent, {
    //     height: "600px",
    //     width: "800px"
    //   });
    //
    //   selectedRow = {
    //     _id: selectedRow._id
    //   };
    //
    //   let lookupName = 'manageUserTenantGroups';
    //   if (selectedColumn !== null) {
    //     lookupName = selectedColumn.lookupName;
    //   }
    //
    //   dialogRef.componentInstance['lookupName'] = lookupName;
    //   dialogRef.componentInstance['documentId'] = this.documentId;
    //   dialogRef.componentInstance['data'] = selectedRow;
    //   dialogRef.afterClosed().subscribe(result => {
    //     this.isClick = false;
    //
    //     if (typeof result != 'undefined') {
    //     }
    //   });
    // }
  }

  onClick(selectedRow, selectedColumn, selectedMethod) {
    this.objLocal['selectedRow'] = selectedRow;
    this.isClick = true;
    if (selectedMethod !== null) {
      if (selectedMethod.name === 'remove' || selectedMethod.name === 'disable' || selectedMethod.type === 'remove') {
        this.openDialog(selectedMethod);
      } else {
        this.runMethods(this.methods, selectedMethod);
      }
    } else {
      let dialogRef = this.dialog.open(DialogComponent, {
        height: "600px",
        width: "800px"
      });

      selectedRow = {
        _id: selectedRow._id
      };

      let lookupName = 'manageUserTenantGroups';
      if (selectedColumn !== null) {
        lookupName = selectedColumn.lookupName;
      }

      dialogRef.componentInstance['lookupName'] = lookupName;
      dialogRef.componentInstance['documentId'] = this.documentId;
      dialogRef.componentInstance['data'] = selectedRow;
      dialogRef.afterClosed().subscribe(result => {
        this.isClick = false;
        this.onEvent.emit({name: "completeUpdate", value: result.value});

        if (typeof result != 'undefined') {
        }
      });
    }
  }

  openDialog(selectedMethod) {
    let dialogRef = this.dialog.open(DialogSelect);
    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        if ('default' in this.objLocal.selectedRow && this.objLocal.selectedRow.default === true) {
          this._service.alert(
            'Failed',
            'You can not delete system default document',
            {}
          )
        } else {
          this.runMethods(this.methods, selectedMethod);
        }
      }
    });
  }

  runMethods(methods: any, selectedMethod) {
    methods.forEach(method => {
      if (selectedMethod.type === 'update') {

        if (selectedMethod.name === method.name) {
          let args = method.args.map((arg) => {
            arg = funcs.parseDollar(arg);
            arg = funcs.parseDot(arg);
            arg = funcs.parseParams(arg, this.objLocal);

            return arg.value;
          });

          MeteorObservable.call('update', method.collectionName, ...args).subscribe(() => {
            this._service.success(
              "Message",
              'Update Successfully',
              {
                timeOut: 3500,
                showProgressBar: true,
                preventDuplicates: true,
                pauseOnHover: false,
                clickToClose: true,
                maxLength: 40
              }
            );
            this.oldSelected = this.selected.slice();
          });
        }
      } else if (method.type === 'remove') {
        let args = method.args.map((arg) => {
          arg = funcs.parseDollar(arg);
          arg = funcs.parseDot(arg);
          arg = funcs.parseParams(arg, this.objLocal);

          return arg.value;
        });

        MeteorObservable.call('remove', method.collectionName, ...args).subscribe(() => {
          this._service.success(
            "Message",
            'Remove Successfully',
            {
              timeOut: 3500,
              showProgressBar: true,
              preventDuplicates: true,
              pauseOnHover: false,
              clickToClose: false,
              maxLength: 40
            }
          );
          this.oldSelected = this.selected.slice();
        });
      }

    });
  }

  search(keywords) {
    this.skip = 0;
    this.setPageIndex(0);

    let queryParams = Object.assign({}, this.queryParams);
    delete queryParams.pageIndex;

    if (this.isModal) {
      if (this.selectedColumn.prop) {
        delete queryParams.quickColumns;
        delete queryParams.quickValues;
        this.quickFilters.push({
          prop: this.selectedColumn.prop,
          value: keywords,
          label: this.selectedColumn.name + " : " + keywords
        });

        let p = this._generateURLQuickFilter();

        Object.assign(queryParams, p);

        this.selectedColumn = {};
        this.keywords = '';
        this.lookup.setParams(queryParams);

      } else {
        this.setKeywords(keywords);
      }

      this.reloadData('is modal');
    } else {
      if (this.selectedColumn.prop) {
        delete queryParams.quickColumns;
        delete queryParams.quickValues;
        delete queryParams.keywords;
        this.quickFilters.push({
          prop: this.selectedColumn.prop,
          value: keywords,
          label: this.selectedColumn.name + ":" + keywords
        });

        let p = this._generateURLQuickFilter();

        Object.assign(queryParams, p);

        this.selectedColumn = {};
        this.setKeywords('');
        this.navigate(queryParams);

      } else {
        this.setKeywords(keywords);
        queryParams.keywords = keywords;
        this.navigate(queryParams);
      }
    }
  }

  navigate(queryParams) {
    this.router.navigate(['./', this.params], { queryParams: queryParams, relativeTo: this.route });
  }

  setLoading(value: boolean) {
    this.loading = value;
    this.isLoading.emit(value);
  }

  onPage(event) {
    this.setPageIndex(event.pageIndex);

    if (event.pageSize != this.pageSize) {
      this.pageSize = event.pageSize;
      this.lookup.pageSize = this.pageSize;
      this.setPageIndex(0);
    }

    this.skip = event.pageSize * event.pageIndex;

    if (this.isModal) {
      this.setPageSize(event.pageSize);
      this.reloadData('page change');
    } else {
      this.router.navigate([], { queryParams: { pageSize: this.pageSize, pageIndex: this.pageIndex }, queryParamsHandling: 'merge' });
    }
  }

  async onSort(event) {
    this.setPageIndex(0);
    this.setUIPagination();
    if (this.isModal) {
      this.skip = 0;

      let direction = 0;
      if (event.direction == 'asc') {
        direction = 1;
      } else if (event.direction == 'desc') {
        direction = -1;
      } else {
        direction = 0;
      }

      let params = cloneDeep(this.lookup.params);
      delete params.sort;
      if (direction == 0) {
      } else {
        let sort = {
          sort: `${event.active}.${direction}`
        };
        Object.assign(params, sort);
      }
      this.lookup.setParams(params);

      this.reloadData('on sort');
    } else {
      let result = await this.route.queryParams.pipe(take(1)).toPromise().catch(error => console.log(error));

      let oldQueryParams:any = Object.assign({}, result);

      let direction = 0;
      if (event.direction == 'asc') {
        direction = 1;
      } else if (event.direction == 'desc') {
        direction = -1;
      } else {
        direction = 0;
      }

      delete oldQueryParams.sort;
      delete oldQueryParams.pageIndex;

      if (direction == 0) {
        this.router.navigate([], { queryParams: oldQueryParams });
      } else {
        let queryParams = Object.assign({}, oldQueryParams, {
          sort: event.active + "." + direction
        })

        this.router.navigate([], { queryParams });
      }
    }
  }

  clearRow(event, row) {
    row.selectedLevelPrice = null;
    row.newHighlightFieldName = null;
    this.onSelected.emit({name: "clearRow", value: {row}});
  }

  _onCheckboxChange(event, row, column) {
    if ('emitMethodName' in column) {
      this.emitDataChange.emit({
        name: column.emitMethodName,
        value: {
          event, row, column
        }
      });
      this.onEvent.emit({
        name: column.emitMethodName,
        value: {
          event, row, column
        }
      });
    } else if ('methodName' in column) {
      let findMethod = this.lookup.methods.find(_method => _method.name == column.methodName);
    }
  }


  async onCheckboxChange(event, row, column) {

    this.objLocal['selectedRow'] = row;
    if (column.cellTemplate == 'addTmpl') {
      if (event.checked) {
        column.methodName = column.addMethodName;
      } else {
        column.methodName = column.removeMethodName;
      }
    } else if (column.cellTemplate == 'enableTmpl') {

      if (event.checked) {
        column.methodName = column.enableMethodName;
      } else {

        column.methodName = column.disableMethodName;
      }
    }

    let methods = this.lookup.methods;
    let methodIndex = this.lookup.methods.findIndex(method => {
      if (method.name == column.methodName) {
        return true;
      }
    });
    let originMethod = Object.assign({}, methods[methodIndex]);

    originMethod.args = funcs.parseAll(originMethod.args, this.objLocal);

    this.objLocal['selectedRow'].newValue = event.checked;

    this.objLocal['selectedRow']['value'] = row[originMethod.fieldName];

    let method: any = {
      _id: row._id + '.' + column.prop,
      rowId: row._id,
      name: originMethod.name,
      type: originMethod.type,
      collectionName: originMethod.collectionName,
      query: originMethod.args[0],
      update: originMethod.args[1]
    };

    if ('log' in originMethod) {
      let log = funcs.parseParams(originMethod.log, this.objLocal);

      let obj = {
        _id: Random.id(),
        date: new Date(),
        pathname: window.location.pathname
      };
      Object.assign(log.value, obj);
      method.log = log.value;
    }

    if (this.config.isReactiveUpdate) {
      // this.reactiveUpdate(event, row, fieldName);
      MeteorObservable.call('update', method.collectionName, method.query, method.update).subscribe(res => {
      });
    } else {
      let methodIndex = this.methodsToBeRun.findIndex(methodToBeRun => methodToBeRun._id == method._id);
      if (methodIndex >= 0) {
        this.methodsToBeRun[methodIndex] = method;
      }
      else {
        this.methodsToBeRun.push(method);
      }
    }
    this.checkSaveButton();
  }

  removeQuickFilter(event, filter) {
    if (this.isModal) {
      let params = Object.assign({}, this.lookup.params);
      let index = this.quickFilters.findIndex(_filter => _filter.prop == filter.prop);

      this.quickFilters.splice(index, 1);
      delete params.quickColumns;
      delete params.quickValues;

      let p = this._generateURLQuickFilter();

      Object.assign(params, p);
      this.lookup.setParams(params);

      this.reloadData('removeQuickFilter');

    } else {
      let queryParams = Object.assign({}, this.queryParams);

      let index = this.quickFilters.findIndex(_filter => _filter.prop == filter.prop);

      this.quickFilters.splice(index, 1);
      delete queryParams.quickColumns;
      delete queryParams.quickValues;

      let p = this._generateURLQuickFilter();

      Object.assign(queryParams, p);

      this.router.navigate([], {queryParams})
    }
  }

  _generateURLQuickFilter() {
    let result:any = {};
    let quickColumns  = [];
    let quickValues = [];

    if (this.quickFilters) {
      this.quickFilters.forEach( (filter:any, filterIndex) => {
        let index = quickColumns.findIndex(column => filter.prop == column);
        if (index > -1) {
          quickColumns.splice(index, 1);
          quickValues.splice(index, 1);
        }
        quickColumns.push(filter.prop);
        quickValues.push(filter.value);
      });

      result.quickColumns = quickColumns;
      result.quickValues = quickValues;
    }

    return result;
  }

  onClickCell(e, row, column) {
    this.objLocal['selectedRow'] = row;
    this.lookup.objLocal['selectedRow'] = row;

    // if (this.lookup.dataTable.options.returnable) {
    //   this.onSelected.emit(row);
    //   e.preventDefault();
    // }
  }

  setKeywords(keywords) {
    this.keywords = keywords;
    this.lookup.keywords = keywords;
  }

  setPageIndex(pageIndex) {
    if (typeof pageIndex == 'number') {
      this.pageIndex = Number(pageIndex);
      this.lookup.pageIndex = Number(pageIndex);
    }
  }

  setPageSize(size) {
    this.pageSize = size;
    this.lookup.pageSize = size;
  }

  setPriceLevel(e, column) {
    let checkboxFieldName = this._getCheckboxFieldName();
    if ('emitMethodName' in column) {
      this.emitDataChange.emit({
        name: 'setPriceLevel',
        value: {
          event,
          column
        }
      });
      this.onEvent.emit({
        name: 'setPriceLevel',
        value: {
          event,
          column
        }
      });
    } else {
      this.exampleDatabase.value.forEach((row, index) => {
        if (row[checkboxFieldName] && row[column.prop] != 0) {
        } else {
          this.setPrice(e, row, column);
        }
      });
    }

  }

  unsetPriceLevel(e, column) {
    let checkboxFieldName = this._getCheckboxFieldName();
    this.exampleDatabase.value.forEach((row, index) => {
      if (row[checkboxFieldName]) {
        // equal, deselect all
        if ('emitMethodName' in column) {
          this.emitDataChange.emit({
            name: column.emitMethodName,
            value: {
              event,
              row,
              column
            }
          });
          this.onEvent.emit({
            name: column.emitMethodName,
            value: {
              event,
              row,
              column
            }
          });
        } else {
          this.unsetPrice(e, row, column);
        }
      }
    });
  }

  onPriceClick(event, row, column) {
    let checkboxFieldName = this._getCheckboxFieldName();

    if (row[checkboxFieldName]) {

      if ('emitMethodName' in column) {
        this.emitDataChange.emit({
          name: column.emitMethodName,
          value: {
            event,
            row,
            column
          }
        });
        this.onEvent.emit({
          name: column.emitMethodName,
          value: {
            event,
            row,
            column
          }
        });
      } else {
        // if this row is checked
        if (!('updatedFieldName' in column)) {
          this.developerAlertService.developerAlert('UpdatedFieldName is required in this column');
          return;
        }

        if (row['newHighlightFieldName'] && column.prop == row['newHighlightFieldName']) {
          // newHighlightFieldName is defined, and current value is equal to current column prop
          this.unsetPrice(event, row, column);
        } else {
          this.setPrice(event, row, column);
        }
      }

    } else {
      // else, do nothing
    }
  }

  onPriceLevelClick(e, column) {
    // prevent ancestor's handlers from being executed
    e.stopPropagation();
    let checkboxFieldName = this._getCheckboxFieldName();

    let highlightCounts = 0; // number of highlighted cells
    let numberOfCheckedRows = 0;
    this.exampleDatabase.value.forEach((row, index) => {
      if (row[checkboxFieldName] && row[column.prop] && row[column.prop] != 0) {
        numberOfCheckedRows++;
        if (row['newHighlightFieldName'] && row['newHighlightFieldName'] != '' && row['newHighlightFieldName'] == column.prop) {
          highlightCounts++;
        }
      }
    });

    if (numberOfCheckedRows > highlightCounts) {
      // if not all rows are set to this price level, set the price level
      this.setPriceLevel(e, column);
    } else {
      this.unsetPriceLevel(e, column);
    }
  }

  checkSaveButton() {
    this.state.isSaveButtonEnabled = this.methodsToBeRun.length > 0;
  }

  unSubscribe(subscriptions) {
    subscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
  }

  cancelUpdate() {
    let action: Action = {
      collectionName: this.lookup.name,
      type: "CANCEL_UPDATE",
      url: window.location.pathname,
      createdAt: new Date(),
      log: "",
    };

    action.log = `
      Cancel button is pressed
    `;
    this.systemLogsService._log$(action).subscribe();
    if (this.methodsToBeRun.length > 0) {
      if ('cancelLog' in this.lookup.dataTable.options) {
        let cancelLog = this.lookup.dataTable.options.cancelLog;
        let log: any = funcs.parseParams(cancelLog, this.objLocal);

        Object.assign(log.value, { _id: Random.id(), date: new Date() });
        this.systemLogsService._log$(log.value).subscribe();
      }
    }

    this.methodsToBeRun = [];
    this.reloadData("cancel update");
  }

  getTemplateName(column) {
    let templateName = '';
    if (this.Device.isPhone()) {
      if ('showOnMobile' in column) {
        if (column.showOnMobile === true) {
          templateName = column.cellTemplate;
        } else {
          templateName = 'noShowTmpl';
        }
      } else {
        templateName = 'noShowTmpl';
      }
    } else {
      templateName = column.cellTemplate;
    }
    return templateName;
  }

  showColumn(column) {
    if (this.Device.isPhone()) {
      if ('showOnMobile' in column) {
        return column.showOnMobile === true;
      } else {
        return false;
      }

    } else {
      return true;
    }
  }

  async PDF() {
    // console.log(this.params)
    let reportType = this.lookup.dataTable.options.pdfOptions.reportType;
    let allResults = [], pushResults, totals;
    let pdfContent = {}
    let loadingInterval = 0;
    this.lookup.dataTable.options.reportTitle = this.params.pageHeader ? this.params.pageHeader : this.lookup.dataTable.options.reportTitle;
    this.loading = true;
    this.pdfLoadingPercentage = 0;
    if (reportType == 'userDefined' && this.params.userId instanceof Array && this.groupByPDF.length > 0) {
      loadingInterval = (100 / (this.params.userId.length + 2));
      this.pdfLoadingPercentage += loadingInterval;
      for (let index = 0; index < this.params.userId.length; index++) {
        const element = this.params.userId[index];
        this.objLocal.data.userId = [element];
        pushResults = await this.lookup._getQueryAggregateResult(this.groupByPDF).catch(error => console.log(error));
        totals = await this.lookup._calculateTotal().catch(error => console.log(error));
        allResults = [...allResults, ...pushResults];
        // console.log(allResults)
        if (totals) {
          pdfContent = Object.assign({
            totals: totals,
          })
        }
        this.pdfLoadingPercentage += loadingInterval;
      }
    } else {
      this.pdfLoadingPercentage += 33;
      allResults = await this.lookup._getQueryAggregateResult(this.groupByPDF).catch(error => console.log(error));
      totals = await this.lookup._calculateTotal().catch(error => console.log(error));
      if (totals) {
        pdfContent = Object.assign({
          totals: totals,
        })
      }
      this.pdfLoadingPercentage += 33;
    }
    // console.log('!!!',allResults);
    
    pdfContent = Object.assign({
      lookup: this.lookup,
      result: allResults
    })

    let docDefinition;
    switch (reportType) {
      case 'userDefined':
        this.pdfLoadingPercentage += loadingInterval;
        docDefinition = await userDefinedPdfFuncs.userDefinedPdf(pdfContent, this.groupByPDF, this.sortByPDF).catch(error => console.log(error));
      break;
      
      default:
        this.pdfLoadingPercentage += 33;
        docDefinition = await pdfFuncs.reportPdf(pdfContent, this.groupByPDF, this.sortByPDF).catch(error => console.log(error));
      break;
    }
    // console.log('!!DONE',docDefinition);
    pdfMake.createPdf(docDefinition).open();
    this.loading = false;
  }

  pdfAction(){
    // this.lookup.dataTable.options.pdfOptions = this.lookup.dataTable.options.pdfOptions ? this.lookup.dataTable.options.pdfOptions : {};

    if(Object.keys(this.lookup.dataTable.options.pdfOptions).length > 0){
      this.pdfOptions = Object.assign({ active: true }, 
        this.lookup.dataTable.options.pdfOptions ? this.lookup.dataTable.options.pdfOptions : {}
      );
    } else {
      this.PDF()
    }
  }

  showPDFOptions(){
    this.pdfOptions = true;
  }

  selectGroupBy(event, index){
    this.groupByPDF.splice(index - 1, 1, event.prop);
  }

  selectSortBy(event, index){
    this.sortByPDF.splice(index - 1, 1, event.prop);
  }

  _getQueryStages() {
    return this.lookup._getQueryStages();
  }

  _calculateTotal() {

    return this.lookup._calculateTotal();
  }

  _calculateTotal$() {
    return this.lookup._calculateTotal$();
  }

  // set pagination for UI
  setUIPagination() {
    this.pageIndex = this.lookup.pageIndex?this.lookup.pageIndex: 0;
    this.pageSize = this.lookup.pageSize?this.lookup.pageSize: 25;
  }

  removeMethodsToBeRunByMethodId(id) {
    this.methodsToBeRun = this.methodsToBeRun.filter(method => method._id != id);
    this.checkSaveButton();
  }
  removeMethodsToBeRunByRowId(rowId) {
    this.methodsToBeRun = this.methodsToBeRun.filter(method => method.rowId != rowId);
    this.checkSaveButton();
  }

  async checkRow(row, checkboxFieldName) {
    let rowIndex = this.rows.findIndex(_row => _row._id == row._id);

    this.exampleDatabase.value[rowIndex][checkboxFieldName] = true;

    let isRowCheckedInDatabase = this.rows[rowIndex][checkboxFieldName];
    if (isRowCheckedInDatabase) {
      // if this row is checked in the database, no need to check it again, remove the methodToBeRun
      this.exampleDatabase.value[rowIndex].backgroundColor = '';
      this.removeMethodsToBeRunByRowId(row._id);
    } else {
      this.exampleDatabase.value[rowIndex].backgroundColor = 'green';
      // if it is not in the database, check it, and add the method
    }
  }

  async uncheckRow(row, checkboxFieldName) {
    row['newHighlightFieldName'] = undefined;
    let rowIndex = this.rows.findIndex(_row => _row._id == row._id);
    let columnIndex = this.columns.findIndex((column) => column.prop == checkboxFieldName);

    this.exampleDatabase.value[rowIndex][checkboxFieldName] = false;

    let isRowCheckedInDatabase = this.rows[rowIndex][checkboxFieldName];

    if (isRowCheckedInDatabase) {
      // if this row is checked in the database
      this.exampleDatabase.value[rowIndex].backgroundColor = 'red';
    } else {
      this.exampleDatabase.value[rowIndex].backgroundColor = '';
      // if it is not in the database, there is no need to uncheck it, remove the method in the methodsToBeRun
      this.removeMethodsToBeRunByRowId(row._id);
    }
  }

  uncheckAll() {
    let action: Action = {
      collectionName: this.lookup.name,
      type: "UNCHECK_ALL",
      url: window.location.pathname,
      createdAt: new Date(),
      log: "",
    };

    action.log = `
      UnCheck All button is pressed
    `;
    this.systemLogsService._log$(action).subscribe();

    let checkboxFieldName = this.lookup.dataTable.options.checkboxFieldName;
    if ('uncheckAllEmitMethodName' in this.lookup.dataTable.options){
      this.emitDataChange.emit({
        name: this.lookup.dataTable.options.uncheckAllEmitMethodName,
        value: {
          checkboxFieldName
        }
      });
      this.onEvent.emit({
        name: this.lookup.dataTable.options.uncheckAllEmitMethodName,
        value: {
          checkboxFieldName
        }
      });
    } else if ('checkboxFieldName' in this.lookup.dataTable.options) {
      let checkboxFieldName = this.lookup.dataTable.options.checkboxFieldName;
      Promise.all(this.exampleDatabase.value.map(async (row) => {
        if (!row[checkboxFieldName]) {
          await this.checkRow(row, checkboxFieldName).catch(error => console.log(error));
        }
      }));
      this.checkSaveButton();
    } else {

    }

    // if ('checkboxFieldName' in this.lookup.dataTable.options) {
    //   let checkboxFieldName = this.lookup.dataTable.options.checkboxFieldName;
    //   Promise.all(this.exampleDatabase.value.map(async (row, index) => {
    //     if (row[checkboxFieldName]) {
    //       await this.uncheckRow(row, checkboxFieldName);
    //     }
    //   }));
    //   this.checkSaveButton();
    // }
  }

  async checkAll() {
    let action: Action = {
      collectionName: this.lookup.name,
      type: "CHECK_ALL",
      url: window.location.pathname,
      createdAt: new Date(),
      log: "",
    };

    action.log = `
      Check All button is pressed
    `;
    this.systemLogsService._log$(action).subscribe();

    let checkboxFieldName = this.lookup.dataTable.options.checkboxFieldName;
    if ('checkAllEmitMethodName' in this.lookup.dataTable.options){
      this.emitDataChange.emit({
        name: this.lookup.dataTable.options.checkAllEmitMethodName,
        value: {
          checkboxFieldName
        }
      });
      this.onEvent.emit({
        name: this.lookup.dataTable.options.checkAllEmitMethodName,
        value: {
          checkboxFieldName
        }
      });
    } else if ('checkboxFieldName' in this.lookup.dataTable.options) {
      let checkboxFieldName = this.lookup.dataTable.options.checkboxFieldName;
      await Promise.all(this.exampleDatabase.value.map(async (row) => {
        if (!row[checkboxFieldName]) {
          await this.checkRow(row, checkboxFieldName).catch(error => console.log(error));
        }
      })).catch(error => console.log(error));
      this.checkSaveButton();
    } else {

    }
  }

  _returnCheckedRows() {
    let checkboxFieldName = this.lookup.dataTable.options.checkboxFieldName;
    let checkedRows = this.exampleDatabase.value.filter(row => row[checkboxFieldName])
    return checkedRows;
  }

  onDataChange(event, row, column, rowIndex) {
    row['newHighlightFieldName'] = column.prop;

    if ('emitMethodName' in column) {
      this.emitDataChange.emit({
        name: column.emitMethodName,
        value: {
          event,
          row,
          column,
          rowIndex
        }
      });
      this.onEvent.emit({
        name: column.emitMethodName,
        value: {
          event,
          row,
          column,
          rowIndex
        }
      });
    } else {

    }
  }

  setPriceLevelnoCheckBox(e, column) {
    // if ('emitMethodName' in column) {
    //   this.emitDataChange.emit({
    //     name: 'setPriceLevel',
    //     value: {
    //       event,
    //       column
    //     }
    //   });
    // // } else {
      this.exampleDatabase.value.forEach((row, index) => {
        if (row[column.prop] != row['newHighlightFieldName']) {
          row['newHighlightFieldName'] = column.prop;
          this.emitDataChange.emit({
            name: column.emitMethodName,
            value: {
              e,
              row,
              column,
              index
            }
          });
        } else {
        }
      });
    // }

  }

  cellToggle(event, row, column, rowIndex) {
    if (row['newHighlightFieldName'] === column.prop){
      row['newHighlightFieldName'] = null;
    } else {
      row['newHighlightFieldName'] = column.prop;
    }

    if ('emitMethodName' in column) {
      this.emitDataChange.emit({
        name: column.emitMethodName,
        value: {
          event,
          row,
          column,
          rowIndex
        }
      });
    } else {

    }
  }
  overridePriceToggle(event, row, column) {
    if (Number(event.target.value) > 0) {
      if (row['newHighlightFieldName'] === column.prop) {
        row['newHighlightFieldName'] = null;
      } else {
        row['newHighlightFieldName'] = column.prop;
      }
      row[column.prop] = Number(event.target.value);
      if ('emitMethodName' in column) {
        this.emitDataChange.emit({
          name: column.emitMethodName,
          value: {
            event, row, column
          }
        });
      }
    }
  }

  overrideNumber(event, row, column) {
    // if (Number(event.target.value) > 0) {
      if (row['newHighlightFieldName'] === column.prop) {
        row['newHighlightFieldName'] = null;
      } else {
        row['newHighlightFieldName'] = column.prop;
      }
      row[column.prop] = Number(event.target.value);
      if ('emitMethodName' in column) {
        this.emitDataChange.emit({
          name: column.emitMethodName,
          value: {
            event, row, column
          }
        });
      }
    // }
  }

  addMethodToBeRun(method) {
    let findIndex = this.methodsToBeRun.findIndex(_method => _method._id == method._id);
    if (findIndex > -1) {
      this.methodsToBeRun[findIndex] = method;
    } else {
      this.methodsToBeRun.push(method);
    }
    this.checkSaveButton();
  }

  _getPristineRows() {
    // return pristine rows in the table
    return this.rows;
  }

  _getDirtyRows() {
    return this.exampleDatabase.value;
  }

  overridePrice(event, row, column) {
    row[column.prop] = Number(event.target.value);
    if ('emitMethodName' in column){
      this.emitDataChange.emit({
        name: column.emitMethodName,
        value: {
          event, row, column
        }
      });
      this.onEvent.emit({
        name: column.emitMethodName,
        value: {
          event, row, column
        }
      });
    } else if ('checkboxFieldName' in this.lookup.dataTable.options) {
      let checkboxFieldName = this.lookup.dataTable.options.checkboxFieldName;
    }
  }

  updateWithUndo(event, row, column) {
    let previousValue = row[column.prop];
    row[column.prop] = Number(event.target.value);
    
    if (row['newHighlightFieldName']){
      row['newHighlightFieldName'].push({ prop: column.prop, previousValue});
    } else {
      row['newHighlightFieldName'] = [{ prop: column.prop, previousValue }];
    }
    if ('emitMethodName' in column) {
      this.emitDataChange.emit({
        name: column.emitMethodName,
        value: {
          event, row, column
        }
      });
      this.onEvent.emit({
        name: column.emitMethodName,
        value: {
          event, row, column
        }
      });
    }
    // this._runTotalAggregateMethod$()
  }

  resetPreviousValue(row, column){
    if (row['newHighlightFieldName']){
      let index = row['newHighlightFieldName'].findIndex((obj => obj['prop'] == column.prop));
      row[column.prop] = row['newHighlightFieldName'][index].previousValue;
      row['newHighlightFieldName'].splice(index, 1);
      if ('emitMethodName' in column) {
        this.emitDataChange.emit({
          name: column.emitMethodName,
          value: {
            event, row, column
          }
        });
        this.onEvent.emit({
          name: column.emitMethodName,
          value: {
            event, row, column
          }
        });
      }
    }
  }

  arrayObjfilter(array, key, value){
    if (array) {
      let filter = array.filter(element => element[key] == value);
      return filter.length > 0 ? true : false;
    } else {
      return false;
    }
  }

  focus(input: HTMLInputElement){
    setTimeout(() => input.select(), 0);
  }

  onClickQtyCell(event) {
    event.stopPropagation();

  }

  onNumberChange(row, column, event) {
    event.preventDefault();
    if ('emitMethodName' in column) {

    } else {
      this.emitDataChange.emit({
        name: "onNumberChange",
        value: {
          row,
          column,
          event
        }
      });
      this.onEvent.emit({
        name: "onNumberChange",
        value: {
          row,
          column,
          event
        }
      });
    }
  }

  onPriceChange(event, row, column) {
    if ('emitMethodName' in column){
      this.emitDataChange.emit({
        name: column.emitMethodName,
        value: {
          event, row, column
        }
      });
      this.onEvent.emit({
        name: column.emitMethodName,
        value: {
          event, row, column
        }
      });
    } else if ('checkboxFieldName' in this.lookup.dataTable.options) {
      let checkboxFieldName = this.lookup.dataTable.options.checkboxFieldName;
    }
  }

  developerAlert(content) {
    if (Meteor.settings.public.isTestWebsite && this.userGroupService.isDeveloper) {
      this._service.error(
        'Error',
        content
      )
    }
  }

  onReturn(event){
    console.log(event)
  }

  hookEvents() {
    this.eventSub = EventEmitterService.Events.subscribe((event:any) => {
      /*if (event.name == 'onPageChange') {
        if (this.aggregateSub) {

          // this.aggregateSub.unsubscribe();
        }
      }*/
      if (event.type === 'topbar-search') {
        this.search(event.value);
      }
    })
  }

  checkType(val) {
    return typeof val === 'string';
  }

  preventDefault(event) {
    event.stopPropagation();
  }

  ngOnDestroy() {
    this.methods = [];
    this.setLoading(false);
    this.unSubscribe(this.subscribeSubscriptions);
    this.unSubscribe(this.autorunSubscriptions);

    this.unSubscribe(this.observeSubscriptions);
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }

  }

  //TEST GROUPING
  private transformer = (node, level) => {
    let obj = {
      expandable: !!node.items && node.items.length > 0,
      level: level,
    }
    
    for (let index = 0; index < this.displayedColumns.length; index++) {
      const element = this.displayedColumns[index];
      Object.assign(obj, { [element]: node[element] })
    }
    // console.log('~~~', obj)
    
    return obj;
  }
  
  treeControl = new FlatTreeControl (
    node => node['level'], node => node['expandable']);
    
    treeFlattener = new MatTreeFlattener(
      this.transformer, node => node.level,
      node => node.expandable, node => node.items);
      hasChild = (_: number, node) => node.expandable;
      
  dataSourceTree = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  groupTest(){
    // console.log(this.dataSource);
    // console.log(this.dataSourceTree);
    
    let group = pdfFuncs.groupFunctions({
      result: this.dataSource._database._value
    }, ['category'])
    // console.log(group);
    // this.dataSourceTree = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.dataSourceTree.data = group;
    this.dataSource = this.dataSourceTree;
    // console.log(this.dataSource);
    // this.dataSource = this.dataSourceTree;
    // console.log(this.dataSource);
    // console.log(this.dataSourceTree);
    // this.reloadData('reload table');
  }
}

@Component({
  selector: 'dialog-Select',
  templateUrl: 'template1.html'
})

export class DialogSelect {

  enableCompleteOrder: boolean = false;
  constructor(
    public dialogRef: MatDialogRef<DialogSelect>,
    @Inject(MAT_DIALOG_DATA) public data:DialogData) {
    data = {
      question: "Are you sure to delete?",
      template: "options",
      yes: "Yes",
      no: "No"
    };

    if (!data) {
      data = {
        question: "Are you sure to delete?",
        template: '',
        yes: "Yes",
        no: "No"
      };
    }
  }
}

interface DialogData {
  question: string,
  template: string,
  yes: string,
  no: string
}

export class ExampleDataSource extends DataSource<any> {
  constructor(public _database: any) {
    super();
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect() {

    const displayDataChanges = [
      this._database
    ];

    return merge(...displayDataChanges).pipe(map(() => this._database.value));
  }

  disconnect() { }
}

