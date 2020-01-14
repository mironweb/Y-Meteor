import { Component, OnInit, OnDestroy, Input, Output, OnChanges, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { NotificationsService } from 'angular2-notifications';

import { Subscription } from 'rxjs/Subscription';
import {UserFilter, UserFilterModel} from '../../../../../both/models/userFilter.model';
import * as types from './actionTypes';
import {UserFilterService} from './filter.service';
import Methods from '../../../../../both/config/filterMethods';
import * as moment from 'moment';
import * as cloneDeep from 'clone-deep';
import ErrorCodes from "../../../../../both/config/errorCode";
import {ActivatedRoute, Router} from "@angular/router";
import {EventEmitterService} from "../../../services";

@Component({
  selector: 'filterDetail-component',
  templateUrl: "filterDetail.component.html",
  styleUrls: [ 'filter.scss' ],

})

export class FilterDetailComponent implements OnInit, OnDestroy {
  @Input() filterId: string;
  @Input() filter: UserFilter;
  @Input() columns: Array<any>;
  @Input() methods: Array<any>;
  @Input() lookupName: string;
  @Input() savedFilters: Array<any>;
  @Output() stateOutput = new EventEmitter<any>();
  @ViewChild('startPicker') startPicker: ElementRef;
  @ViewChild('endPicker') endPicker: ElementRef;

  documentId: string;
  data: any = {};
  length: number;
  filterMethods = [];
  subscriptions: Subscription[] = [];
  filterDetail: UserFilter;
  filterModel: UserFilterModel;

  multipleConditionsConfig = {
    enableSave: false,
    needClone: false
  }

  constructor(private _service: NotificationsService,
              private filterService: UserFilterService,
              private router: Router){}

  ngOnInit() {

    if (this.filter) {
      this.filterDetail = this.filter;
    } else {
      this.filterDetail = cloneDeep(this.filterService.currentFilter);
    }

  }

  onFilterChange(filter: any) {
    this.filterDetail = filter;
    let length = this.filterDetail.conditions.length;

    if(length > 0) {
      this.filterDetail.conditions.forEach((condition: any) => {
        condition.methods = Methods[condition.type];
      })
    }
  }

  removeAddedFilter(filter) {
    if (filter._id == this.filterDetail['_id']) {
      this.filterDetail = new UserFilter();
      return true;
    } else {
      return false;
    }
  }

  addValueToCondition(selectedCondition, conditionIndex, tag) {
    if (tag) {
      if(selectedCondition.method === '$or') {

        let isExist = this.filterDetail.conditions[conditionIndex].value.some(value => value === tag);
        if (!isExist) {
          this.filterDetail.conditions[conditionIndex].value.push(tag);
        }
      }
    }
  }

  removeTag(selctedCondition, conditionIndex, index) {
    if (selctedCondition.method === '$or') {
      this.filterDetail.conditions[conditionIndex].value.splice(index, 1);
    }
  }

  removeCondition(selctedCondition, conditionIndex) {
    // let conditionIndex = this.userFilter.conditions.findIndex((condition) => {
    //   return condition.method === selctedCondition.method;
    // });
    this.filterDetail.conditions.splice(conditionIndex, 1);
  }

  async saveFilter() {
    // check filter
    if (this.filterDetail.name == undefined) {
      this._service.alert(
        "Alert",
        "Filter Name is required"
      );
      return;
    }

    if (this.filterDetail.conditions.length == 0 || this.filterDetail.conditions[0].value === '') {
      this._service.alert(
        "Alert",
        "Please add a condition"
      );
      return;
    }

    if (this.filterDetail._id) {
      let result = await this.filterDetail._update$().toPromise();
      if (result === 1) {

      } else if ('code\' in result') {
        let errorCode = ErrorCodes.find((_errorCode) => _errorCode.code == result.code);
        this._service.error(
          "Error",
          errorCode.detail
        )
      }
    } else {
      // this is a new filter
      this.filterDetail.lookupName = this.lookupName;
      this.filterDetail.url = window.location.pathname;
      this.filterService.currentFilter = cloneDeep(this.filterDetail);

      let result:any = await this.filterService._insert$().toPromise();

      if (typeof result == 'string') {
        this.filterDetail._id = result;
        this.filterService.currentFilter._id = this.filterDetail._id;

        // EventEmitterService.Events.emit({
        //   name: "addNewFilter"
        // })
      }
    }
    this.applyFilter();
  }

  hideFilterDetail() {
    this.stateOutput.emit({
      type: types.HIDE_FILTER_DETAIL_COMPONENT
    })
  }

  addCondition() {
    this.filterDetail.conditions.push({
      name: "",
      column: '',
      type: '',
      method: '',
      methods: [],
      value: ''
    });
  }

  applyFilter() {
    if (!('value' in this.filterDetail.conditions[0]) ||
      this.filterDetail.conditions[0].value === '' ||
      this.filterDetail.conditions.length <= 0) {
      this._service.alert(
        'Warning',
        'Please add a condition'
      );
      return;
    }

    if (!this.filterDetail.name) {
      this.filterDetail.name = "DEFAULT";
    }
    let queryParams:any = {};
    this.filterDetail.conditions.forEach(condition => {
      let query = condition.column + '.' + condition.method;
      queryParams[query] = condition.value;
    });
    // this.router.navigate([], {queryParams, queryParamsHandling: 'merge'});
    let result = {
      type: types.APPLY_FILTER,
      value: {
        filter: this.filterDetail
      }
    };

    queryParams = this.filterDetail._getQueryParams();

    if (!this.filterDetail._id && this.filterDetail.name) {
      queryParams.filterName = this.filterDetail.name;
    }
    this.router.navigate([], {queryParams});

    // this.stateOutput.emit(result);
  }

  deleteFilter() {
    if (this.filterDetail._id && this.filterDetail._id != '') {
      this.filterService._delete$()
        .subscribe(res => {
          if (res) {
            this._service.success(
              "Success",
              "Delete successfully"
            );
            this.router.navigate([]);
          }
        })
    } else {
      this._service.alert(
        "Warning",
        "This is not saved!"
      )
    }
  }

  onMethodChange(event, conditionIndex) {
    let condition = this.filterDetail.conditions[conditionIndex];

    console.log('on method change', event);
    switch(condition.method) {

      case '$gte':
        condition.value = [];
        return;
      case '$or': case '$lt':
        condition.value = [];
        return;
      case '<>':
        condition.value = [];
        return;
      case '$eq': case '$ne':
        if (condition.type == 'date') {
          condition.value = null;
        } else {
          condition.value = '';
        }
        return;
      case 'thisMonth':
        // const date = new Date();
        // const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        // let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        // lastDay = moment(lastDay).hour(23).minutes(59).seconds(59).toDate();
        // condition.value = [
        //   firstDay,
        //   lastDay
        // ];
        condition.value = 'thisMonth';
        return;
      default:
        condition.value = [];
        return;
    }
  }

  // onColumnChange(event, conditionIndex) {
  //   let condition = this.filterDetail.conditions[conditionIndex];
  //
  //   this.columns.findIndex(column => {
  //     if (condition.column == column.prop) {
  //       condition.type = column.type;
  //       return true;
  //     }
  //   });
  //   condition.methods = Methods[condition.type];
  //
  //   switch(condition.method) {
  //     case '$or':
  //       condition.value = [];
  //       return;
  //     case '<>':
  //       condition.value = [];
  //       return;
  //     case 'month':
  //       condition.value = [];
  //       return;
  //     case '$eq':
  //       condition.value = '';
  //       return;
  //     default:
  //       condition.value = '';
  //       return;
  //   }
  // }

  reducers(action) {
    switch(action.type) {
      case types.SAVE_NEW_FILTER:

        return;
      case types.UPDATE_FILTER:
        return;
      default:
        return;
    }
  }

  onEndDateChange(endDate, conditionIndex) {
    endDate = moment(endDate).hour(23).minutes(59).seconds(59).toDate();
    this.filterDetail.conditions[conditionIndex].value[1] = endDate;
  }

  onEarlierChange(earlierDate, conditionIndex) {
    earlierDate = moment(earlierDate).hour(23).minutes(59).seconds(59).toDate();
    this.filterDetail.conditions[conditionIndex].value[0] = earlierDate;
  }

  reloadFilter() {

  }

  updateFiltername($event) {
    Object.assign(this.filterDetail, {name: $event.target.value});
  }

  getFilteredColumns(conditionIndex) {

    let otherConditionsColumnNames = new Set();
    this.filterDetail.conditions.forEach((condition, index) => {
      if (condition.column && condition.column != '' && conditionIndex != index) {
        otherConditionsColumnNames.add(condition.column);
      }
    });

    let filteredColumns = this.columns.filter(_column => {
      if (!otherConditionsColumnNames.has(_column.prop)) {
        return true;
      }
    });

    return filteredColumns;
  }

  syncCondition(condition, index) {
    // this.filterDetail.conditions[index] = condition;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      // subscription.unsubscribe();
    })
  }

}