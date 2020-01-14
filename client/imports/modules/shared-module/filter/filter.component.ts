import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import * as types from './actionTypes';
@Component({
  selector: 'filter-component',
  templateUrl: 'filter.component.html',
  styleUrls: [ 'filter.scss' ]
})

export class FilterComponent implements OnInit{
  lookupName: string;
  documentId: string;
  data: any = {};
  length: number;
  columns = [];
  selectedColumn: string;
  filterMethods = [];
  selectedMethod: string;
  state:any = {
    addedFilters: [],
    isDetailHidden: false,
    selectedFilter: {}
  };
  constructor(private router?: Router){ }

  ngOnInit() {
    this.columns = [{
      name: 'Eame',
      prop: 'name'
    }, {
      name: 'Email',
      prop: 'email'
    }, {
      name: 'Date',
      prop: 'date'
    }];
    this.filterMethods = [
      {
        name: "Contains One of",
        prop: 'or'
      },
      {
        name: 'Equal to',
        prop: '='
      },
      {
        name: 'Start With',
        prop: 'like%'
      },
      {
        name: 'Like',
        prop: '%like%'
      }
    ]
  }

  applyFilter(filter) {

    let length = this.state.addedFilters.length;

    let index = -1;
    if ('_id' in filter) {
      index = this.state.addedFilters.findIndex(addedFilter => {
        return addedFilter['_id'] == filter['_id'];
      });
    }
    if (index < 0) {
      this.state.addedFilters.push(filter);
      // let conditions = this.generateConditions(this.addedFilters);
      // this.filter.emit({
      //   type: 'ADD_FILTER',
      //   value: conditions
      // });

    } else {
      this.state.addedFilters[index] = filter;
      // let conditions = this.generateConditions(this.addedFilters);
      // this.filter.emit({
      //   type: 'ADD_FILTER',
      //   value: conditions
      // });
    }
    // this.filterState.addedFilters.set(this.state.addedFilters);

    // let queryParams = this.generateQueryParams(this.state.addedFilters);
    //
    // this.router.navigate([], {queryParams});
  }

  reducers(action) {
    let result ;
    switch(action.type) {
      case types.HIDE_FILTER_DETAIL_COMPONENT:
        this.state.isDetailHidden = true;
        return ;
      case types.SHOW_FILTER_DETAIL_COMPONENT:
        this.state.isDetailHidden = false;
        return ;
      case types.ADD_NEW_FILTER:
        this.state.isDetailHidden = false;
        return ;
      case types.APPLY_FILTER:
        // let result = this.checkFiltername(action.value.filter);
        // this.applyFilter(action.value.filter);
        this.state.isDetailHidden = true;

        return;
      case types.SAVE_NEW_FILTER:
        this.state.selectedFilter = action.value.filter;
        // this.applyFilter(action.value.filter);
        this.state.isDetailHidden = true;
        return  ;
      case types.SAVE_FILTER:
        this.state.selectedFilter = action.value.filter;
        // this.applyFilter(action.value.filter);
        this.state.isDetailHidden = true;
        return  ;
      default:
        return ;
    }
  }
}