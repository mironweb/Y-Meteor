// has default, belongs to tenantId
import * as funcs from '../functions/common';
import {MeteorObservable} from "meteor-rxjs";
import {callbackToPromise} from "../functions/common";
import {Observable} from "rxjs/Observable";
import {of} from "rxjs/observable/of";
import {concatMap, defaultIfEmpty, filter, map, startWith, switchMap, tap} from "rxjs/operators";
import {isEmptyObject} from "../functions/common";
import {getUserGroupId} from "../functions/common";
import moment = require("moment");
import {OperatorFunction} from "rxjs";

const properties = [
  "_id",
  "name",
  "label",
  "category",
  "searchable",
  "subscriptions",
  "methods",
  "dataTable",
  "tenantId",
  "removed",
  "createdUserId",
  "createdAt",
  "totalLogic",
  "extraStages"
];
export interface SystemLookupModel {
  _id: string;
  name?: string;
  label?: string; // this is used by the dialog-system-lookup
  category: string;
  searchable?: boolean;
  subscriptions?: Subscription[];
  methods?: Method[];
  dataTable?: DataTable;
  tenantId: string;
  removed?: boolean;
  createdUserId?: string;
  createdAt?: Date;
  totalLogic?: {};
}

interface Subscription {
  name: string;
  args: Argument[] // argument can be a query object, options object, etc.
}

interface Argument {
  name: string;
  value: any; // value can be an object or an array
  params: string[]
}

interface Method {
  isHeader?: boolean; // isHeader is used to deal with multi aggregate or find, when isHeader is false, it means that it is called by another method
  name: string;
  collectionName: string;
  args: Argument[];
  return: Return;
  fieldName: string;
  log: string;
  type: string;
}

interface Return {
  // used for returned data when a item is clicked
  returnable: boolean;
  data: string[]; // used to defined what data to be returned when selected

  // used for multi aggregate or find
  next: boolean; // determine if there is next method to be called
  nextMethodIndex: Number; // the index of the method to be called next
  dataType: string; // this could be 'object', 'array'
  as: string; // name of the data to returned
}

export interface DataTable {
  options: any; // options for table
  columns: Column[]; // options for columns
  expandedColumns: Expand[]; // options for columns
  rows: any; // options for rows
}

interface Options {
  limit: number;
  sort: object; // similar to the sort in mongodb
}

export interface Column {
  prop: string;
  name: string;
  type: string;
  methodName?: string;
  emitMethodName?: string;
  cellTemplate: string;
}

export interface Expand {
  prop: string;
  name: string;
  type: string;
  methodName?: string;
  emitMethodName?: string;
  cellTemplate: string;
}

export class SystemLookup implements SystemLookupModel {

  static _GetReferredLookup$(user, lookupName) : Observable<SystemLookupModel> {
    let originLookup : SystemLookupModel;
    return MeteorObservable.call('findOne', 'systemLookups', { name: lookupName })
      .pipe(
        // if lookup exists in database, try to find the referred id
        switchMap((lookup: SystemLookupModel) => {
          if (lookup) {
            originLookup = lookup;
            return SystemLookup._getReferredLookupId$(user, lookup._id)
          } else {
            return null;
          }
        }),
        // if referred id exists, try to get the lookup, otherwise , return the origin lookup
        switchMap(lookupId => {
          if (lookupId) {
            return SystemLookup._FindLookupByQuery$({_id: lookupId});
          } else {
            return of(originLookup);
          }
        })
      )
  }

  static async _getReferredLookupId(user, lookupName): Promise<string> {

    const lookup:any = await callbackToPromise(MeteorObservable.call('findOne', 'systemLookups', { name: lookupName }));
    let referredId:any = await SystemLookup._getReferredLookupId$(user, lookup._id).toPromise().catch(error => console.log(error));

    if (!referredId) {
      referredId = lookup._id;
    }
    return referredId;
  }

  static _getReferredLookupId$(user, lookupId) : Observable<string> {
    const observe1 = SystemLookup._getReferredLookupIdByUser(user, lookupId);
    const observe2 = SystemLookup._getReferredLookupIdByUserGroup(user, lookupId);

    return observe1.pipe(
      switchMap((result) => {
        return result ? of(result) : observe2
      })
    );
  }


  static _getReferredLookupIdByUser(user, lookupId) : Observable<string> {

    return of(user).pipe(
      filter((user)=> ('tenants' in user)),
      map((user) => user.tenants.find(tenant => tenant._id == Session.get('tenantId'))),
      filter((tenant) => !isEmptyObject(tenant) && 'lookups' in tenant),
      map((tenant) => tenant.lookups.find(lookup => lookup.from == lookupId)),
      filter(lookup => !isEmptyObject(lookup)),
      map(lookup => lookup.from),
      defaultIfEmpty(undefined)
    );
  }

  static _getReferredLookupIdByUserGroup(user, lookupId) : Observable<string> {
    return MeteorObservable.call('findOne', 'userGroups', {_id: getUserGroupId(user)})
      .pipe(
        filter(val => 'lookups' in val),
        map((val:any) => val.lookups.find(lookup => lookup['from'] == lookupId)),
        filter(lookup => !isEmptyObject(lookup) && 'to' in lookup),
        map(val => val['to']),
        defaultIfEmpty(undefined)
      )
  }

  static _FindLookupByQuery$(query) : Observable<SystemLookupModel> {
    return MeteorObservable.call('findOne', 'systemLookups', query);
  }

  _id: string;
  name: string;
  label: string; // this is used by the dialog-system-lookup
  category: string;
  searchable?: boolean;
  subscriptions?: Subscription[];
  methods: Method[];
  dataTable: DataTable;
  tenantId: string;
  removed?: boolean;
  createdUserId?: string;
  createdAt?: Date;
  objLocal: any;
  keywords: string;
  displayedColumns: string[] = [];
  params: any;
  defaultSort: any;
  defaultPageSize: any;
  sort: {}[];
  urlPageSize: number;
  pageIndex: number;
  pageSkip: number;
  pageSize: number = 25;
  isModal: boolean;
  columns: {}[];
  quickFilters: {}[];
  lastMethodArgs: {}[];
  totalLogic: {}[];
  externalStages = [];
  extraStages = [];

  constructor(lookupModel: SystemLookupModel) {
    Object.keys(lookupModel).forEach(_key => {
      this[_key] = lookupModel[_key];
    })
    // properties.forEach(property => {
    //   if (lookupModel[property]) {
    //     this[property] = lookupModel[property];
    //   }
    // });
    // set columns
    this.setColumns();

    // set default page size
    this.setDefaultPageSize();
    // set page index


  }

  async init(objLocal, params?) {
    this.objLocal = objLocal;
    if(params) {
      this.params = params;
    }
    // let query = {};
    // if (this._id) {
    //   query = {
    //     _id: this._id
    //   }
    // } else if (this.name) {
    //   query = {
    //     name: this.name
    //   }
    // }

    // let resultLookup = await MeteorObservable.call('findOne', 'systemLookups', query).toPromise();
    // if (resultLookup) {
    //   properties.forEach(property => {
    //     if (resultLookup[property]) {
    //       this[property] = resultLookup[property];
    //     }
    //   });
    // }

    // // set columns
    // this.setColumns();
    //
    // // set default page size
    // this.setDefaultPageSize();
    // // set page index
  }

  setPageIndex() {
    if (this.params && 'pageIndex' in this.params) {
      this.pageIndex = this.params['pageIndex'];
      if (this.pageIndex > 0) {
        this.pageSkip = this.pageSize * this.pageIndex;
      }
    }
  }

  setSort() {
    if (this.params && 'sort' in this.params){
      let sortArr = funcs.convertToArrayIfIsString(this.params.sort);
      let sort = [];
      sortArr.forEach(str => {
        let arr = str.split('.');
        sort.push({
          active: arr[0],
          direction: Number(arr[1])
        })
      })

      this.sort = sort;
    } else {
      this.sort = undefined;
    }
  }

  setPageSize() {
    if (this.defaultPageSize) {
      this.pageSize = this.defaultPageSize;
    }

    if (this.params && 'pageSize' in this.params) {
      this.pageSize = this.params['pageSize'];
      if (this.pageIndex > 0) {
        this.pageSkip = this.pageSize * this.pageIndex;
      }
    }


  }

  setColumns() {
    if (this.dataTable && 'columns' in this.dataTable) {
      this.columns = this.dataTable.columns;
      this.displayedColumns = [];
      this.columns.forEach((column:any) => {
        if (column.hidden == false) {
          this.displayedColumns.push(column.prop);
        }
      });
    }
  }

  setQuickFilters() {
    if ('quickColumns' in this.params) {
      let quickColumns = funcs.convertToArrayIfIsString(this.params.quickColumns);
      let quickValues = funcs.convertToArrayIfIsString(this.params.quickValues);

      let arr = [];
      this.quickFilters = [];
      quickColumns.forEach((columnName, index) => {
        let columnIndex = arr.findIndex(_value => columnName == _value);
        let findColumn:any = this.columns.find((_column:any) => _column.prop == columnName);

        if (columnIndex == -1) {
          this.quickFilters.push({
            prop: findColumn.prop,
            value: quickValues[index],
            label: findColumn.name + ":" + quickValues[index]
          })
          arr.push({
            columnName: quickValues[index]
          })
        }
      })
    }
  }

  setDefaultSort() {
    if (this.dataTable && 'sort' in this.dataTable.options) {
      let sort = Object.assign({}, this.dataTable.options.sort);
      if ('conditions' in this.dataTable.options.sort) {
        let conditions = this.dataTable.options.sort.conditions;
        conditions.forEach(condition => {

          if (funcs.getObjectValue(this.objLocal, condition.case) == condition.value) {
            sort.active = condition.active;
            sort.direction = condition.direction;
          }
        })
      }

      this.defaultSort = sort;
    } else {
    }
  }

  setDefaultPageSize() {
    let defaultPageSize = 25;
    if (this.dataTable && 'options' in this.dataTable) {
      if ('pageSize' in this.dataTable.options) {
        defaultPageSize = this.dataTable.options.pageSize;
      }
    }
    this.defaultPageSize = defaultPageSize;
  }

  _getColumns() {
    let columns = [];
    if ('columns' in this.dataTable) {
      columns = this.dataTable.columns;
    }
    return columns;
  }

  hasNextMethod(method) {
    if (method && 'return' in method && 'nextMethodIndex' in method.return)
      return true;
    else
      return false;
  }

  _calculateTotal$() {
    let returnResult:any;
    let aggregateMethods = this.methods.filter((method:any) => method.type == 'aggregate');
    let arr = [];
    let result = of(null);

    aggregateMethods.forEach(method => {
      let isLastMethod = false;
      if (!this.hasNextMethod(method)) {
        // no next method
        isLastMethod = true;
      }

      arr.push(concatMap(() => this._runAggregateMethod$(method)));
      arr.push(tap(res => {
        if (res) {
          if (isLastMethod) {
            returnResult = res;
          } else {
            if (method.return.dataType == 'object') {
              this.objLocal[method.return.as] = res[0]? res[0] : [];
            } else if(method.return.dataType == 'array') {
              this.objLocal[method.return.as] = res? res : [];
            } else {
              this.objLocal[method.return.as] = res;
            }
          }
        }
      }))

      if (isLastMethod) {
        arr.push(
          concatMap(() => this._runTotalAggregateMethod$(method))
        )
      }
    });

    if (arr.length > 0) {
      return result.pipe(
        ...arr
      )
    } else {
      return result;
    }

  }

  async _calculateTotal() {
    let returnResult:any;
    let aggregateMethods = this.methods.filter((method:any) => method.type == 'aggregate');

    let index = 0;
    while(index < aggregateMethods.length) {

      let method = aggregateMethods[index];
      let isLastMethod = false;
      if (!this.hasNextMethod(method)) {
        // no next method
        isLastMethod = true;
      }

      let aggregateResult = await this.runTotalAggregateMethod(aggregateMethods[index]).catch(error => console.log(error));

      if (aggregateResult) {
        if (isLastMethod) {
          returnResult = aggregateResult;
        } else {
          // if not the last method, assign data to the objLocal
          this.objLocal[method.return.as] = aggregateResult[0];
        }
      }
      index ++;
    }

    if (returnResult && returnResult.length == 1) {
      return returnResult[0];
    } else {
      return null;
    }
  }

  _getAggregateResultCount$() {
    let aggregateMethods = this.methods.filter((method:any) => method.type == 'aggregate');

    let lastMethod = aggregateMethods[aggregateMethods.length -1];

    return MeteorObservable.call('getAggregateResultCount', lastMethod.collectionName, this.lastMethodArgs[0]);

  }

  _getAggregateResult$() {
    let returnResult:any;

    let aggregateMethods = this.methods.filter((method:any) => method.type == 'aggregate');

    let arr = [];

    let result = of('start aggregate');
    aggregateMethods.forEach(method => {
      let isLastMethod = false;
      if (!this.hasNextMethod(method)) {
        // no next method
        isLastMethod = true;
      }

      arr.push(concatMap(() => this._runAggregateMethod$(method)));
      arr.push(tap(res => {
        if (res) {
          if (isLastMethod) {
            returnResult = res;
          } else {
            if (method.return.dataType == 'object') {
              this.objLocal[method.return.as] = res[0]? res[0] : [];
            } else if(method.return.dataType == 'array') {
              this.objLocal[method.return.as] = res? res : [];
            } else {
              this.objLocal[method.return.as] = res;
            }
          }
        }
      }))
    });

    if (arr.length > 0) {
      return result.pipe(
        ...arr
      )
    } else {
      return result;
    }
  }

  async _getAggregateResult() {
    let returnResult:any;

    let aggregateMethods = this.methods.filter((method:any) => method.type == 'aggregate');

    let index = 0;
    // console.log('timestart', new Date());
    let arr = [];

    let obser = of('start aggregate');
    aggregateMethods.forEach(method => {
      let isLastMethod = false;
      if (!this.hasNextMethod(method)) {
        // no next method
        isLastMethod = true;
      }

      arr.push(this._runAggregateMethod$(method));
    });

    return returnResult;
  }

  runObservable() {

  }

  _getMethodArgs(method) {
    let methodArgs = [];
    methodArgs = funcs.parseAll(method.args, this.objLocal);
    if ('datePaths' in method.args[0]) {
      method.args[0].datePaths.forEach(datePath => {
        funcs.setObjectValue(methodArgs[0], datePath, new Date(funcs.getObjectValue(methodArgs[0], datePath)));
      })
    }
    return methodArgs;
  }

  async _runAggregateMethod(method) {
    let methodArgs = this._getMethodArgs(method);
    let isLastMethod = false;
    if (!this.hasNextMethod(method)) {
      // no next method
      let stages = await this._generateStages$(false).toPromise();
      methodArgs[0] = [...methodArgs[0], ...stages];
      isLastMethod = true;
      this.lastMethodArgs = methodArgs;
    }

    // DEBUGGER
    // console.log(this.objLocal);
    // console.log(this.name, method.collectionName, JSON.stringify(methodArgs));
    let res:any;
    if (isLastMethod) {
      // res = await funcs.callbackToPromise(MeteorObservable.call('aggregate', method.collectionName, ...methodArgs));
      res = await funcs.callbackToPromise(MeteorObservable.call('runAggregate', method.collectionName, ...methodArgs));
    } else {
      res = await funcs.callbackToPromise(MeteorObservable.call('runAggregate', method.collectionName, ...methodArgs));
    }
    return res;
  }

  _runAggregateMethod$(method) : Observable<any> {
    let methodArgs = this._getMethodArgs(method);
    let isLastMethod = false;

    return of('start')
      .pipe(
        switchMap(() => {
          if (!this.hasNextMethod(method)) {
            // no next method

            return this._generateStages$(false)
              .pipe(
                tap((stages) => {
                  // methodArgs[0].pop();
                  methodArgs[0] = [...methodArgs[0], ...stages];
                  isLastMethod = true;
                  this.lastMethodArgs = methodArgs;
                })
              )
          } else {
            return of([]);
          }
        }),
        switchMap(() => {
          // console.log(this.name, this._id, method.collectionName, JSON.stringify(methodArgs));
          // console.log('this.', this.objLocal);

          if (isLastMethod) {
            // return MeteorObservable.call('aggregate', method.collectionName, ...methodArgs);
            return MeteorObservable.call('runAggregate', method.collectionName, ...methodArgs);
          } else {
            return MeteorObservable.call('runAggregate', method.collectionName, ...methodArgs);
          }
        })
      )
  }

  async _runQueryAggregateMethod(method, groupByArray?) {
    groupByArray = groupByArray ? groupByArray : [];
    let methodArgs = this._getMethodArgs(method);
    if (!this.hasNextMethod(method)) {
      // no next method
      let stages = this._getQueryStages();
      methodArgs[0] = [...methodArgs[0], ...stages];
    }

    // DEBUGGER
    // console.log(this.name, method.collectionName, JSON.stringify(methodArgs));
    let returnResult:any = await funcs.callbackToPromise(MeteorObservable.call('runAggregate', method.collectionName, ...methodArgs));
    return returnResult;
  }

  async _countQueryAggregateMethod$(method) {
    let methodArgs = this._getMethodArgs(method);
    if (!this.hasNextMethod(method)) {
      // no next method
      let stages = this._getQueryStages();
      stages.push({
        $count: "count"
      })
      methodArgs[0] = [...methodArgs[0], ...stages];
    }

    // DEBUGGER
    // console.log(this.name, method.collectionName, JSON.stringify(methodArgs));
    return await funcs.callbackToPromise(MeteorObservable.call('runAggregate', method.collectionName, ...methodArgs));
  }

  _getQueryAggregateMethodCount$() {
    let returnResult:any;

    let aggregateMethods = this.methods.filter((method:any) => method.type == 'aggregate');

    let arr = [];

    let result = of('start aggregate');
    aggregateMethods.forEach(method => {
      let isLastMethod = false;
      if (!this.hasNextMethod(method)) {
        // no next method
        isLastMethod = true;
      }

      arr.push(concatMap(() => this._countQueryAggregateMethod$(method)));
      arr.push(tap(res => {
        if (res) {
          if (isLastMethod) {
            returnResult = res;
          } else {
            if (method.return.dataType == 'object') {
              this.objLocal[method.return.as] = res[0]? res[0] : [];
            } else if(method.return.dataType == 'array') {
              this.objLocal[method.return.as] = res? res : [];
            } else {
              this.objLocal[method.return.as] = res;
            }
          }
        }
      }))
    });

    if (arr.length > 0) {
      return result.pipe(
        ...arr
      )
    } else {
      return result;
    }
  }

  _runTotalAggregateMethod$(method) {
    let methodArgs = this._getMethodArgs(method);
    if (!this.hasNextMethod(method)) {
      // no next method
      return this._generateStages$(true)
        .pipe(
          tap(stages => {
            methodArgs[0] = [...methodArgs[0], ...stages];

          }),
          switchMap(() => {
            return MeteorObservable.call('runAggregate', method.collectionName, ...methodArgs);
          })
        )
    } else {
      return of(null);
    }
  }

  async runTotalAggregateMethod(method) {
    let methodArgs = this._getMethodArgs(method);
    if (!this.hasNextMethod(method)) {
      // no next method
      let stages = await this._generateStages$(true).toPromise();
      methodArgs[0] = [...methodArgs[0], ...stages];
    }

    // DEBUGGER
    // console.log(this.name, method.collectionName, JSON.stringify(methodArgs));
    return  await MeteorObservable.call('runAggregate', method.collectionName, ...methodArgs).toPromise();
  }

  getQueryOptions(method, methodArgs) {
    if ('return' in method) {
      if (this.hasNextMethod(method)) {

      } else {
        if (!funcs.isEmptyObject(this.sort)) {
          methodArgs[0].push(this.sort);
        }
        if (this.pageSkip > 0) {
          methodArgs[0].push({
            "$skip": this.pageSkip
          })
        }

        if (this.pageSize > 0) {
          methodArgs[0].push({
            "$limit": this.pageSize
          })
        }
      }
    } else {
      // if (!funcs.isEmptyObject(this.aggregateSortOption)) {
      //   methodArgs[0].push(this.aggregateSortOption);
      // }
      //
      // if (this.skip > 0) {
      //   methodArgs[0].push({
      //     "$skip": this.skip
      //   });
      // }
      // if (this.pageSize > 0) {
      //   methodArgs[0].push({
      //     "$limit": this.pageSize
      //   });
      // }
    }
    return methodArgs;
  }

  setParams(queryParams) {
    this.params = queryParams;
    if (queryParams && 'columns' in queryParams) {
      this.params.columns = funcs.convertToArrayIfIsString(this.params.columns);
    }

    if ('keywords' in queryParams) {
      this.keywords = queryParams.keywords;
    }

    if (this.isModal) {
      this.objLocal.params = this.params;
    } else {
      this.objLocal.url = this.params;
    }
    // set page index
    this.setPageIndex();

    // set page size
    this.setPageSize();

    // set default sort
    this.setDefaultSort();

    // set default sort
    this.setQuickFilters();

    // set url sort
    if (this.isModal) {

    } else {
      this.setSort();
    }
  }

  async _getQueryAggregateResult(groupByArray?) {
    let returnResult:any;

    let aggregateMethods = this.methods.filter((method:any) => method.type == 'aggregate');
    
    let index = 0;
    while(index < aggregateMethods.length) {

      let method = aggregateMethods[index];
      let isLastMethod = false;
      if (!this.hasNextMethod(method)) {
        // no next method
        isLastMethod = true;
      }
      let aggregateResult = await this._runQueryAggregateMethod(aggregateMethods[index], groupByArray).catch(error => console.log(error));

      if (aggregateResult) {
        if (isLastMethod) {
          returnResult = aggregateResult;
        } else {
          // if not the last method, assign data to the objLocal
          if (method.return.dataType == 'object') {
            this.objLocal[method.return.as] = aggregateResult[0];
          } else {
            this.objLocal[method.return.as] = aggregateResult;
          }
        }
      }
      index ++;
    }

    return returnResult;
  }

  _getQueryStages() {
    let stages = [];
    const matchStage = this._generateMatchStage();
    const quickFiltersStage = this._generateQuickFiltersStage();
    const keywordsStage = this._generateKeywordsStage();
    const sortStage = this._generateSortStage();

    if (quickFiltersStage)
      stages.push(quickFiltersStage);
    if (matchStage)
      stages.push(matchStage);
    if (sortStage)
      stages.push(sortStage);
    if (keywordsStage) {
      stages.push(keywordsStage);
    }

    if (this.externalStages.length > 0) {
      this.externalStages.forEach(_stage => stages.push(_stage));
    }

    return stages;
  }

  _generateStages$(includeTotalStage) {
    let stages = [];
    const totalLogicStages = this._generatetotalLogicStages();

    const sortStage = this._generateSortStage();
    const skipStage = this._generatePageSkipStage();
    const limitStage = this._generatePageSizeStage();

    return of([])
      .pipe(
        tap(() => {
          const matchStage = this._generateMatchStage();
          const quickFiltersStage = this._generateQuickFiltersStage();
          const keywordsStage = this._generateKeywordsStage();

          if (quickFiltersStage)
            stages.push(quickFiltersStage);

          if (matchStage)
            stages.push(matchStage);
          if (keywordsStage) {
            stages.push(keywordsStage);
          }

        }),
        switchMap(() => {
          if (this.extraStages.length > 0) {
            let query = {_id: {$in: this.extraStages}};

            return MeteorObservable.call('find', 'systemLookups', query);
          } else {
            return of([]);
          }
        }),
        tap((res:any) => {
          let extraStages = [];
          res.forEach(_lookup => {
            _lookup.methods.forEach(_method => {
              let methodArgs = funcs.parseAll(_method.args, this.objLocal);
              extraStages.push(...methodArgs[0]);
            })
          })
          if (extraStages.length > 0) {
            stages.push(...extraStages);
          }

        }),
        map(() => {
          if (this.externalStages.length > 0) {
            stages.push(...this.externalStages);
            // this.externalStages.forEach(_stage => stages.push(_stage));
          }

          if (includeTotalStage) {
            if (totalLogicStages && totalLogicStages.length > 0) {
              stages.push(...totalLogicStages);
              // totalLogicStages.forEach(stage => stages.push(stage))
            }
          } else {
            if (sortStage)
              stages.push(sortStage);
            if (skipStage)
              stages.push(skipStage);
            if (limitStage)
              stages.push(limitStage);
          }

          return stages;
        })
      )
  }

  _generatePageSizeStage() {
    return {
      $limit: Number(this.pageSize)
    }
  }

  _generatePageSkipStage() {
    if (this.pageIndex && this.pageIndex > 0) {
      return {
        $skip: Number(this.pageSize * this.pageIndex)
      }
    } else {
      return null;
    }
  }

  _generatetotalLogicStages() {
    if (this.totalLogic) {
      return funcs.parseAll(this.totalLogic, this.objLocal)[0];
    } else {
      return null;
    }
  }

  _generateSortStage() {
    let sortStage = {
      $sort: {}
    };
    let sort = sortStage.$sort;
    if (this.sort && this.sort.length > 0) {
      this.sort = funcs.convertToArrayIfIsString(this.sort);
      this.sort.forEach((sortData: any) => {
        Object.assign(sort, {
          [sortData.active]: Number(sortData.direction)
        })
      })
      return sortStage;
    } else if (this.defaultSort) {

      if ('active' in this.defaultSort) {
        sortStage.$sort = {
          [this.defaultSort.active]: this.defaultSort.direction
        };
      } else {
        sortStage.$sort = this.defaultSort;
      }
      return sortStage;
    } else {
      return null;
    }
  }

  _generateKeywordsStage() {
    let keywordsStage;
    keywordsStage = { $match: { $and: [] } };

    if (this.keywords) {
      let stage = funcs.generateRegexWithKeywords(this.displayedColumns, this.keywords);
      keywordsStage.$match = stage;
      return keywordsStage;
    } else {
      return null;
    }
  }

  _generateQuickFiltersStage() {
    let quickFiltersStage = {
      $match: {}
    }


    if (this.params && this.quickFilters) {
      this.quickFilters.forEach((quickFilter:any) => {
        Object.assign(quickFiltersStage.$match, {
          [quickFilter.prop]: {
            $regex: quickFilter.value,
            $options: 'i'
          }
        });
      })
      return quickFiltersStage;
    } else {
      return null
    }
  }

  _generateMatchStage() {
    let and, matchStage;

    matchStage = { $match: { $and: [] } };
    and = matchStage.$match.$and;

    if (this.params && 'columns' in this.params) {
      this.params.columns = funcs.convertToArrayIfIsString(this.params.columns);

      this.params.columns.forEach(columnName => {
        let findColumn = this._getColumns().find(column => column.prop == columnName);
        let method = this.params[columnName + "_method"];
        let value = this.params[columnName + "_value"];
        let type = this.params[columnName + "_type"];
        switch (type) {
          case 'number':
            value = parseFloat(value);
            break;
        
          default:
            value = value;
            break;
        }
        
        generatePipeline({method, value, type: findColumn.type, columnName: columnName}, and);
      })
      return matchStage;
    } else {
      return null;
    }
  }

  update(method) {
    let methodArgs = [];
    methodArgs = funcs.parseAll(method.args, this.objLocal);
    MeteorObservable.call('update', method.collectionName, ...methodArgs)
      .subscribe();
  }
}



export function generatePipeline(condition, and) {
  switch (condition.method) {
    case 'today':
      const today = new Date();
      const startOfToday = moment().startOf('day').toDate();
      const endOfToday = moment().endOf('day').toDate();
      condition.value = [
        startOfToday,
        endOfToday
      ];

      and.push({
        [condition.columnName]: {
          $gt: condition.value[0],
          $lt: condition.value[1]
        }
      });

      break;
    case 'thisMonth':
      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      lastDay = moment(lastDay).hour(23).minutes(59).seconds(59).toDate();
      condition.value = [
        firstDay,
        lastDay
      ];

      and.push({
        [condition.columnName]: {
          $gt: condition.value[0],
          $lt: condition.value[1]
        }
      })
      break;
    case '<>':
      if (condition.type == 'date') {
        and.push({
          [condition.columnName]: {
            $gte: new Date(condition.value[0]),
            $lt: new Date(condition.value[1])
          }
        });
      } else{
        condition.value = condition.value.split(',');

        and.push({
          [condition.columnName]: {
            $gte: condition.value[0],
            $lt: condition.value[1]
          }
        });
      }
      return;
    case "$gte":
      if (condition.type == 'date') {
        condition.value = new Date(condition.value)
      } else if (condition.type == 'number') {
        condition.value = Number(condition.value);
      }
      and.push({
        [condition.columnName]: {
          $gte: condition.value
        }
      });
      return;
    case "$lt":
      if (condition.type == 'date') {
        condition.value = new Date(condition.value);
      } else if (condition.type == 'number') {
        condition.value = Number(condition.value);
      }
      and.push({
        [condition.columnName]: {
          $lt: condition.value
        }
      });
      return;
    case 'like':
      and.push({
        [condition.columnName]: {
          $regex: condition.value,
          $options: 'i'
        }
      });
      return;
    case "$or":
    case "$in":
      if (typeof condition.value == 'string') {
        and.push({
          [condition.columnName]:{$in: [condition.value]}
        });
      } else {
        and.push({
          [condition.columnName]:{$in: condition.value}
        });
      }

      return;
    case '$eq':
      if (condition.type == 'date') {
        let equalDate =  new Date(condition.value);
        and.push({
          [condition.columnName]: {
            $gte: new Date(condition.value),
          }
        });
        equalDate.setDate(equalDate.getDate() + 1);
        and.push({
          [condition.columnName]: {
            $lt: equalDate,
          }
        });
      } else if (condition.type == 'number') {
        condition.value = Number(condition.value);
        and.push({
          [condition.columnName]:{$eq: condition.value}
        });

      } else {
        and.push({
          [condition.columnName]:{$eq: condition.value}
        });
      }

      return;
    case '$ne':
      if (condition.type == 'date') {
        let equalDate =  new Date(condition.value);
        let plus = new Date(condition.value);
        plus.setDate(plus.getDate() + 1);
        let not = {};
        and.push({
          $or: [
            {
              [condition.columnName]: {
                $lt: equalDate
              }
            },
            {
              [condition.columnName]: {
                $gt: plus,
              }
            }
          ]
        });
      } else {
        and.push({
          [condition.columnName]:{$ne: condition.value}
        });
      }

      return;
    case '$not':
      and.push({
        [condition.columnName]:{$not: new RegExp(condition.value, 'i')}
      });
      return;
    case "$regex":
      and.push({
        [condition.columnName]:{
          $regex: condition.value,
          $options: 'i'
        }
      });
      return;
    default:
      return;
  }
}

