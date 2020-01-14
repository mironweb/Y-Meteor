/*
* exported functions with _ before each function name must return something
* */
import {MeteorObservable} from "meteor-rxjs";
import * as moment from 'moment-timezone';
import {SystemTenants} from "../collections/systemTenants.collection";
import { Logo } from './image';
import * as _ from "underscore";
import {Observable} from "rxjs/Observable";
import {tap, map, filter, single, catchError, first, defaultIfEmpty, merge, switchMap} from "rxjs/operators";
import {_throw} from "rxjs/observable/throw";
import {of} from "rxjs/observable/of";
import {forkJoin} from "rxjs/observable/forkJoin";
import { jsonize } from '@ngui/map/dist/services/util';
import {Action} from "../models/systemLog.model";
import {Random} from "meteor/random";
import { Session } from 'meteor/session';

export function generateRegexWithKeywords(fields: any, keywords) {
  let obj = {
    $and: []
  };

  let arr = keywords.split(" ");
  arr.forEach(keyword => {
    if (keyword.trim() !== '') {

      let temp = {
        $or: []
      };

      // find and aggregate
      fields.forEach((field) => {
        temp.$or.push({
          [field]: {$regex: keyword.trim(), $options: 'i'}
        })
      });

      obj.$and.push(temp);
    }
  });

  return obj;
}

export function isEmptyObject(obj) {
  if (obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  } else {
    return true;
  }
}

export function isEmptyString(str) {
  return (!str || 0 === str.length);
}


export function parseAll(args, objLocal) {
  return args.map((arg) => {
    arg = parseDollar(arg);
    arg = parseDot(arg);
    arg = parseParams(arg, objLocal);
    return arg.value;
  });
}

export function parseDollar(obj:any) {
  obj = JSON.stringify(obj);
  obj = obj.replace(/_\$/g, '$');
  obj = JSON.parse(obj);
  return obj;
}

export function parseDot(obj:any) {
  obj = JSON.stringify(obj);
  obj = obj.replace(/_DOT_/g, '.');
  obj = JSON.parse(obj);
  return obj;
}

function recursive(obj, objLocal, params, defaultParams) {
  if ( obj && typeof obj == 'object') {
    Object.keys(obj).forEach(_key => {
      if ( typeof obj[_key] == 'string') {
        if (obj[_key].includes('_VAR_')) {
          let findIndex = params.findIndex((_param, index) => "_VAR_" + index == obj[_key]);
          if (getObjectValue(objLocal, params[findIndex]) != undefined) {
            obj[_key] = getObjectValue(objLocal, params[findIndex]);
          } else {
            if (defaultParams) {
              obj[_key] = defaultParams[findIndex];
            } else {
              obj[_key] = [];
            }
          }
        }
      } else if (obj[_key] && typeof [obj[_key]] == 'object') {
        if (Array.isArray(obj[_key])) {
          obj[_key].forEach((_value, index) => {
            if (typeof _value == 'object') {
              recursive(_value, objLocal, params, defaultParams);
            } else if (typeof _value == 'string') {
              if (_value.includes('_VAR_')) {
                let findIndex = params.findIndex((_param, index) => "_VAR_" + index == _value);
                if (getObjectValue(objLocal, params[findIndex]) != undefined) {
                  obj[_key][index] = getObjectValue(objLocal, params[findIndex]);
                } else {
                  obj[_key][index] = [];
                }
              }
            }
          })
        } else {
          recursive(obj[_key], objLocal, params, defaultParams);
        }
      } else if (typeof [obj[_key]] == 'number') {

      } else {
      }
    })
  }
}

export function parseParams(arg:any, objLocal) {
  let objValue = arg.value;
  if (Array.isArray(objValue)) {
    objValue.forEach(_value => {
      recursive(_value, objLocal, arg.params, arg.defaultParams);
    });
  } else {
    recursive(objValue, objLocal, arg.params, arg.defaultParams);
  }
  return arg;
}

// export function parseParams(obj:any, objLocal:any={}) {
//   if (obj.name === 'options') {
//     if ('sort' in objLocal) {
//       obj.value.sort = objLocal.sort;
//     }
//   }
//   let copiedObj = Object.assign({}, obj);
//   obj = JSON.stringify(obj);
//
//   if ('params' in copiedObj) {
//     copiedObj.params.forEach((param, index) => {
//       if(param.indexOf('.') !== -1) {
//         let arrParam = param.split('.');
//         let copiedObjLocal = Object.assign({}, objLocal);
//         arrParam.forEach((param, i) => {
//           if (!copiedObjLocal) {
//             copiedObjLocal = [{}];
//           } else {
//             if (copiedObjLocal[param] || copiedObjLocal[param] == 0) {
//               copiedObjLocal = copiedObjLocal[param];
//             } else {
//               copiedObjLocal = '';
//             }
//           }
//
//           if (i == arrParam.length-1) {
//             if (typeof copiedObjLocal != 'string') {
//               copiedObjLocal = JSON.stringify(copiedObjLocal);
//               obj = obj.replace(new RegExp('"_VAR_' + index + '"', 'g'), copiedObjLocal);
//             } else {
//               obj = obj.replace(new RegExp('_VAR_' + index, 'g'), copiedObjLocal);
//             }
//           }
//         })
//       } else {
//         if (['boolean', 'number'].indexOf(typeof objLocal[param]) >= 0) {
//           // if it is a boolean or number
//           obj = obj.replace(new RegExp('"_VAR_' + index + '"', 'g'), objLocal[param]);
//         } else {
//           obj = obj.replace(new RegExp('_VAR_' + index, 'g'), objLocal[param]);
//         }
//       }
//     });
//   }
//
//   console.log('obj', obj);
//
//   return JSON.parse(obj);
// }

export function generatePipeline(condition, and) {
  switch (condition.method) {
    case '<>':
    case 'month':
      if (condition.field.includes('date') || condition.field.includes('Date')) {

        and.push({
          [condition.field]: {
            $gte: new Date(condition.value[0]),
            $lt: new Date(condition.value[1])
          }
        });
      } else{
        condition.value = condition.value.split(',');

        and.push({
          [condition.field]: {
            $gte: condition.value[0],
            $lt: condition.value[1]
          }
        });
      }
      return;
    case "$gte":
      if (condition.field.includes('date') || condition.field.includes('Date')) {
        condition.value = new Date(condition.value)
      }
      and.push({
        [condition.field]: {
          $gte: condition.value
        }
      });
      return;
    case "$lt":
      if (condition.field.includes('date') || condition.field.includes('Date')) {
        condition.value = new Date(condition.value);
      }
      and.push({
        [condition.field]: {
          $lt: condition.value
        }
      });
      return;
    case 'like':
      and.push({
        [condition.field]: {
          $regex: condition.value,
          $options: 'i'
        }
      });
      return;
    case "$or":
    case "$in":
      and.push({
        [condition.field]:{$in: [...condition.value]}
      });
      return;
    case '$eq':
      if (condition.field.includes('date') || condition.field.includes('Date')) {
        let equalDate =  new Date(condition.value);
        and.push({
          [condition.field]: {
            $gte: new Date(condition.value),
          }
        });
        equalDate.setDate(equalDate.getDate() + 1);
        and.push({
          [condition.field]: {
            $lt: equalDate,
          }
        });
      } else {
        and.push({
          [condition.field]:{$eq: condition.value}
        });
      }

      return;
    case '$ne':
      if (condition.field.includes('date') || condition.field.includes('Date')) {
        let equalDate =  new Date(condition.value);
        let plus = new Date(condition.value);
        plus.setDate(plus.getDate() + 1);
        let not = {};
        and.push({
          $or: [
            {
              [condition.field]: {
                $lt: equalDate
              }
            },
            {
              [condition.field]: {
                $gt: plus,
              }
            }
          ]
        });
      } else {
        and.push({
          [condition.field]:{$ne: condition.value}
        });
      }

      return;
    case '$not':
      and.push({
        [condition.field]:{$not: new RegExp(condition.value, 'i')}
      });
      return;
    case "$regex":
      and.push({
        [condition.field]:{
          $regex: condition.value,
          $options: 'i'
        }
      });
      return;
    default:
      return;
  }
}

export function Pipe(...ops) {
  const _pipe = (a, b) => (arg) => b(a(arg));
  return ops.reduce(_pipe);
}

export function _getReferredLookupIdByUser2(user, lookupId) : Observable<string> {

  return of(user).pipe(
    filter((user)=> ('tenants' in user)),
    map((user) => user.tenants.find(tenant => tenant._id == Session.get('tenantId'))),
    filter((tenant) => !isEmptyObject(tenant) && 'lookups' in tenant),
    map((tenant) => tenant.lookups.find(lookup => lookup._id == lookupId)),
    filter(lookup => !isEmptyObject(lookup)),
    map(lookup => lookup._id),
    defaultIfEmpty(undefined)
  );
}

export function _getReferredLookupIdByUserGroup(user, lookupId) : Observable<string> {
  return MeteorObservable.call('findOne', 'userGroups', {_id: getUserGroupId(user)})
    .pipe(
      filter(val => 'lookups' in val),
      map((val:any) => val.lookups.find(lookup => lookup['from'] == lookupId)),
      filter(lookup => !isEmptyObject(lookup) && 'to' in lookup),
      map(val => val['to']),
      defaultIfEmpty(undefined)
    )
}

export function _getReferredLookupId$(user, lookupId) : Observable<string> {
  const observe1 = _getReferredLookupIdByUser2(user, lookupId);
  const observe2 = _getReferredLookupIdByUserGroup(user, lookupId);

  return observe1.pipe(
    switchMap((result) => result ? of(result) : observe2)
  );
}

export async function getReferredLookupId(user, lookupName): Promise<string> {

  const lookup:any = await callbackToPromise(MeteorObservable.call('findOne', 'systemLookups', { name: lookupName }));
  let referredId:any = await _getReferredLookupId$(user, lookup._id).toPromise().catch(error => console.log(error));
  // let referredId = await getReferredLookupId$(user, lookup._id).toPromise();
  if (!referredId) {
    referredId = lookup._id;
  }
  return referredId;
}

export function getUserGroupId(user) {
  let groupId = '';
  let tenantIndex = user.tenants.findIndex((tenant: any) => tenant._id == Session.get('tenantId'));
  if ('defaultGroupId' in user.tenants[tenantIndex] && user.tenants[tenantIndex] != '') {
    groupId = user.tenants[tenantIndex].defaultGroupId;
    let index = user.tenants[tenantIndex].groups.findIndex((res) => res == groupId);
    if (index == -1) {
      groupId = '';
    }
  } else {
    groupId = user.tenants[tenantIndex].groups[0];
  }

  return groupId;
}

export function getParameterByName(name, url?) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export function callbackToPromise(method, ...args) {
  return new Promise(function(resolve, reject) {
    return method.subscribe((res, err) => {
      return err ? reject(err) : resolve(res);
    });
  }).catch(error => console.log('error', error));
}

export function toTimeZone(time, zone) {
  // if (!format) {
  //   format = 'YYYY/MM/DD HH:mm:ss ZZ';
  // }
  return moment(time).tz(zone);
}

export function setObjectValue(object, path, value) {
  let a = path.split('.');
  let o = object;
  for (let i = 0; i < a.length - 1; i++) {
    let n = a[i];
    if (o && n in o) {
      o = o[n];
    } else {
      o[n] = {};
      o = o[n];
    }
  }
  o[a[a.length - 1]] = value;
}

export function getObjectValue(object, path) {
  let o = object;
  path = path.replace(/\[(\w+)\]/g, '.$1');
  path = path.replace(/^\./, '');
  let a = path.split('.');
  while (a.length) {
    let n = a.shift();
    if (o && n in o) {
      o = o[n];
    } else {
      return;
    }
  }
  return o;
}



export function getTenantBySubdomain(subdomain) {
  return SystemTenants.collection.find({subdomain: subdomain});
}

export function getSubdomain() {
  return window.location.host.split('.')[0];
}

export function runAggregate(collection, pipeline) {
  return callbackToPromise(MeteorObservable.call('aggregate', collection, pipeline));
}

export function getUser(userId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'users', {_id: userId}, {fields: {services: 0}}));
}

export function getTenantById(tenantId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'systemTenants', {_id: tenantId}));
}

export function getCategorySales(year, categoryId) {
  return callbackToPromise(MeteorObservable.call('getCategorySales', year, categoryId));
}

export function getCustomerCategorySales(year, customerId, categoryId) {
  return callbackToPromise(MeteorObservable.call('getCustomerCategorySales', year, customerId, categoryId));
}

export function update(collectionName, query, update) {
  return callbackToPromise(MeteorObservable.call('update', collectionName, query, update));
}
export function updateWithOptions(collectionName, query, update, options?) {
  return callbackToPromise(MeteorObservable.call('updateRawCollection', collectionName, query, update, options));
}

export function findOne(collectionName, query, options?) {
  return callbackToPromise(MeteorObservable.call('findOne', collectionName, query, options));
}
export function find(collectionName, query, options?) {
  return callbackToPromise(MeteorObservable.call('find', collectionName, query, options));
}

export function getSystemLog() {
  return callbackToPromise(MeteorObservable.call('findOne', 'systemLogs', {sessionId: localStorage.getItem('sessionId')}, {fields: {sessionId: 1, createdUserId: 1}}));
}

export function generateLogFromAction(action) {
  let logMessage = 'Update ' + action.field + ' to ' + action.value + ' from ' + action.previousValue;
  action.log = logMessage;
  return action;
}

export function log(logId, action) {
  let query = {
    _id: logId
  };
  let update = {
    $push: {
      actions: action
    }
  };
  return callbackToPromise(MeteorObservable.call('update', 'systemLogs', query, update));
}

export function setConnectionLandTime(connectionId, pathname) {
  return callbackToPromise(MeteorObservable.call('setConnectionLandTime', connectionId, pathname));

}

export function getPageConnections(pathname) {
  return callbackToPromise(MeteorObservable.call('getPageConnections', pathname));
}

export function getCategoryById(categoryId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'categories', {_id: categoryId}));
}
export function getCustomerById(customerId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'customers', {_id: customerId}));
}

// export function getUrlParams(url) {
//   let type = typeof url;
//   let obj = {};
//   if (type == 'string') {
//     let urlArr = url.split('.');
//     Object.assign(obj, {[urlArr[0]]: urlArr[1]});
//   } else {
//     url.forEach(param => {
//       let urlArr = param.split('.');
//       Object.assign(obj, {[urlArr[0]]: urlArr[1]});
//     })
//   }
//   return obj;
// }

export function parseUrlParams(params) {
  let url = {};
  Object.keys(params).forEach(key => {
    let keyArr = key.split('.');
    if (keyArr.length > 1) {
      url[keyArr[1]] = params[key];
    } else {
      url[key] = params[key];
    }
  });

  return url;
}


// async functions
export async function isDeveloper(userId, tenantId) {
  const user:any = await getUser(userId).catch(error => console.log(error));
  if ('tenants' in user) {
    const tenantIndex = user.tenants.findIndex(tenant => {
      if (tenant._id == tenantId) {
        return true;
      }
    });
    if (tenantIndex > -1) {
      let mapResult:any = await Promise.all(user.tenants[tenantIndex].groups.map(async(groupId) => {
        if (groupId) {
          let group:any = await callbackToPromise(MeteorObservable.call('findOne', 'userGroups', {_id: groupId})).catch(error => console.log(error))
          if (group && group.name == 'Developer') {
            return true;
          }
        }
      })).catch(error => console.log(error));
      let index = mapResult.findIndex(res => {
        if (res == true) {
          return true;
        }
      });
      if (index > -1) {
        return true;
      }
    }
  }
  return false;
}

export function getContractIdByCustomerId(customerId) {
  return callbackToPromise(MeteorObservable.call('getContractId', customerId));
}

export function getProductById(productId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'products', {_id: productId}));
}

export function getContractProductByProductId(contractId, productId) {
  return callbackToPromise(MeteorObservable.call('getContractProductByProductId', contractId, productId));

}

export function getProductByQuery(query) {
  return callbackToPromise(MeteorObservable.call('find', 'products', query));
}

export function getContractById(contractId) {
  return callbackToPromise(MeteorObservable.call('findOne', 'customerContracts', {_id: contractId}));
}

export function getContractByQuery(query) {
  return callbackToPromise(MeteorObservable.call('find', 'customerContracts', query));
}
export function getContractCategory(contractId, categoryId) {
  return callbackToPromise(MeteorObservable.call('getContractCategory', contractId, categoryId));
}
export function checkNullFromObject(obj, paths) {
  let pathArr = paths.split('.');
  let newObj = {};
  pathArr.forEach(path => {
    if (obj && path in obj) {
      obj = obj[path];
    } else {
      return true
    }
  })
  return false;
}

export function addUserActivity(doc) {
  return false;
}

export function checkMobile() {
  let mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? true : false;
  return mobile;
}

// export function reportPdf(pdfContent) {
//   generateTableBody(pdfContent)
//   let dd = {
//     pageOrientation: 'landscape',
//     footer: function (currentPage, pageCount) {
//       return {
//         margin: [20, 10, 20, 0],
//         fontSize: 10,
//         columns: [
//           {
//             text: currentPage.toString() + ' of ' + pageCount
//           },
//           {
//             text: moment().format("MM/DD/YYYY h:mma"),
//             alignment: 'right',
//           }
//         ]
//       }
//     },
//     content: [
//       {
//         style: 'tableExample',
//         table: {
//           headerRows: 2,
//           widths: generateColumnWidths(pdfContent),
//           body: generateTableBody(pdfContent),
//         }
//       },
//     ],
//     styles: {
//       header: {
//         fontSize: 16,
//         bold: false,
//         margin: [0, 0, 0, 10],
//         color: 'black',
//         // alignment: 'center'
//       },
//       subheader: {
//         alignment: 'center',
//         fontSize: 14,
//         bold: false,
//         // margin: [40],
//         color: 'white',
//         fillColor: '#c25113'
//       },
//       tableExample: {
//         margin: [0, 5, 0, 15],
//       },
//       tableHeader: {
//         bold: true,
//         fontSize: 12,
//         color: 'black',
//         alignment: 'center',
//         fillColor: '#dedede'
//       },
//       branding: {
//         // width: '*',
//         fillColor: '#c25113',
//         background: '#c25113',
//         color: 'white',
//         alignment: 'left'
//       }
//     },
//   }
//   return dd;
// }

// export function pdfContentArray(pdfObj) {
//   const docDefinition = {
//     pageSize: 'A4',
//     pageMargins: [33, 100, 40, 40],
//     background: {
//       image: Logo,
//       width: 200,
//       margin: [30, 33, 30, 0]
//     },
//     header: {
//       table: {
//         headerRows: 1,
//         widths: ['*'],
//         body: [
//           [{ text: 'Global The Source', style: 'branding', border: [false, false, false, false], alignment: 'right' }]

//         ]
//       },
//       layout: {
//         hLineWidth: function (i, node) {
//           return (i === 0 || i === node.table.body.length) ? 0 : 0;
//         },
//         vLineWidth: function (i, node) {
//           return (i === 0 || i === node.table.widths.length) ? 0 : 0;
//         },
//         paddingLeft: function (i, node) { return 492.7; },
//         paddingTop: function (i, node) { return 3; },
//         paddingBottom: function (i, node) { return 3; }
//       }
//     },
//     footer: function (currentPage, pageCount) {
//       return [
//         {
//           columns: [
//             [
//               {
//                 width: '*',
//                 text: currentPage.toString() + ' of ' + pageCount,
//               },
//               // {
//               //   text: `Printed by joe`,
//               // }
//             ],
//             [
//               {
//                 width: '*',
//                 alignment: 'right',
//                 text: `Price Sheet for: ` + pdfObj.customer
//               },
//               // {
//               //   width: '*',
//               //   alignment: 'right',
//               //   text: `Created on: - End Date: Dec 31 2018`
//               // }
//             ],

//           ],
//           margin: [20, 5, 20, 0],
//           fontSize: 10
//         }
//       ]
//     },
//     content: [
//       // { text: 'Customer Price Sheet', style: 'header' },
//       {
//         columns: [
//           {
//             // auto-sized columns have their widths based on their content
//             width: 'auto',
//             text: pdfObj.customer,
//             bold: true,
//             fontSize: 15
//           },
//           {
//             // star-sized columns fill the remaining space
//             width: '*',
//             alignment: 'right',
//             text: `End Date: Dec 31, 2018`
//             // text: `End Date: ` + moment(Session.get('endContractDate')).format("MMM DD, YYYY")
//           }
//         ]
//       },
//       _.sortBy(pdfObj.content, '_id').map((table) => {
//         return getTables(table)
//       }),

//     ],

//     // Styles dictionary
//     styles: {
//       header: {
//         fontSize: 18,
//         bold: false,
//         margin: [0, 0, 0, 10],
//         color: 'black',
//         // alignment: 'center'
//       },
//       subheader: {
//         alignment: 'center',
//         fontSize: 14,
//         bold: false,
//         // margin: [40],
//         color: 'white',
//         fillColor: '#c25113'
//       },
//       tableExample: {
//         margin: [0, 5, 0, 15],
//       },
//       tableHeader: {
//         bold: true,
//         fontSize: 12,
//         color: 'black',
//         alignment: 'center',
//         fillColor: '#dedede'
//       },
//       branding: {
//         // width: '*',
//         fillColor: '#c25113',
//         background: '#c25113',
//         color: 'white',
//         alignment: 'left'
//       }
//     },
//     defaultStyle: {
//       alignment: 'justify'
//     }
//   };
//   return docDefinition;
// }

// function generateColumnWidths(contents) {
//   let columns = contents.lookup.dataTable.columns;
//   let columnArr = [];
//   columns.forEach(element => {
//     if (element.hidden !== true) {
//       let width = element.reportColumnWidth ? element.reportColumnWidth : '*';
//       columnArr.push(width);
//     }
//   });
//   return columnArr;
// }

// function generateTableBody(contents) {
//   let body = []
//   let title = contents.lookup.dataTable.options.reportTitle;
//   let columns = contents.lookup.dataTable.columns;
//   let results = contents.result;
//   let totals = contents.totals;
//   let date = (contents.date) ? ' (' + moment(contents.date).format("MM/DD/YYYY") + ')': ''

//   // let columnHeaders = [{ text: title, style: 'header', alignment: 'left', border: [false, false, false, false] }, {}, {}, {}, {}, {}, {}, {}, {}, date]
//   let reportTitle = [];
//   let columnTitles = [];
//   let rows = [];
//   let rowSpecificInfo = [];
//   let hiddenColumns = [];
//   columns.forEach(element => {
//     if (element.hidden !== true) {
//       let alignment = element.reportAlignment ? element.reportAlignment : 'center';
//       let reportTotal = element.reportTotalName ? element.reportTotalName : null;
//       reportTitle.push({});
//       columnTitles.push({ text: element.reportColumnName, fontSize: 10, alignment: alignment, border: [false, false, false, true] });
//       rowSpecificInfo.push({ prop: element.prop, alignment: alignment, total: reportTotal})
//     } else {
//       hiddenColumns.push(element.prop)
//     }
//   });
//   reportTitle.splice(0, 1, { text: title + date, style: 'header', colSpan: reportTitle.length, alignment: 'left', border: [false, false, false, false] });
//   body.push(reportTitle, columnTitles);

//   results.forEach(element => {
//     let row = [];
//     rowSpecificInfo.forEach(rowInfo => {
//       let text = element[rowInfo.prop];
//       if (!_.contains(hiddenColumns, rowInfo.prop)) {
//         if (element[rowInfo.prop] instanceof Date) {
//           text = moment(element[rowInfo.prop]).format("MM/DD/YYYY")
//         } else {
//           if (element[rowInfo.prop] !== null && element[rowInfo.prop] !== undefined) {
//             text = (typeof element[rowInfo.prop] == 'number') ? element[rowInfo.prop].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : element[rowInfo.prop];
//           } else {
//             text = "";
//           }
//         }

//         row.push({ text: text, alignment: rowInfo.alignment, fontSize: 9, border: [false, false, false, false] })
//       }
//     });
//     body.push(row);
//   });

//   if (totals) {
//     let rowTotal = [];
//     rowSpecificInfo.forEach(rowInfo => {
//       if (rowInfo.total) {
//         rowTotal.push({ text: totals[rowInfo.total].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: 9, bold: true, alignment: rowInfo.alignment, margin: [0, 0, 0, 0], border: [false, true, false, true] })
//       } else {
//         rowTotal.push({ text: '', alignment: rowInfo.alignment, bold: true, fontSize: 9, margin: [0, 0, 0, 0], border: [false, false, false, false] })
//       }
//     });
//     body.push(rowTotal);
//   }

//   return body;
// }

// function getTables(table) {
//   let columnHeaders;
//   let colArr = [];
//   let rowArr = [];

//   // columnHeaders = Object.keys(table['row'][0]);

//   columnHeaders = ['Customer Part No.', 'Global Part No.', 'Description', 'Price']

//   columnHeaders.map((column, index) => {
//     if (index !== 3) {
//       colArr.push({ text: column, style: 'tableHeader', alignment: 'left' })
//     } else {
//       colArr.push({ text: column, style: 'tableHeader', alignment: 'right' })
//     }
//   })

//   let tableBody = table.row;
//   tableBody.map((row) => {
//     let eachRowArr = [];
//     let rowValue = _.values(row)
//     rowValue.map((Row, index) => {
//       if (index !== 3) {
//         eachRowArr.push({ text: Row, alignment: 'left',})
//       } else {
//         eachRowArr.push({ text: "$" + Row.toFixed(2), alignment: 'right',})
//       }
//     });
//     rowArr.push(eachRowArr)
//   })

//   rowArr.unshift(colArr)
//   rowArr.unshift([{ text: table.categoryDescription, style: 'subheader', colSpan: 4, alignment: 'center' }, {}, {}, {}])
//   let tableContent = {
//     margin: [0, 0, 0, 0],
//     table: {
//       headerRows: 2,
//       widths: [110, 100, '*', 60],
//       keepWithHeaderRows: 1,
//       dontBreakRows: true,
//       body: rowArr
//     },
//     layout: {
//       hLineWidth: function (i, node) {
//         return (i === 0 || i === node.table.body.length) ? 0 : 1;
//       },
//       vLineWidth: function (i, node) {
//         return (i === 0 || i === node.table.widths.length) ? 0 : 0;
//       },
//       hLineColor: function (i, node) {
//         return (i === 0 || i === node.table.body.length) ? 'white' : '#ececec';
//       },
//       vLineColor: function (i, node) {
//         return (i === 0 || i === node.table.widths.length) ? 'white' : 'white';
//       },
//       paddingTop: function (i, node) { return 2; },
//       paddingBottom: function (i, node) { return 2; }
//     }
//   }
//   return tableContent
// }

export function agedInvoices(ranges, customerId?) {
  let beginningOfRange = function (date){return moment().add(date, 'day').startOf('day').format()}
  let endOfRange = function (date){return moment().add(date, 'day').endOf('day').format()};
  let pipeline = [
    {
      "$match": {
        "tenantId": Session.get('tenantId'),
        "status": "complete",
        ...(customerId && {
            "customerId": customerId,
          }
        ),
        'date': {
          "$gte": new Date("2016-01-01T05:00:00.000Z")
        }
      }
    },
    {
      "$match": {
        "$or": [
          { 'applyToCustomerInvoiceId': { $lte: '' } },
          { 'applyToCustomerInvoiceId': { $exists: false } },
        ]
      }
    }, 
    {
      "$project": {
        "_id": 1,
        "bucket": {
          "$switch": {
            "branches": [
              {
                "case": {
                  "$gte": [
                    "$dueDate",
                    new Date(beginningOfRange(ranges.current.start))
                  ]
                },
                "then": "current"
              },
              {
                "case": {
                  "$and": [
                    {
                      "$gte": [
                        "$dueDate",
                        new Date(beginningOfRange(ranges.range15.start))
                      ]
                    },
                    {
                      "$lte": [
                        "$dueDate",
                        new Date(endOfRange(ranges.range15.end))
                      ]
                    }
                  ]
                },
                "then": "15"
              },
              {
                "case": {
                  "$and": [
                    {
                      "$gte": [
                        "$dueDate",
                        new Date(beginningOfRange(ranges.range30.start))
                      ]
                    },
                    {
                      "$lte": [
                        "$dueDate",
                        new Date(endOfRange(ranges.range30.end))
                      ]
                    }
                  ]
                },
                "then": "30"
              },
              {
                "case": {
                  "$and": [
                    {
                      "$gte": [
                        "$dueDate",
                        new Date(beginningOfRange(ranges.range60.start))
                      ]
                    },
                    {
                      "$lte": [
                        "$dueDate",
                        new Date(endOfRange(ranges.range60.end))
                      ]
                    }
                  ]
                },
                "then": "60"
              },
              {
                "case": {
                  "$and": [
                    {
                      "$lte": [
                        "$dueDate",
                        new Date(endOfRange(ranges.range90.end))
                      ]
                    }
                  ]
                },
                "then": "90"
              }
            ],
            "default": "missed"
          }
        },
        'payments': 1,
        'freight': 1, 'discount': 1,
        'date': 1, 'number': 1,
        "lineItems": {
          "$filter": {
            "input": "$lineItems",
            "as": "item",
            "cond": {
              "$and": [
                {
                  "$ne": [
                    "$$item.type",
                    "comment"
                  ]
                }
              ]
            }
          }
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "bucket": 1,
        "number": 1,
        "date": 1,
        'freight': 1, 'discount': 1,
        "lineItemTotal": {
          "$ifNull": [
            {
              "$reduce": {
                "input": "$lineItems.total",
                "initialValue": 0,
                "in": {
                  "$sum": [
                    '$$value',
                    "$$this"
                  ]
                }
              }
            },
            0
          ]
        },
        "amountApplied": {
          "$ifNull": [
            {
              "$reduce": {
                "input": "$payments.amountApplied",
                "initialValue": 0,
                "in": {
                  "$sum": [
                    "$$value",
                    "$$this"
                  ]
                }
              }
            },
            0
          ]
        },
        "discountApplied": {
          "$ifNull": [
            {
              "$reduce": {
                "input": "$payments.discountApplied",
                "initialValue": 0,
                "in": {
                  "$sum": [
                    "$$value",
                    "$$this"
                  ]
                }
              }
            },
            0
          ]
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "bucket": 1,
        "date": 1,
        "number": 1,
        "lineItemTotal": {
          "$subtract": [
            {
              "$add": [
                "$lineItemTotal",
                "$freight"
              ]
            },
            "$discount"
          ]
        },
        "amountApplied": 1,
        "discountApplied": 1,
        "total": {
          "$subtract": [
            {
              "$subtract": [
                {
                  "$add": [
                    "$lineItemTotal",
                    "$freight"
                  ]
                },
                "$discount"
              ]
            },
            {
              "$add": [
                "$amountApplied",
                "$discountApplied"
              ]
            }
          ]
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "bucket": 1,
        "date": 1,
        "number": 1,
        "lineItemTotal": 1,
        "amountApplied": 1,
        "discountApplied": 1,
        "total": {
          "$divide": [
            {
              "$trunc": {
                "$multiply": [
                  "$total",
                  1000
                ]
              }
            },
            1000
          ]
        }
      }
    },
    {
      "$match": {
        "total": {
          "$ne": 0
        }
      }
    },
    {
      "$group": {
        "_id": "$bucket",
        "total": {
          "$sum": "$total"
        },
        "debit": {
          "$sum": {
            "$cond": {
              "if": {
                "$gt": [
                  "$total",
                  0
                ]
              },
              "then": "$total",
              "else": 0
            }
          }
        },
        "credit": {
          "$sum": {
            "$cond": {
              "if": {
                "$lt": [
                  "$total",
                  0
                ]
              },
              "then": "$total",
              "else": 0
            }
          }
        }
      }
    },
    {
      "$addFields": {
        "total": { $toDouble: "$total" },
        "debit": { $toDouble: "$debit" },
        "credit": { $toDouble: "$credit" },
      },
    },
  ]
  // console.log(JSON.stringify(pipeline));
  return runAggregate('customerInvoices', pipeline);
}

export function addStringToArray(str, array) {

}

export function _addObjectToArray(obj, key, array) {
  const newArray = array.slice();
  let index = array.findIndex(elem => {
    if (elem[key] === obj[key]) {
      return true;
    }
  });
  if (index == -1) {
    newArray.push(obj);
  }
  return newArray;
}

export function _removeParamFromObject(key, params) {
  delete params[key];

}

export function _isObjectChanged(newObj, oldObj, keys) {
  let isChanged = false;
  keys.forEach(key => {
    if (oldObj[key] != newObj[key]) {
      isChanged = true;
    }
  });
  return isChanged;
}

export function _isObjectChangedAll(newObj, oldObj) {
  let isChanged = false;
  let newKeys = Object.keys(newObj);
  let oldKeys = Object.keys(oldObj);
  let allKeys = new Set();
  newKeys.forEach(key => {
    allKeys.add(key);
  })
  oldKeys.forEach(key => {
    allKeys.add(key);
  });

  allKeys.forEach(key => {
    if (oldObj[key] != newObj[key]) {
      isChanged = true;
    }
  });
  return isChanged;
}

export function sortArrayByKey(array, key) {
  const valueArr = array.map(ele => {
    return ele[key];
  });
  valueArr.sort();
}

export function consoleLog(message) {
  MeteorObservable.call('consoleLog', message).subscribe();
}

export function getModule(moduleName) {
  return callbackToPromise(MeteorObservable.call('findOne', 'systemModules', {name: moduleName}));
}

export function getSystemOption(query) {
  return callbackToPromise(MeteorObservable.call('findOne', 'systemOptions', query));
}

export function getPermission(query) {
  return callbackToPromise(MeteorObservable.call('findOne', 'systemPermissions', query));
}

export function getAllowedRoutes(query) {
  return callbackToPromise(MeteorObservable.call('getAllowedRoutes', query));
}

export function checkIfUserCanAccessThisUrl(url) {
  return callbackToPromise(MeteorObservable.call('checkIfUserCanAccessThisUrl', url));
}

export function getTotalSales(dateRange) {
  let pipeline = [{
    $match: {
      "date": {
        $gte: dateRange.gte,
        $lte: dateRange.lte
      },
      "status": "complete",
      "tenantId": Session.get('tenantId')
    }
  }, {
    $unwind: "$lineItems"
  }, {
    $group: {
      _id: "$lineItems.productId",
      totalAmount: {
        $sum: "$lineItems.total"
      },
    }
  }, {
    $group: {
      _id: "_id",
      total: {
        $sum: "$totalAmount"
      },
    }
  }, {
    "$addFields": {
      "total": { $toDouble: "$total" },
    },
  }];
  return runAggregate('customerInvoices', pipeline);
}

export function getTotalSalesInquiry(match, productLineArr?) {
  productLineArr = productLineArr ? productLineArr : [];
  let pipeline = [
    {
      $match: match
    }, {
      $unwind: "$lineItems"
    }, {
      "$match": {
        ...(productLineArr.length > 0 && {
          "lineItems.categoryId": {
            "$in": productLineArr
          }
        }),
        "tenantId": Session.get('tenantId')
      }
    }, {
      $group: {
        "_id": "_id",
        "total": {
          "$sum": "$lineItems.total"
        },
        totalCost: {
          $sum: { $multiply: ["$lineItems.cost", "$lineItems.qtyShipped"] }
        },
        "discountAmt": {
          "$max": "$discount"
        }
      }
    }, {
      $project: {
        _id: 1,
        total: { $subtract: ["$total", "$discountAmt"] },
        totalCost: 1,
      }
    },
    {
      "$addFields": {
        "total": { $toDouble: "$total" },
        "totalCost": { $toDouble: "$totalCost" },
      },
    },
  ]
  // console.log(JSON.stringify(pipeline))
  return runAggregate('customerInvoices', pipeline);
}

export function getMonthlyBudgetPerSalesPerson(match, year, salesPeople){
  if (!('tenantId' in match)) {
      match['tenantId'] = Session.get('tenantId');
  }

  let pipeline = [
    {
      "$match": match
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "description": 1,
        "category": 1,
        "totals": {
          "$filter": {
            "input": "$totals",
            "as": "total",
            "cond": {
              "$eq": [
                "$$total.year",
                year
              ]
            }
          }
        }
      }
    },
    {
      "$unwind": "$totals"
    },
    {
      "$match": {
        "totals.budgets": {
          "$gt": []
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "category": 1,
        "beginningBalance": "$totals.beginningBalance",
        "budgets": {
          "$filter": {
            "input": "$totals.budgets",
            "as": "budgets",
            "cond": {
              "$in": [
                "$$budgets._id",
                salesPeople
              ]
            }
          }

        }
      }
    },
    {
      "$unwind": "$budgets"
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "category": 1,
        "budgetDebitAmounts": "$budgets.debitAmounts",
        "budgetCreditAmounts": "$budgets.creditAmounts"
      }
    },
    {
      "$project": {
        "0": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    0
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    0
                  ]
                },
                0
              ]
            }
          ]
        },
        "1": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    1
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    1
                  ]
                },
                0
              ]
            }
          ]
        },
        "2": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    2
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    2
                  ]
                },
                0
              ]
            }
          ]
        },
        "3": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    3
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    3
                  ]
                },
                0
              ]
            }
          ]
        },
        "4": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    4
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    4
                  ]
                },
                0
              ]
            }
          ]
        },
        "5": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    5
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    5
                  ]
                },
                0
              ]
            }
          ]
        },
        "6": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    6
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    6
                  ]
                },
                0
              ]
            }
          ]
        },
        "7": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    7
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    7
                  ]
                },
                0
              ]
            }
          ]
        },
        "8": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    8
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    8
                  ]
                },
                0
              ]
            }
          ]
        },
        "9": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    9
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    9
                  ]
                },
                0
              ]
            }
          ]
        },
        "10": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    10
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    10
                  ]
                },
                0
              ]
            }
          ]
        },
        "11": {
          "$add": [
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetDebitAmounts",
                    11
                  ]
                },
                0
              ]
            },
            {
              "$ifNull": [
                {
                  "$arrayElemAt": [
                    "$budgetCreditAmounts",
                    11
                  ]
                },
                0
              ]
            }
          ]
        },
        "category": 1
      }
    },
    {
      "$group": {
        "0": {
          "$sum": "$0"
        },
        "1": {
          "$sum": "$1"
        },
        "2": {
          "$sum": "$2"
        },
        "3": {
          "$sum": "$3"
        },
        "4": {
          "$sum": "$4"
        },
        "5": {
          "$sum": "$5"
        },
        "6": {
          "$sum": "$6"
        },
        "7": {
          "$sum": "$7"
        },
        "8": {
          "$sum": "$8"
        },
        "9": {
          "$sum": "$9"
        },
        "10": {
          "$sum": "$10"
        },
        "11": {
          "$sum": "$11"
        },
        "_id": "000"
      }
    },
    {
      $addFields: {
        "0": { $toDouble: "$0" },
        "1": { $toDouble: "$1" },
        "2": { $toDouble: "$2" },
        "3": { $toDouble: "$3" },
        "4": { $toDouble: "$4" },
        "5": { $toDouble: "$5" },
        "6": { $toDouble: "$6" },
        "7": { $toDouble: "$7" },
        "8": { $toDouble: "$8" },
        "9": { $toDouble: "$9" },
        "10": { $toDouble: "$10" },
        "11": { $toDouble: "$11" },
      },
    },
  ]
  // console.log(JSON.stringify(pipeline));
  return runAggregate('ledgerAccounts', pipeline);
}

export function getMonthlyBudget(match, year, actualAmountFlag?) {
  let subtractElements = [
    "Cost of Sales",
    "Expenses"
  ];

  if (!('tenantId' in match)) {
      match['tenantId'] = Session.get('tenantId');
  }

  let pipeline = [
    {
      "$match": match
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "description": 1,
        "category": 1,
        "totals": {
          "$filter": {
            "input": "$totals",
            "as": "total",
            "cond": {
              "$eq": [
                "$$total.year",
                year
              ]
            }
          }
        }
      }
    },
    {
      "$unwind": "$totals"
    },
    {
      "$match": {
        ...(!actualAmountFlag && {
          "totals.budgetDebitAmounts": {
            "$exists": true
          }
        })
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "category": 1,
        "beginningBalance": "$totals.beginningBalance",
        ...(!actualAmountFlag && {
           "budgetCreditAmounts": "$totals.budgetCreditAmounts",
           "budgetDebitAmounts": "$totals.budgetDebitAmounts",
          }
        ),
        ...(actualAmountFlag && {
          "creditAmounts": "$totals.creditAmounts",
          "debitAmounts": "$totals.debitAmounts",
        }
        ),
      }
    },
    {
      "$project": {
        "category": 1,
        ...(!actualAmountFlag && {
            '0': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 0] }, { $arrayElemAt: ["$budgetCreditAmounts", 0] }] },
            '1': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 1] }, { $arrayElemAt: ["$budgetCreditAmounts", 1] }] },
            '2': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 2] }, { $arrayElemAt: ["$budgetCreditAmounts", 2] }] },
            '3': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 3] }, { $arrayElemAt: ["$budgetCreditAmounts", 3] }] },
            '4': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 4] }, { $arrayElemAt: ["$budgetCreditAmounts", 4] }] },
            '5': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 5] }, { $arrayElemAt: ["$budgetCreditAmounts", 5] }] },
            '6': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 6] }, { $arrayElemAt: ["$budgetCreditAmounts", 6] }] },
            '7': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 7] }, { $arrayElemAt: ["$budgetCreditAmounts", 7] }] },
            '8': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 8] }, { $arrayElemAt: ["$budgetCreditAmounts", 8] }] },
            '9': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 9] }, { $arrayElemAt: ["$budgetCreditAmounts", 9] }] },
            '10': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 10] }, { $arrayElemAt: ["$budgetCreditAmounts", 10] }] },
            '11': { $add: [{ $arrayElemAt: ["$budgetDebitAmounts", 11] }, { $arrayElemAt: ["$budgetCreditAmounts", 11] }] }
          }
        ),
        ...(actualAmountFlag && {
          '0': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 0] }, { $arrayElemAt: ["$creditAmounts", 0] }] }]},
          '1': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 1] }, { $arrayElemAt: ["$creditAmounts", 1] }] }]},
          '2': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 2] }, { $arrayElemAt: ["$creditAmounts", 2] }] }]},
          '3': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 3] }, { $arrayElemAt: ["$creditAmounts", 3] }] }]},
          '4': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 4] }, { $arrayElemAt: ["$creditAmounts", 4] }] }]},
          '5': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 5] }, { $arrayElemAt: ["$creditAmounts", 5] }] }]},
          '6': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 6] }, { $arrayElemAt: ["$creditAmounts", 6] }] }]},
          '7': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 7] }, { $arrayElemAt: ["$creditAmounts", 7] }] }]},
          '8': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 8] }, { $arrayElemAt: ["$creditAmounts", 8] }] }]},
          '9': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 9] }, { $arrayElemAt: ["$creditAmounts", 9] }] }]},
          '10': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 10] }, { $arrayElemAt: ["$creditAmounts", 10] }] }]},
          '11': { $add: ['$beginningBalance', { $subtract: [{ $arrayElemAt: ["$debitAmounts", 11] }, { $arrayElemAt: ["$creditAmounts", 11] }] }]}
        })
      }
    },
    {
      "$project": {
        "_id": 1,
        "category": 1,
        "0": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$0",
                -1
              ]
            },
            "else": "$0"
          }
        },
        "1": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$1",
                -1
              ]
            },
            "else": "$1"
          }
        },
        "2": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$2",
                -1
              ]
            },
            "else": "$2"
          }
        },
        "3": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$3",
                -1
              ]
            },
            "else": "$3"
          }
        },
        "4": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$4",
                -1
              ]
            },
            "else": "$4"
          }
        },
        "5": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$5",
                -1
              ]
            },
            "else": "$5"
          }
        },
        "6": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$6",
                -1
              ]
            },
            "else": "$6"
          }
        },
        "7": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$7",
                -1
              ]
            },
            "else": "$7"
          }
        },
        "8": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$8",
                -1
              ]
            },
            "else": "$8"
          }
        },
        "9": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$9",
                -1
              ]
            },
            "else": "$9"
          }
        },
        "10": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$10",
                -1
              ]
            },
            "else": "$10"
          }
        },
        "11": {
          "$cond": {
            "if": {
              "$in": [
                "$category",
                subtractElements
              ]
            },
            "then": {
              "$multiply": [
                "$11",
                -1
              ]
            },
            "else": "$1"
          }
        }
      }
    },
    {
      "$group": {
        "_id": "000",
        "0": {
          "$sum": "$0"
        },
        "1": {
          "$sum": "$1"
        },
        "2": {
          "$sum": "$2"
        },
        "3": {
          "$sum": "$3"
        },
        "4": {
          "$sum": "$4"
        },
        "5": {
          "$sum": "$5"
        },
        "6": {
          "$sum": "$6"
        },
        "7": {
          "$sum": "$7"
        },
        "8": {
          "$sum": "$8"
        },
        "9": {
          "$sum": "$9"
        },
        "10": {
          "$sum": "$10"
        },
        "11": {
          "$sum": "$11"
        }
      }
    },
    {
      $addFields: {
        "0": { $toDouble: "$0" },
        "1": { $toDouble: "$1" },
        "2": { $toDouble: "$2" },
        "3": { $toDouble: "$3" },
        "4": { $toDouble: "$4" },
        "5": { $toDouble: "$5" },
        "6": { $toDouble: "$6" },
        "7": { $toDouble: "$7" },
        "8": { $toDouble: "$8" },
        "9": { $toDouble: "$9" },
        "10": { $toDouble: "$10" },
        "11": { $toDouble: "$11" },
      },
    },
  ]
  // console.log(JSON.stringify(pipeline));
  return runAggregate('ledgerAccounts', pipeline);
}

export function getTotalSalespersonUserDefined(match, userIdArr, productLineArr?) {
  productLineArr = productLineArr ? productLineArr : [];
  if (!('tenantId' in match)) {
      match['tenantId'] = Session.get('tenantId');
  }

  let pipeline = [
    {
      "$match": match
    },
    {
      "$unwind": "$salespeople"
    },
    {
      "$match": {
        ...(userIdArr.length > 0 && {
          "salespeople.userID": {
            "$in": userIdArr
          }
        })
      }
    },
    {
      "$unwind": "$lineItems"
    },
    {
      "$match": {
        ...(productLineArr.length > 0 && {
          "lineItems.categoryId": {
            "$in": productLineArr
          }
        }),
      }
    },
    {
      "$group": {
        "_id": {
          "_id": "$_id",
          'lineItemId': '$lineItems._id',
          "userId": "$salespeople.userID",

        },
        'discount': { "$first": '$discount' },
        'lineItems': { "$first": '$lineItems' },
        'salespeople': { "$first": '$salespeople' },
        'date': {
          '$first': '$date'
        }
      }
    },
    { "$project": { '_id': '$_id._id', 'discount': 1, 'lineItems': 1, 'salespeople': 1, "date": 1 } },
    { "$project": { '_id': 1, 'discountAmt': "$discount", 'lineItemTotal': '$lineItems.total', 'comissionPercent': "$salespeople.commissionPercent", "date": 1 } },
    {
      "$project": {
        "lineItemTotal": {
          "$subtract": [
            "$lineItemTotal",
            "$discountAmt"
          ]
        },
        "comissionPercent": 1,
        "discountAmt": 1,
        "date": 1
      }
    },
    {
      "$project": {
        "date": 1,
        "invoiceLineItemTotal": {
          "$cond": {
            "if": {
              "$gt": [
                "$lineItemTotal",
                0
              ]
            },
            "then": {
              "$let": {
                "vars": {
                  "lineItemTotalCommission": {
                    "$add": [
                      {
                        "$multiply": [
                          "$lineItemTotal",
                          "$comissionPercent",
                          0.01
                        ]
                      },
                      0.005
                    ]
                  }
                },
                "in": {
                  "$divide": [
                    {
                      "$subtract": [
                        {
                          "$multiply": [
                            "$$lineItemTotalCommission",
                            100
                          ]
                        },
                        {
                          "$mod": [
                            {
                              "$multiply": [
                                "$$lineItemTotalCommission",
                                100
                              ]
                            },
                            1
                          ]
                        }
                      ]
                    },
                    100
                  ]
                }
              }
            },
            "else": {
              "$let": {
                "vars": {
                  "lineItemTotalCommission": {
                    "$add": [
                      {
                        "$multiply": [
                          "$lineItemTotal",
                          "$comissionPercent",
                          0.01
                        ]
                      },
                      -0.005
                    ]
                  }
                },
                "in": {
                  "$divide": [
                    {
                      "$subtract": [
                        {
                          "$multiply": [
                            "$$lineItemTotalCommission",
                            100
                          ]
                        },
                        {
                          "$mod": [
                            {
                              "$multiply": [
                                "$$lineItemTotalCommission",
                                100
                              ]
                            },
                            1
                          ]
                        }
                      ]
                    },
                    100
                  ]
                }
              }
            }
          }
        }
      }
    },
    {
      "$project": {
        '_id': 1,
        'date': 1,
        'day': { '$dayOfMonth': '$date' },
        'month': { '$month': '$date' },
        'year': { '$year': '$date' },
        'invoiceLineItemTotal': '$invoiceLineItemTotal'
      }
    },
    {
      "$group": {
        "_id": "$salespeople.userID",
        "salesPersonTotal": {
          "$sum": "$invoiceLineItemTotal"
        }
      }
    },
    {
      "$addFields": {
        "salesPersonTotal": { $toDouble: "$salesPersonTotal" },
      },
    },
    // {
    //   '$group': {
    //     "_id": {
    //       "day": "$day",
    //       "month": "$month",
    //       "year": "$year"
    //     },
    //     "id": {
    //       "$first": "$_id"
    //     },
    //     "salesPersonTotal": {
    //       "$sum": "$invoiceLineItemTotal"
    //     },
    //     "date": {
    //       "$first": "$date"
    //     }
    //   }
    // },
    // {
    //   '$project': {
    //     '_id': '$id',
    //     'day': '$_id.day',
    //     'month': '$_id.month',
    //     'year': '$_id.year',
    //     'salesPersonTotal': 1,
    //     'date': 1,
    //   }
    // },
    // { '$sort': { 'day': 1 } },
    // { '$sort': { 'month': 1 } },
  ];
  // console.log(JSON.stringify(pipeline));
  return runAggregate('customerInvoices', pipeline);
}

export function getTotalSalespersonSalesInquiry(match, userIdArr, productLineArr?) {
  productLineArr = productLineArr ? productLineArr : [];
  if (!('tenantId' in match)) {
      match['tenantId'] = Session.get('tenantId');
  }
  let pipeline = [
    {
      "$match": match
    },
    {
      "$unwind": "$salespeople"
    },
    {
      "$match": {
        "salespeople.userID": {
          "$in": userIdArr
        }
      }
    },
    {
      "$unwind": "$lineItems"
    },
    {
      "$match": {
        ...(productLineArr.length > 0 && {
          "lineItems.categoryId": {
            "$in": productLineArr
          }
        }),
      }
    },
    {
      "$group": {
        "_id": {
          "_id": "$_id",
          lineItemId: '$lineItems._id',
          "userId": "$salespeople.userID",

        },
        discount: { $first: '$discount' },
        lineItems: { $first: '$lineItems' },
        salespeople: { $first: '$salespeople' },
      }
    },
    { $project: { _id: '$_id._id', discount: 1, lineItems: 1, salespeople: 1 } },
    { $project: { _id: 1, discountAmt: "$discount", lineItemTotal: '$lineItems.total', comissionPercent: "$salespeople.commissionPercent", } },
    {
      "$project": {
        "lineItemTotal": {
          "$subtract": [
            "$lineItemTotal",
            "$discountAmt"
          ]
        },
        "comissionPercent": 1,
        "discountAmt": 1
      }
    },
    {
      "$project": {
        "invoiceLineItemTotal": {
          "$cond": {
            "if": {
              "$gt": [
                "$lineItemTotal",
                0
              ]
            },
            "then": {
              "$let": {
                "vars": {
                  "lineItemTotalCommission": {
                    "$add": [
                      {
                        "$multiply": [
                          "$lineItemTotal",
                          "$comissionPercent",
                          0.01
                        ]
                      },
                      0.005
                    ]
                  }
                },
                "in": {
                  "$divide": [
                    {
                      "$subtract": [
                        {
                          "$multiply": [
                            "$$lineItemTotalCommission",
                            100
                          ]
                        },
                        {
                          "$mod": [
                            {
                              "$multiply": [
                                "$$lineItemTotalCommission",
                                100
                              ]
                            },
                            1
                          ]
                        }
                      ]
                    },
                    100
                  ]
                }
              }
            },
            "else": {
              "$let": {
                "vars": {
                  "lineItemTotalCommission": {
                    "$add": [
                      {
                        "$multiply": [
                          "$lineItemTotal",
                          "$comissionPercent",
                          0.01
                        ]
                      },
                      -0.005
                    ]
                  }
                },
                "in": {
                  "$divide": [
                    {
                      "$subtract": [
                        {
                          "$multiply": [
                            "$$lineItemTotalCommission",
                            100
                          ]
                        },
                        {
                          "$mod": [
                            {
                              "$multiply": [
                                "$$lineItemTotalCommission",
                                100
                              ]
                            },
                            1
                          ]
                        }
                      ]
                    },
                    100
                  ]
                }
              }
            }
          }
        }
      }
    },
    {
      "$group": {
        "_id": "$salespeople.userID",
        "salesPersonTotal": {
          "$sum": "$invoiceLineItemTotal"
        }
      }
    },
    {
      "$addFields": {
        "salesPersonTotal": { $toDouble: "$salesPersonTotal" },
      },
    },
  ];
  // console.log(JSON.stringify(pipeline));
  return runAggregate('customerInvoices', pipeline);
}

export function last5Invoices(options){
  if (!('tenantId' in options)) {
      options['tenantId'] = Session.get('tenantId');
  }
  let pipeline = [
    {
      $match: options
    }, {
      $unwind: "$lineItems"
    }, {
      $match: {
        "lineItems.total": {
          "$gt": 0
        }
      }
    }, {
      $group: {
        "_id": "$_id",
        "invoice": {
          "$max": "$number"
        },
        "invoiceDate": {
          "$max": "$date"
        },
        "customerPurchaseOrder": {
          "$max": "$customerPurchaseOrder"
        },
        "freight": {
          "$max": "$freight"
        },
        "totalSold": {
          "$sum": "$lineItems.total"
        }
      }
    }, {
      $project: {
        finalTotal: {
          $let: {
            vars: {
              freight: { $max: '$freight' },
              totalSold: { $max: '$totalSold' }
            },
            in: { $add: ["$$freight", "$$totalSold"] }
          }
        },
        invoice: 1,
        invoiceDate: 1,
        customerPurchaseOrder: 1,
        freight: 1,
        totalSold: 1
      }
    }, {
      $sort: {
        "invoiceDate": -1
      }
    }, {
      $limit: 5
    },
    {
      "$addFields": {
        "finalTotal": { $toDouble: "$finalTotal" },
        "freight": { $toDouble: "$freight" },
        "totalSold": { $toDouble: "$totalSold" },
      },
    },
  ]
  return runAggregate('customerInvoices', pipeline);
}

export function backOrderedItems(options){
  if (!('tenantId' in options)) {
      options['tenantId'] = Session.get('tenantId');
  }
  let pipeline = [
    {
      $match: options
    }, {
      $unwind: "$lineItems"
    }, {
      $match: {
        "lineItems.qtyBackordered": { $ne: 0 }
      }
    }, {
      $group: {
        "_id": "$_id",
        "number": { $max: "$customerPONumber" },
        "date": { $min: "$date" },
        "amount": { $sum: "$lineItems.qtyBackordered" }
      }
    }, {
      $sort: {
        "date": -1
      }
    }, {
      $limit: 5
    },
    {
      "$addFields": {
        "amount": { $toDouble: "$amount" },
      },
    },
  ];
  return runAggregate('customerOrders', pipeline);
}

export function returnUserFromArray(userArr){
  let pipeline = [
    { $match: { _id: { $in: userArr } } },
    {
      "$project": {
        "_id": 1,
        "name": {
          "$concat": [
            "$profile.firstName",
            " ",
            "$profile.lastName"
          ]
        }
      }
    }
  ]
  return runAggregate('users', pipeline);
}

export function salesPeople(match){
  if (!('tenantId' in match)) {
      match['tenantId'] = Session.get('tenantId');
  }

  let pipeline = [
    {
      "$match": match
    },
    {
      "$project": {
        "_id": 1,
        "customer": 1,
        "branches": 1
      }
    },
    {
      "$unwind": {
        "path": "$branches",
        "preserveNullAndEmptyArrays": true
      }
    },
    {
      "$unwind": {
        "path": "$branches.salespeople",
        "preserveNullAndEmptyArrays": true
      }
    },
    {
      "$group": {
        "_id": "$branches.salespeople.userId"
      }
    },
    {
      "$lookup": {
        "from": "users",
        "localField": "_id",
        "foreignField": "_id",
        "as": "user"
      }
    },
    {
      "$unwind": {
        "path": "$user"
      }
    },
    {
      "$project": {
        "_id": 1,
        "name": {
          "$concat": [
            "$user.profile.salesNumber",
            " - ",
            "$user.profile.firstName",
            " ",
            "$user.profile.lastName"
          ]
        }
      }
    },
    {$sort: {name: 1}}
  ]
  return runAggregate('customers', pipeline);
}

export function percentChange(options) {
  let percentage = 0;

  if (typeof options.numerator !== "number" || isNaN(options.numerator) || options.numerator === null || !options.numerator) {
    options.numerator = 0;
  }

  if (typeof options.denominator !== "number" || isNaN(options.denominator) || options.denominator === null || !options.denominator) {
    options.denominator = 0;
  }

  // both denominator and numerator are numbers
  if (options.denominator === 0) {
    if (options.numerator > 0) {
      percentage = -9999.99;
    } else {
      percentage = 0;
    }
  } else {
    if (options.denominator > options.numerator) {
      if (options.numerator < 0) {
        percentage = 10000
      } else {
        percentage = ((options.denominator - options.numerator) / options.numerator) * 100 //increase
      }
    } else {
      percentage = - ((options.numerator - options.denominator) / options.numerator) * 100 //decrease
    }
  }

  if (percentage < -9999.99) {
    percentage = -9999.99
  }

  if (percentage > 9999.99) {
    percentage = 9999.99
  }

  return percentage / 100;
}

export function getTotalMonthSales(dateRange) {
  let pipeline = [{
    $match: {
      "date": {
        $gte: dateRange.gte,
        $lte: dateRange.lte
      },
      "status": "complete",
      "tenantId": Session.get('tenantId')
    }
  }, {
    $unwind: "$lineItems"
  }, {
    $group: {
      _id: "_id",
      lineItemsTotal: {
        $sum: "$lineItems.total"
      },
    }
  }, {
    $group: {
      _id: null,
      total: {
        $sum: "$lineItemsTotal"
      },
    }
  }, {
    "$addFields": {
      "total": { $toDouble: "$total" },
    },
  }];
  // console.log(JSON.stringify(pipeline))
  return runAggregate('customerInvoices', pipeline);
}

export function getIncomeStatementDataSubtractDebit(match, year, monthIndex, slice) {
  if (!('tenantId' in match)) {
      match['tenantId'] = Session.get('tenantId');
  }
  let pipeline = [
    {
      "$match": match
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "description": 1,
        "totals": 1
      }
    },
    {
      "$unwind": "$totals"
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": "$totals.year",
        "beginningBalance": "$totals.beginningBalance",
        "debitAmounts": {
          "$slice": [
            "$totals.debitAmounts",
            monthIndex,
            slice
          ]
        },
        "creditAmounts": {
          "$slice": [
            "$totals.creditAmounts",
            monthIndex,
            slice
          ]
        }
      }
    },
    {
      "$match": {
        "year": {
          "$in": [
            parseInt(year)
          ]
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": 1,
        "beginningBalance": 1,
        "debitAmounts": {
          "$reduce": {
            "input": "$debitAmounts",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this"
              ]
            }
          }
        },
        "creditAmounts": {
          "$reduce": {
            "input": "$creditAmounts",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this"
              ]
            }
          }
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": 1,
        "balance": {
          "$add": [
            {
              "$subtract": [
                "$beginningBalance",
                "$creditAmounts"
              ]
            },
            "$debitAmounts"
          ]
        }
      }
    },
    {
      "$group": {
        "_id": "000",
        "total": {
          "$sum": "$balance"
        },
      }
    },
    {
      $addFields: {
        "total": { $toDouble: "$total" },
      },
    },
  ];
  // console.log(year, monthIndex, slice, JSON.stringify(pipeline))
  // console.log(runAggregate('ledgerAccounts', pipeline))
  return runAggregate('ledgerAccounts', pipeline);
}

export function getIncomeStatementDataSubtractCredit(match, year, monthIndex, slice) {
  if (!('tenantId' in match)) {
      match['tenantId'] = Session.get('tenantId');
  }

  let pipeline = [
    {
      "$match": match
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "description": 1,
        "totals": 1
      }
    },
    {
      "$unwind": "$totals"
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": "$totals.year",
        "beginningBalance": "$totals.beginningBalance",
        "debitAmounts": {
          "$slice": [
            "$totals.debitAmounts",
            monthIndex,
            slice
          ]
        },
        "creditAmounts": {
          "$slice": [
            "$totals.creditAmounts",
            monthIndex,
            slice
          ]
        }
      }
    },
    {
      "$match": {
        "year": {
          "$in": [
            parseInt(year)
          ]
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": 1,
        "beginningBalance": 1,
        "debitAmounts": {
          "$reduce": {
            "input": "$debitAmounts",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this"
              ]
            }
          }
        },
        "creditAmounts": {
          "$reduce": {
            "input": "$creditAmounts",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this"
              ]
            }
          }
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": 1,
        "balance": {
          "$add": [
            {
              "$subtract": [
                "$beginningBalance",
                "$debitAmounts"
              ]
            },
            "$creditAmounts"
          ]
        }
      }
    },
    {
      "$group": {
        "_id": "000",
        "total": {
          "$sum": "$balance"
        },
      }
    },
    {
      $addFields: {
        "total": { $toDouble: "$total" },
      },
    },
  ];
  // console.log(year, monthIndex, slice, JSON.stringify(pipeline))
  // console.log(runAggregate('ledgerAccounts', pipeline))
  return runAggregate('ledgerAccounts', pipeline);
}

export function getTotalCost(dateRange) {
  let pipeline = [{
    $match: {
      "date": {
        $gte: dateRange.gte,
        $lte: dateRange.lte
      },
      "status": "complete",
      "tenantId": Session.get('tenantId')
    }
  }, {
    $unwind: "$lineItems"
  }, {
    $group: {
      _id: "$lineItems.productId",
      totalAmount: {
        $sum: { $multiply: ["$lineItems.cost", "$lineItems.qtyShipped"] }
      },
    }
  }, {
    $group: {
      _id: "_id",
      total: {
        $sum: "$totalAmount"
      },
    }
  }, {
    "$addFields": {
      "total": { $toDouble: "$total" },
    },
  }];
  return runAggregate('customerInvoices', pipeline);
}

export function getExpenses(year, monthIndex, slice) {
  let pipeline = [
    {
      "$match": {
        'status': 'active',
        "number": {
          "$gte": "7000-00",
          "$lte": "7999-00"
        },
        "tenantId": Session.get('tenantId')
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "description": 1,
        "totals": 1
      }
    },
    {
      "$unwind": "$totals"
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": "$totals.year",
        "beginningBalance": "$totals.beginningBalance",
        "debitAmounts": {
          "$slice": [
            "$totals.debitAmounts",
            monthIndex,
            slice
          ]
        },
        "creditAmounts": {
          "$slice": [
            "$totals.creditAmounts",
            monthIndex,
            slice
          ]
        }
      }
    },
    {
      "$match": {
        "year": {
          "$in": [
            parseInt(year)
          ]
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": 1,
        "beginningBalance": 1,
        "debitAmounts": {
          "$reduce": {
            "input": "$debitAmounts",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this"
              ]
            }
          }
        },
        "creditAmounts": {
          "$reduce": {
            "input": "$creditAmounts",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this"
              ]
            }
          }
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": 1,
        "balance": {
          "$add": [
            {
              "$subtract": [
                "$beginningBalance",
                "$creditAmounts"
              ]
            },
            "$debitAmounts"
          ]
        }
      }
    },
    {
      "$group": {
        "_id": "000",
        "total": {
          "$sum": "$balance"
        },
      }
    },
    {
      $addFields: {
        "total": { $toDouble: "$total" },
      },
    },
  ];
  // console.log(year, monthIndex, slice, JSON.stringify(pipeline))
  // console.log(runAggregate('ledgerAccounts', pipeline))
  return runAggregate('ledgerAccounts', pipeline);
}

export async function ppv(year, monthIndex, slice) {
  let pipeline = [
    {
      "$lookup": {
        "from": "categories",
        "localField": "_id",
        "foreignField": "purchasePriceVarianceAccountId",
        "as": "categories"
      }
    },
    { $match: { $or: [{ categories: { $gt: [] } }, { _id: 'xr68GcP2smE1btvCR', tenantId: Session.get('tenantId') }] } },
    {
      "$project": {
        "_id": 1,
        "totals": "$totals"
      }
    },
    {
      "$unwind": "$totals"
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": "$totals.year",
        "beginningBalance": "$totals.beginningBalance",
        "debitAmounts": {
          "$slice": [
            "$totals.debitAmounts",
            monthIndex,
            slice
          ]
        },
        "creditAmounts": {
          "$slice": [
            "$totals.creditAmounts",
            monthIndex,
            slice
          ]
        }
      }
    },
    {
      "$match": {
        "year": {
          "$in": [
            parseInt(year)
          ]
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": 1,
        "beginningBalance": 1,
        "debitAmounts": {
          "$reduce": {
            "input": "$debitAmounts",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this"
              ]
            }
          }
        },
        "creditAmounts": {
          "$reduce": {
            "input": "$creditAmounts",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this"
              ]
            }
          }
        }
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "year": 1,
        "balance": {
          "$add": [
            {
              "$subtract": [
                "$beginningBalance",
                "$creditAmounts"
              ]
            },
            "$debitAmounts"
          ]
        }
      }
    },
    {
      "$group": {
        "_id": "000",
        "total": {
          "$sum": "$balance"
        }
      }
    },
    {
      $addFields: {
        "total": { $toDouble: "$total" },
      },
    },
  ]
  let ppv = await runAggregate('ledgerAccounts', pipeline).catch(error => console.log(error));
  
  // let match: any = [{ '$match': { _id: 'xr68GcP2smE1btvCR' } }, {"$project": {"_id": 1, "totals": "$totals"}}];
  // pipeline = pipeline.slice(5);
  // pipeline = match.concat(pipeline);

  // let boxingPpv = await runAggregate('ledgerAccounts', pipeline);
  // let result = { result: [{ total: ppv['result'][0].total + boxingPpv['result'][0].total }]};
  return ppv;
}

export function getTotalMonthCost(dateRange) {
  let pipeline = [{
    $match: {
      "date": {
        $gte: dateRange.gte,
        $lte: dateRange.lte
      },
      "status": "complete",
      "tenantId": Session.get('tenantId')
    }
  }, {
    $unwind: "$lineItems"
  }, {
    $group: {
      _id: "$lineItems.productId",
      totalAmount: {
        $sum: { $multiply: ["$lineItems.cost", "$lineItems.qtyShipped"] }
      },
    }
  }, {
    $group: {
      _id: "_id",
      total: {
        $sum: "$totalAmount"
      },
    }
  }, {
    "$addFields": {
      "total": { $toDouble: "$total" },
    },
  }];
  return runAggregate('customerInvoices', pipeline);
}

export function getMarsInventory(dateRange, monthSlice, year, yearlySlice) {
  let pipeline = [
    {
      "$match": {
        "displayOnMarsCard": true,
        "tenantId": Session.get('tenantId')
      }
    },
    {
      "$lookup": {
        "from": "products",
        "localField": "productId",
        "foreignField": "_id",
        "as": "product"
      }
    },
    {
      "$unwind": {
        "path": "$product"
      }
    },
    {
      "$project": {
        "_id": 1,
        "productId": 1,
        "totals": 1,
        "productName": "$product.name",
        "beginningBalance": 1,
        "alias": 1,
      }
    },
    {
      "$lookup": {
        "from": "customerInvoices",
        "let": {
          "prodId": "$productId"
        },
        "pipeline": [
          {
            "$match": {
              'customerId': 'diAoZWL4GZobpJ0Tp',
              "date": {
                "$gte": dateRange.gte,
                "$lte": dateRange.lte
              }
            }
          },
          { $unwind: '$lineItems' },
          {
            "$project": {
              "_id": 1,
              "productId": "$lineItems.productId",
              qtyShipped: '$lineItems.qtyShipped'
            }
          },
          {
            "$match": {
              "$expr": {
                "$eq": [
                  "$productId",
                  "$$prodId"
                ]
              }
            }
          },
          { $group: { _id: '$productId', qtyShipped: { $sum: '$qtyShipped' } } }
        ],
        "as": "purchased"
      }
    },
    {
      "$lookup": {
        "from": "customerInvoices",
        "let": {
          "prodId": "$productId"
        },
        "pipeline": [
          {
            "$match": {
              'customerId': 'diAoZWL4GZobpJ0Tp',
              "date": {
                "$gte": dateRange.gteYearly,
                "$lte": dateRange.lteYearly
              }
            }
          },
          { $unwind: '$lineItems' },
          {
            "$project": {
              "_id": 1,
              "productId": "$lineItems.productId",
              qtyShipped: '$lineItems.qtyShipped'
            }
          },
          {
            "$match": {
              "$expr": {
                "$eq": [
                  "$productId",
                  "$$prodId"
                ]
              }
            }
          },
          { $group: { _id: '$productId', qtyShipped: { $sum: '$qtyShipped' } } }
        ],
        "as": "purchasedYearly"
      }
    },
    {
      $unwind: {
        "path": "$purchased",
        "preserveNullAndEmptyArrays": true
      } 
    },
    {
      "$unwind": {
        "path": "$purchasedYearly",
        "preserveNullAndEmptyArrays": true
      }
    },
    {
      "$project": {
        "_id": 1,
        "productId": 1,
        "totals": 1,
        "productName": 1,
        "purchased": {
          "$ifNull": [
            "$purchased.qtyShipped",
            0
          ]
        },
        "purchasedYearly": {
          "$ifNull": [
            "$purchasedYearly.qtyShipped",
            0
          ]
        },
        "beginningBalance": 1,
        "alias": 1,
      }
    },
    {
      "$unwind": { path: "$totals", includeArrayIndex: "arrayIndex" }
    },
    {
      "$match": {
        "totals.year": {
          "$lte": year
        }
      }
    },

//
    {
      "$group": {
        "_id": "$_id",
        "productId": {
          "$first": "$productId"
        },
        "productName": {
          "$first": "$productName"
        },
        "purchasedYearly": {
          "$first": "$purchasedYearly"
        },
        "purchased": {
          "$first": "$purchased"
        },
        "arrayIndex": {
          "$max": "$arrayIndex"
        },
        year: { $max: "$totals.year" },
        "totals": {
          "$addToSet": "$totals.soldPerState"
        },
        "beginningBalance": {
          "$first": "$beginningBalance"
        },
        "alias": {
          "$first": "$alias"
        }
      }
    },
    {
      "$addFields": {
        "totals": {
          "$reduce": {
            "input": "$totals",
            "initialValue": [],
            "in": {
              "$concatArrays": [
                "$$this",
                "$$value"
              ]
            }
          }
        }
      }
    },
    {
      "$group": {
        "_id": "$_id",
        "productId": {
          "$first": "$productId"
        },
        "productName": {
          "$first": "$productName"
        },
        "purchased": {
          "$first": "$purchased"
        },
        "year": {
          "$first": "$year"
        },
        "purchasedYearly": {
          "$first": "$purchasedYearly"
        },
        "arrayIndex": {
          "$max": "$arrayIndex"
        },
        "totals": {
          "$first": { soldPerState: "$totals" }
        },
        "beginningBalance": {
          "$first": "$beginningBalance"
        },
        "alias": {
          "$first": "$alias"
        }
      }
    },
//
    {
      "$project": {
        "_id": 1,
        'arrayIndex': 1,
        "productId": 1,
        "productName": 1,
        "year": "$totals.year",
        "purchased": 1,
        "purchasedYearly": 1,
        "amountSold": {
          "$slice": [
            "$totals.soldPerState",
            yearlySlice,
            1
          ]
        },
        "amountSoldYearly": {
          "$slice": [
            "$totals.soldPerState",
            0,
            ...(yearlySlice === 0 ? [yearlySlice + 1] : [yearlySlice]),
            // monthSlice
            // { $add: [monthSlice, 1]}
          ]
        },
        "beginningBalance": 1,
        "alias": 1,
      }
    },
    { '$unwind': '$amountSold' },
    {
      "$project": {
        "_id": '$productId',
        'documentId': "$_id",
        "arrayIndex": 1,
        "productName": 1,
        "year": 1,
        "purchased": {
          "$ifNull": [
            "$purchased", 0
          ]
        },
        "purchasedYearly": 1,
        "amountSoldYearly": 1,
        "sold": {
          "$reduce": {
            "input": "$amountSold",
            "initialValue": 0,
            "in": {
              "$add": [
                "$$value",
                "$$this.total"
              ]
            }
          }
        },
        "beginning": '$beginningBalance',
        "alias": 1,
      }
    }, 
    {
      "$unwind": "$amountSoldYearly"
    },
    {"$addFields": {"soldRangeTotal": {
          "$reduce": {
            "input": "$amountSoldYearly",
            "initialValue": 0,
            "in": {
                "$add": [
                  "$$value",
                  "$$this.total"
                ]
            }
          }
      }}},
    {
      "$group": {
        "_id": "$_id",
        "productName": {
          "$first": "$productName"
        },
        "purchased": {
          "$first": "$purchased"
        },
        "purchasedYearly": {
          "$first": "$purchasedYearly"
        },
        "arrayIndex": {
          "$first": "$arrayIndex"
        },
        "year": {
          "$first": "$year"
        },
        "documentId": {
          "$first": "$documentId"
        },
        "sold": {
          "$max": "$sold"
        },
        "soldRangeTotal": {
           "$sum": "$soldRangeTotal"
        },   
        "beginning": {
          "$first": "$beginning"
        },
        "alias": {
          "$first": "$alias"
        }
      }
    },
    {
      "$addFields": {
        "beginning": {
          "$cond": [
            {
              "$and": [
                {
                  "$eq": [
                    2018,
                    year
                  ]
                },
                {
                  "$eq": [
                    0,
                    monthSlice
                  ]
                }
              ]
            },
            '$beginning',
            {
              "$add": [
                {
                  "$subtract": [
                    "$purchasedYearly",
                    "$soldRangeTotal"
                  ]
                },
                "$beginning"
              ]
            }
          ]
        }

      }
    },
    {
      "$addFields": {
        "purchased": { $toDouble: "$purchased" },
        "purchasedYearly": { $toDouble: "$purchasedYearly" },
        "beginning": { $toDouble: "$beginning" },
      },
    },
  ];
  // console.log(JSON.stringify(pipeline));
  return runAggregate('systemOptions', pipeline);
}

export function countInvoices(dateRange) {
  let pipeline = [{
    $match: {
      "date": {
        $gte: dateRange.gte,
        $lte: dateRange.lte
      },
      "status": "complete",
      "tenantId": Session.get('tenantId')
    }
  },
    {
      $group: {
        _id: "_id",
        count: { $sum: 1 }
      }
    }];
  return runAggregate('customerInvoices', pipeline);
}

export function projectedFutureSales(dateRange) {
  let pipeline = [
    {
      "$match": {
        "date": {
          "$gte": dateRange.gte,
          "$lte": dateRange.lte,
        },
        "tenantId": Session.get('tenantId')
      }
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "lineItems": 1
      }
    },
    {
      "$unwind": "$lineItems"
    },
    {
      "$project": {
        "_id": 1,
        "number": 1,
        "categoryId": "$lineItems.categoryId",
        "total": "$lineItems.total"
      }
    },
    {
      "$group": {
        "_id": "$categoryId",
        "total": {
          "$sum": "$total"
        }
      }
    },

    {
      "$lookup": {
        "from": "categories",
        "localField": "_id",
        "foreignField": "_id",
        "as": "categories"
      }
    },
    {
      "$unwind": "$categories"
    },
    {
      "$project": {
        "_id": 1,
        "total": 1,
        "ledgerId": "$categories.inventoryLedgerAccountId",
        "category": "$categories.category"
      }
    }, {
      "$lookup": {
        "from": "ledgerAccounts",
        "localField": "ledgerId",
        "foreignField": "_id",
        "as": "ledgerAccount"
      }
    },
    {
      "$unwind": {
        "path": "$ledgerAccount",
        "preserveNullAndEmptyArrays": true
      }
    },
    {
      "$match": {
        "ledgerAccount.number": {
          "$gte": "1600-00",
          "$lte": "1699-00"
        }
      }
    },
    {
      "$group": {
        "_id": "$ledgerId",
        "total": {
          "$sum": "$total"
        }
      }
    },
    {
      "$group": {
        "_id": "000",
        "total": {
          "$sum": "$total"
        }
      }
    },
    {
      "$addFields": {
        "total": { $toDouble: "$total" },
      },
    },
  ];
  // console.log('customerInvoices', JSON.stringify(pipeline));
  return runAggregate('customerInvoices', pipeline);
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function _sort(arr, sortBy) {
  let newArr = arr.slice();
  newArr.sort((a, b) => {
    const nameA = a[sortBy].toUpperCase(); // ignore upper and lowercase
    const nameB = b[sortBy].toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
  return newArr;
}

export function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
  try {
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;
    const negativeSign = amount < 0 ? true : false;
    let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
    let j = (i.length > 3) ? i.length % 3 : 0;
    let number = (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - parseInt(i)).toFixed(decimalCount).slice(2) : "");
    return negativeSign ? '($' + number + ')' : '$' + number;
  } catch (e) {
    console.log(e)
  }
};

export function getUpdatedContractProducts(contractId, categoryIds, increasePercentage) {
  return callbackToPromise(MeteorObservable.call('getUpdatedContractProducts', contractId, categoryIds, increasePercentage));
}

export function getContractProductsById(contractId) {
  return callbackToPromise(MeteorObservable.call('getContractProductsById', contractId));
}

export function convertToArrayIfIsString(str) {
  if (typeof str == 'string') {
    return [str];
  } else {
    return str;
  }
}

export function testlog(...log) {
  if (Meteor.settings.public.isTestWebsite) {
    console.log(...log);
  }
}

export function templateObj() {
  return {
    _id: Random.id(),
    createdUserId: Meteor.userId(),
    createdAt: new Date()
  }
}