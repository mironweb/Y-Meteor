import {MeteorObservable} from "meteor-rxjs";
import {Observable} from "rxjs/Observable";
import Methods from '../config/filterMethods';
import {Column} from "./systemLookup.model";
import {ParamMap} from "@angular/router";

import * as funcs from '../functions/common';

export interface UserFilterModel {
  _id?: string;
  name?: string;
  lookupName?: string;
  url?: string;
  hidden?: boolean;
  conditions?: Condition[];
  createdUserId?: string;
  createdAt?: Date;
  tenantId?: string;
  parentTenantId?: string;
  isDefault?: boolean;
  isPrivate?: boolean;
}

interface Condition {
  name: string;
  column: string;
  type: string;
  method?: string;
  methods?: {}[];
  value?: any;
}

const properties = [
  "_id",
  "name",
  "lookupName",
  "url",
  "hidden",
  "conditions",
  "tenantId",
  "createdUserId",
  "createdAt",
  "isDefault",
  "parentTenantId"
]

export class UserFilter implements UserFilterModel {
  _id: string;
  name: string;
  url: string;
  hidden: boolean;
  lookupName: string;
  conditions: Condition[] = [];
  createdUserId: string;
  createdAt: Date;
  tenantId: string;
  parentTenantId: string;
  isDefault: boolean;
  columns: Column[];
  params: {}[];
  queryParams: {};


  static _FindFilterByQuery$(query) : Observable<UserFilterModel> {
    return MeteorObservable.call('findOne', 'userFilters', query);

  }

  static _findDefaultFilterByUrl$(url): Observable<UserFilterModel> {
    let query = {
      url,
      isDefault: true,
      tenantId: Session.get('tenantId')
    };
    return MeteorObservable.call('findOne', 'userFilters', query);
  }

  static _findFilterByName$(name): Observable<UserFilterModel> {
    let query = {
      name: name,
      tenantId: Session.get('tenantId')
    };
    return MeteorObservable.call('findOne', 'userFilters', query);
  }

  static _findDefaultFilterByQuery$(query: {}): Observable<UserFilterModel> {
    return MeteorObservable.call('findOne', 'userFilters', query);

  }

  static _convertToCondtionsByQueryParams(queryParams) {
    let conditions = [];
    if ('columns' in queryParams) {
      let columns = [];
      if (typeof queryParams.columns === 'string') {
        columns.push(queryParams.columns);
      } else {
        columns = queryParams.columns;
      }
      columns.forEach(columnName => {
        let methodName = queryParams[columnName + "_method"];
        let value = queryParams[columnName + "_value"];
        conditions.push({
          field: columnName,
          method: methodName,
          value,
        })
      })
    }

    return conditions;
  }

  static _convertToCondtionsByQueryParamMap(queryParamMap: ParamMap) {
    let conditions : any[] = [];

    if (queryParamMap.keys.indexOf('columns') > -1) {
      queryParamMap.getAll('columns').forEach(columnName => {
        let temp:any = {};
        let methodName = queryParamMap.get(columnName + "_method")
        switch (methodName) {
          case "<>":
            temp.field = columnName;
            temp.method = methodName;
            temp.value = queryParamMap.getAll(columnName + "_value");
            break;
          case "$or":
            temp.field = columnName;
            temp.method = methodName;
            temp.value = queryParamMap.getAll(columnName + "_value");
            break;
          default:
            temp.field = columnName;
            temp.method = queryParamMap.get(columnName + "_method");
            temp.value = queryParamMap.get(columnName + "_value");
            break;
        }
        conditions.push(temp);
      })
    }

    return conditions;
  }

  constructor(filter?: UserFilterModel) {
    if (filter) {
      properties.forEach(property => {
        if (filter[property]) {
          this[property] = filter[property];
        }
      });
    }
  }

  // async _init(): Promise<UserFilterModel> {
  //   let query: any;
  //   if (this._id) {
  //     query = {
  //       _id: this._id
  //     }
  //   } else if (this.url) {
  //     query = {
  //       url: this.url,
  //       isDefault: true,
  //       tenantId: Session.get('tenantId')
  //     }
  //   }
  //
  //   const resultFilter = await MeteorObservable.call('findOne', 'userFilters', query).toPromise();
  //   let returnFilter:UserFilterModel;
  //   if (resultFilter) {
  //     let filter:UserFilterModel = {
  //       _id: ""
  //     };
  //     this._id = resultFilter['_id'];
  //     properties.forEach(property => {
  //       if (resultFilter[property]) {
  //         this[property] = resultFilter[property];
  //         filter[property] = resultFilter[property];
  //       }
  //     });
  //     returnFilter = filter;
  //   }
  //   return returnFilter;
  // }

  _getQueryParams(): Object {

    let queryParams:any = {};
    if (this._id) {
      queryParams.filterId = this._id;
    } else if(this.name) {
      queryParams.filterName = this.name;
    }

    if (this.conditions.length > 0) {
      queryParams.columns = [];
      this.conditions.forEach(condition => {
        let columnName = condition.column;
        let methodName = '';
        if (condition.method) {
          methodName = condition.method
        } else {
          methodName = condition.method
        }
        queryParams[columnName + "_method"] = methodName;
        queryParams[columnName + "_value"] = condition.value;
        queryParams[columnName + "_type"] = condition.type;
        queryParams.columns.push(columnName);
      });
    }

    return queryParams;
  }

  loadProvidedMethods(dataType) {
    this.conditions.forEach(condition => {
      condition.methods = Methods[dataType];
    })
  }

  _buildConditionsByQueryParamsMap(queryParamsMap) {

  }

  buildConditionsByParams(params) {
    this.conditions = [];
    let columnNames = [];

    if ('columns' in params) {
      columnNames = funcs.convertToArrayIfIsString(params['columns']);
    }

    columnNames.forEach(columnName => {
      let method = params[columnName + "_method"];
      let value = params[columnName + "_value"];
      if (method == '$or') {
        value = funcs.convertToArrayIfIsString(value);
      }
      let findColumn = this.columns.find(_column => _column.prop == columnName);
      let condition: Condition = {
        column: columnName,
        name: findColumn.name,
        type: findColumn.type,
        method,
        value,
        methods: Methods[findColumn.type]
      };
      this.conditions.push(condition);
    })
  }

  _generateConditions() {

  }

  addCondition(condition: Condition) {
    let newCondition = {
      column: condition.column
    }
  }

  _update$(): Observable<any> {
    let update = {
      $set: {
        name: this.name,
        lookupName: this.lookupName,
        conditions: this.conditions
      }
    };

    return MeteorObservable.call('update', 'userFilters', {_id: this._id}, update, {});
  }

  _insert$(): Observable<any> {
    let filter: UserFilterModel = {
      name: this.name,
      lookupName: this.lookupName,
      conditions: this.conditions,
      createdUserId: this.createdUserId,
      createdAt: new Date(),
      tenantId: Session.get('tenantId'),
      url: this.url
    };

    return MeteorObservable.call('insert', 'userFilters', filter, {});
  }

  _delete$(): Observable<any> {
    let query = {
      _id: this._id
    }

    return MeteorObservable.call('remove', 'userFilters', query, this._id);
  }

  setParams(params) {
    this.params = params;
    this.buildConditionsByParams(params);
  }

  updateCondition(condition) {

  }

  addNewCondition(condition) {

  }

  _saveConditions$() : Observable<boolean> {
    let query = {
      _id: this._id
    }
    let update = {
      $set: {
        conditions: this.conditions
      }
    }
    return MeteorObservable.call('update', 'userFilters', query, update);
  }

  _getUserFilterModel() {
    let obj:any = {}
    properties.forEach(_property => {
      if (this[_property]) {
        Object.assign(obj, {[_property]: this[_property]});
      }
    })
    return obj;
  }

  _save$() {
    if (this._id) {
      // this is a save
      let query = {
        _id: this._id
      };

      let doc:UserFilterModel = this._getUserFilterModel();
      doc.createdAt = new Date();
      doc.tenantId = Session.get('tenantId');
      doc.createdUserId = Meteor.userId();

      return MeteorObservable.call('update', 'userFilters', query, doc);
    } else {
      // this is an insert

      // return this._insert();
    }

    // let doc = {_id: this._id};
    // return MeteorObservable.call('save', 'userFilters', doc);
  }
}