import { Component, OnInit, OnDestroy, Output, Input, EventEmitter, ViewChild } from '@angular/core';
import { NotificationsService } from 'angular2-notifications';
import { Subscription } from 'rxjs/Subscription';
import {Router, ActivatedRoute} from '@angular/router';

import {MeteorObservable} from "meteor-rxjs";
import { UserFilterService } from './filter.service';
import * as types from './actionTypes';
import { UserFilters } from '../../../../../both/collections/userFilters.collection';
import {callbackToPromise} from '../../../../../both/functions/common';
import {UserFilter, UserFilterModel} from "../../../../../both/models/userFilter.model";
import {Column, SystemLookup, SystemLookupModel,} from "../../../../../both/models/systemLookup.model";
import {UserService} from "../../../services/UserService";
import * as funcs from '../../../../../both/functions/common';
import {merge} from "rxjs/observable/merge";
import {of} from "rxjs/observable/of";
import { switchMap, tap} from "rxjs/operators";
import * as cloneDeep from 'clone-deep';
import {EventEmitterService} from "../../../services";
import {Subscriber} from "rxjs/Subscriber";
import {PageResolver} from "../../../resolvers/PageResolver";

@Component({
  selector: 'filterBox-component',
  templateUrl: 'filterBox.component.html',
  styleUrls: [ 'filter.scss' ],
  providers: [UserFilterService]
})

export class FilterBoxComponent implements OnInit, OnDestroy {
  @Output() filter = new EventEmitter<any>();
  @Output() modalData = new EventEmitter<any>();

  @Input() lookupName:string;
  @Input() isModal:boolean = false;

  isDeveloper = false;
  eventSubscriber: Subscriber<any>;
  view: string;
  test: string;
  addedFilters: UserFilter[]; // added filters to filter datatable
  selectedSavedFilter: UserFilter; // selected filter from saved filters
  selectedConditionIndex: number;
  conditions: any[] = [];

  subscriptions: Subscription[] = [];
  savedFilters: UserFilter[];
  newFilter: UserFilter;
  columns: Column[];
  state:any = {
    addedFilters: [],
    selectedFilter: {},
    savedFilters: {},
    columns: [],
    view: ''
  };
  queryParams: any;

  conditionConfig = {
    enableSave: true,
    needClone: true
  };

  constructor(private _service: NotificationsService,
              private router: Router,
              private activatedRoute: ActivatedRoute,
              public userFilterService: UserFilterService,
              private userService: UserService) {
    this.isDeveloper = PageResolver.isDeveloper;
    this.savedFilters = [];
  }

  ngOnInit() {
    SystemLookup._GetReferredLookup$(this.userService.user, this.lookupName)
      .pipe(
        tap((lookup:SystemLookupModel) => {
          this.columns = lookup.dataTable.columns.filter((column:any) => column.type != 'actions' && column.hidden === false);
        }),
        // make subscriptions to the userFilters collection
        switchMap(() => {
          let autorun = MeteorObservable.autorun();
          let sub = MeteorObservable.subscribe('userFilters', {lookupName: this.lookupName});
          return merge(autorun, sub);
          }
        ),
        tap(() => this.loadSavedFilters()),
        switchMap(() => this.activatedRoute.queryParams),
        tap(queryParams => {
          this.selectedConditionIndex = undefined;
          this.view = '';
          // this.userFilterService.currentFilter = undefined;
          this.userFilterService.currentFilter = new UserFilter();
          if (!queryParams.filterId && queryParams.filterName ) {
            this.userFilterService.currentFilter.name = queryParams.filterName;
          }
          this.queryParams = queryParams;

        }),
        tap(() => this.loadCurrentFilter()),
        tap(() => this.reloadCurrentFilterCondtions()),
      )
      .subscribe();
    // this.hookEvents();
  }

  hookEvents() {
    this.eventSubscriber = EventEmitterService.Events.subscribe((event:any) => {
      if (event.name == 'addNewFilter') {
        of('start')
          .pipe(
            tap(() => this.loadSavedFilters()),
            tap(() => this.loadCurrentFilter())
          ).subscribe();
      }
    })
  }

  loadCurrentFilter() {
    if ('filterId' in this.queryParams) {
      // get the filterId
      this.savedFilters.forEach(filter => {

        if (this.queryParams.filterId == filter._id) {

          this.userFilterService.currentFilter = cloneDeep(filter);
          this.conditions = this.userFilterService.currentFilter.conditions.slice();
        }
      })
    } else if ('filterName' in this.queryParams) {
      this.userFilterService.currentFilter = new UserFilter();
      this.userFilterService.currentFilter.name = this.queryParams.filterName;
    }
    if (this.columns) {
      this.userFilterService.currentFilter.columns = this.columns;
    }
  }

  loadCondition(conditionIndex) {
    this.selectedConditionIndex = conditionIndex;
    this.view = 'condition';
  }

  reloadCurrentFilterCondtions() {
    this.userFilterService.currentFilter.setParams(this.queryParams);
  }

  _getReferredLookup$() {
    return SystemLookup._GetReferredLookup$(this.userService.user, this.lookupName);
  }

  loadSavedFilters() {
    this.savedFilters = [];
    let query = {
      tenantId: Session.get('tenantId'),
      lookupName: this.lookupName
    };

    UserFilters.collection.find(query).fetch()
      .forEach((filter:UserFilterModel) => {
        if (!filter['hidden']) {
          let savedFilter = new UserFilter(filter);
          savedFilter.columns = this.columns;
          this.savedFilters.push(savedFilter);
        }
      });
  }

  loadUrlFilter$() {
    if (!funcs.isEmptyObject(this.queryParams)) {
      if ('filterId' in this.queryParams) {
        // if filterId exists, load from database

        // UserFilter._findDefaultFilterByQuery$({_id: this.queryParams.filterId})
        //   .pipes(
        //     map((filter: UserFilterModel) => new UserFilter(filter))
        //   ).subscribe((filter: UserFilter) =>{
        //   if ('filtername' in this.queryParams) {
        //   }
        // })
      } else if ('filtername' in this.queryParams) {
        // if filtername exists, override it
        // this.selectedFilter.name = this.queryParams.filtername;

        // this.selectedFilter.columns = this.columns;
        // this.selectedFilter.buildConditionsByParams(this.queryParams);
      } else {
        // this.selectedFilter = undefined;
      }
    }
  }

  async onInit() {
    this.getSavedFilters();

    let sub;
    // get columns
    sub = MeteorObservable.autorun().subscribe(async () => {
      if (Session.get('parentTenantId')) {
        let query = {
          name: this.lookupName,
          parentTenantId: Session.get('parentTenantId')
        };

        let result:any = await callbackToPromise(
          MeteorObservable.call('findOne', 'systemLookups', query, {})
        );
        this.state.columns = result.dataTable.columns;
        this.state.columns = this.state.columns.filter(column => column.type != 'actions' && column.hidden === false);
      }
    });

    this.subscriptions.push(sub);
    // this.getAddedFiltersFromUrl();
  }

  getSavedFilters() {
    let sub = MeteorObservable.subscribe('userFilters', {}, {}, '').subscribe();
    this.subscriptions.push(sub);
    MeteorObservable.autorun().subscribe(() => {
      if (Session.get('parentTenantId')) {
        let query = {
          parentTenantId: Session.get('parentTenantId'),
          lookupName: this.lookupName
        };
        this.state.savedFilters = UserFilters.collection.find(query).fetch();
      }
    });
  }

  onSelectFilter() {
    // this.loadSelectedFilter();
    this.savedFilters.find(_filter => {
      if(_filter.name == this.userFilterService.currentFilter.name) {
        this.userFilterService.currentFilter = _filter;
        this.conditions = this.userFilterService.currentFilter.conditions.slice();
        return true;
      }
    });

    this.reducers({type: types.APPLY_FILTER, value: {filter: this.userFilterService.currentFilter}});
  }

  addFilter(filter: UserFilter) {
    if (filter) {
      let index = -1;
      if ('_id' in filter) {
        index = this.state.addedFilters.findIndex(addedFilter => {
          return addedFilter['_id'] == filter['_id'];
        });
      }
      if (index < 0) {
        this.state.addedFilters.push(filter);
        let queryParams = this.generateQueryParams();

        if (this.isModal) {
          this.modalData.emit(queryParams);
        } else {

          this.router.navigate([''], {queryParams, queryParamsHandling: 'merge'}).catch(error => console.log(error));
        }
      } else {
        this._service.success(
          'Alert',
          ' already added'
        );
      }

    } else {
      this._service.alert(
        'Alert',
        'Please select a filter'
      )
    }
  }

  generateQueryParams() {
    let queryParams:any = {};
    queryParams.filters = [];

    this.state.addedFilters.forEach(addedFilter => {
      queryParams.filters.push(addedFilter._id);
      addedFilter.conditions.forEach(condition => {
        let key = condition.column;
        queryParams[key] = condition.method + "." + condition.value;
      });
    });
    return queryParams;
  }

  applyFilter(filter: UserFilter) {
    let queryParams:any = filter._getQueryParams();

    if (this.isModal) {
      this.modalData.emit(queryParams);
    } else {

      this.loadSavedFilters();
      this.loadCurrentFilter();
      this.userFilterService.navigate(queryParams);
    }
  }

  addNewFilter() {

    this.newFilter = new UserFilter();
    this.view = 'newFilter';
  }

  removeCondition(conditionIndex) {
    this.userFilterService.currentFilter.conditions.splice(conditionIndex, 1);
    let queryParams = this.userFilterService.currentFilter._getQueryParams();

    if (this.userFilterService.currentFilter.conditions.length > 0) {
      this.userFilterService.navigate(queryParams);
    } else {
      this.userFilterService.navigate({});
    }
  }

  hideCurrentFilter() {
    // this.selectedFilter = undefined;
    // this.passedFilter = undefined;
    this.view = '';
    // let index = this.state.addedFilters.indexOf(filter);
    // this.state.addedFilters.splice(index, 1);
    // let result = this.filterDetail.removeAddedFilter(filter);
    // if (result) {
    //   this.state.isDetailHidden = true;
    // }
    // let queryParams = this.generateQueryParams(this.state.addedFilters);
    //
    // let keywords = getParameterByName('keywords');
    // if (keywords) {
    //   queryParams.keywords = keywords;
    // }

    if (this.isModal) {
      this.modalData.emit({});
    } else {

      this.router.navigate([], ).catch(error => console.log(error));
    }
  }

  // navigateTo(queryParams) {
  //   if (this.state.view != '') {
  //     Object.assign(queryParams, {view: this.state.view});
  //     }
  //
  //   this.router.navigate([], {queryParams});
  // }

  deleteSavedFilter(filter: UserFilter) {
    this.userFilterService._delete$()
      // .subscribe();
    // filter._delete$()
    //   .pipe(
    //     tap(() => {
    //
    //     })
    //   )
    //
      .subscribe((res:any) => {
      if (res === 1) {
        this.hideCurrentFilter();
      } else {

      }
    })
  }

  reducers(action) {
    switch(action.type) {
      case types.HIDE_FILTER_DETAIL_COMPONENT:
        this.view = '';
        return ;
      case types.SHOW_FILTER_DETAIL_COMPONENT:
        this.view = 'filter';
        return ;
      case types.ADD_NEW_FILTER:
        this.addFilter(action.value.filter);
        this.state.selectedSavedFilter = undefined;
        this.view = '';
        return ;
      case types.APPLY_FILTER:
        // this.selectedFilter = action.value.filter;
        this.selectedSavedFilter = new UserFilter();
        this.view = '';
        this.applyFilter(action.value.filter);

        return;
      case types.DELETE_FILTER:
        this.deleteSavedFilter(action.value.filter);
        this.view = '';

        return;
      case types.SAVE_NEW_FILTER:
        this.state.selectedFilter = action.value.filter;
        this.applyFilter(action.value.filter);
        this.view = '';
        return  ;
      case types.SAVE_FILTER:
        this.state.selectedFilter = action.value.filter;
        this.view = '';
        this.applyFilter(action.value.filter);
        return  ;
      case types.CHANGE_FILTER:
        this.userFilterService.currentFilter = action.value.filter;
        this.selectedSavedFilter = undefined;
        this.applyFilter(action.value.filter);
        return;
      default:
        return ;
    }
  }



  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
    this.state.addedFilters = [];
    if (this.eventSubscriber) {
      this.eventSubscriber.unsubscribe();
    }
  }

  hideCondition() {
    this.selectedConditionIndex = undefined;
    this.view = '';
  }

  addNewCondition() {
    this.selectedConditionIndex = this.userFilterService.currentFilter.conditions.length;
    this.view = 'condition';
  }

  compareObjects(o1: any, o2: any): boolean {
    return o1._id === o2._id;
  }

  reloadFilter() {
    let query = {
      _id: this.userFilterService.currentFilter._id
    };
    UserFilter._FindFilterByQuery$(query)
      .subscribe(filter => {
        this.userFilterService.currentFilter = new UserFilter(filter);
        let queryParams = this.userFilterService.currentFilter._getQueryParams();
        this.userFilterService.navigate(queryParams);
      })
  }

  editFilter() {
    if (this.userFilterService.currentFilter._id || this.userFilterService.currentFilter.name) {
      this.view = 'filter';
    } else {
      this._service.alert(
        "Warning",
        "Please select a fitler!"
      )
    }
  }

  saveFilter() {
    let filter = this.userFilterService.currentFilter;
    filter.lookupName = this.lookupName;
    filter.createdAt = new Date();
    filter.url = window.location.pathname;
    if (filter._id) {
      // save
      this.userFilterService._save$()
        .subscribe(res => {
          if (res == 1) {
            this._service.success(
              "Success",
              "Done!"
            );
            let queryParams = filter._getQueryParams();
            this.userFilterService.navigate(queryParams);
          } else {
            this._service.error(
              "Error",
              "Failed"
            );
          }
        });
    } else {
      // insert
      filter._insert$()
        .subscribe( res => {
          if ('error' in res) {
            this._service.error(
              "Error",
              res.error.code
            );
          } else {
            if (typeof res == 'string') {
              filter._id = res;
              let queryParams = filter._getQueryParams();
              this.userFilterService.navigate(queryParams);
            }
          }
        })
    }
  }

  setDefault() {
    let query = {
      lookupName: this.lookupName,
      isDefault: true
    };
    MeteorObservable.call('find', 'userFilters', query)
      .pipe(
        switchMap((res: any) => {
          if (res.length == 1) {
            let defaultFilter = new UserFilter(res[0]);
            defaultFilter.isDefault = false;
            return defaultFilter._save$()
              .pipe(
                switchMap(() => {
                  this.userFilterService.currentFilter.isDefault = true;
                  return this.userFilterService.currentFilter._save$();
                })
              )
          } else if (res.length == 0 ) {
            this.userFilterService.currentFilter.isDefault = true;
            return this.userFilterService.currentFilter._save$();
          }
        })
      )
      .subscribe()
  }

  convertDate(d) {
    return new Date(d);
  }
}