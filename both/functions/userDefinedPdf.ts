/*
* exported functions with _ before each function name must return something
* */
import * as moment from 'moment-timezone';
import * as funcs from './common';
import * as _ from "underscore";

declare let lookup: any;

export async function userDefinedPdf(pdfContent, groupArray, sortArray) {
  lookup = pdfContent.lookup;
  let groupedAndSorted, resultWithTotals

  if (pdfContent.lookup.displayedColumns) {
    pdfContent.lookup.displayedColumns = _.uniq([...pdfContent.lookup.displayedColumns, ...groupArray, ...sortArray]);
    pdfContent.lookup.dataTable.columns = pdfContent.lookup.columns.filter(function (item) { return pdfContent.lookup.displayedColumns.indexOf(item.prop) > -1 });
  }
  
  if (sortArray.length > 0 || groupArray.length > 0) {
    groupedAndSorted = await func1(pdfContent, groupArray, sortArray);
    //IF TOTALED
    if (lookup['totalLogic']) {
      resultWithTotals = await func2(groupedAndSorted);
      pdfContent.result = resultWithTotals.returnGroups;
      pdfContent._grandTotal = resultWithTotals._grandTotal;
     
    }
    if (groupArray.length > 0){
      let formatted = await formatAndReorder(pdfContent, groupArray)
      
      pdfContent.result = formatted['result'];
      pdfContent.lookup.dataTable.columns = formatted['columns'];
    }
  }
  
  let dd = finishPdf(pdfContent);
  return dd;
}

async function func1(pdfContent, groupArray, sortArray) {
  
  if (sortArray.length > 0) {
    let sort = await normalSort(pdfContent.result, sortArray);
    pdfContent.result = sort;
    pdfContent.sortArray = sortArray;
  }
  if (groupArray.length > 0) {
    let group = groupFunctions(pdfContent, groupArray)
    pdfContent.result = group;
    pdfContent.groupArray = groupArray;
  }
  // console.log('func1 return >', pdfContent);
  
  return pdfContent
}
async function func2(result) {
  let totalResults = await groupTotals(result.result)
  // console.log('^^^^^',totalResults);
  // console.log('func2 return >', totalResults);
  return totalResults;
}

async function formatAndReorder(pdfContent, groupOrderArray){
  let result = await formatGroupedResults(pdfContent.result, groupOrderArray);
  let columns = reorderColumns(pdfContent.lookup.dataTable.columns, groupOrderArray);
  let groupObj = {
    result: result['expandedArray'],
    columns: columns
  }
  return groupObj;
}

function finishPdf(pdfContent) {
  
  let dd = {
    pageOrientation: 'landscape',
    footer: function (currentPage, pageCount) {
      return {
        margin: [20, 10, 20, 0],
        fontSize: 10,
        columns: [
          {
            text: currentPage.toString() + ' of ' + pageCount
          },
          {
            text: moment().format("MM/DD/YYYY h:mma"),
            alignment: 'right',
          }
        ]
      }
    },
    content: [
      {
        style: 'tableExample',
        table: {
          headerRows: 2,
          widths: generateColumnWidths(pdfContent),
          body: generateTableBody(pdfContent),
        }
      },
    ],
    styles: {
      header: {
        fontSize: 16,
        bold: false,
        margin: [0, 0, 0, 10],
        color: 'black',
        // alignment: 'center'
      },
      subheader: {
        alignment: 'center',
        fontSize: 14,
        bold: false,
        // margin: [40],
        color: 'white',
        fillColor: '#c25113'
      },
      tableExample: {
        margin: [0, 5, 0, 15],
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'black',
        alignment: 'center',
        fillColor: '#dedede'
      },
      branding: {
        // width: '*',
        fillColor: '#c25113',
        background: '#c25113',
        color: 'white',
        alignment: 'left'
      }
    },
  }
  return dd;
}

function generateTableBody(contents) {
  let body = []
  let title = contents.lookup.dataTable.options.reportTitle;
  let columns = contents.lookup.dataTable.columns;
  let results = contents.result;
  let grandTotal = contents._grandTotal;
  let totals = contents.totals;
  let date = (contents.date) ? ' (' + moment(contents.date).format("MM/DD/YYYY") + ')' : '';
  let groupArray = contents.groupArray ? contents.groupArray : [];
  let sortArray = contents.sortArray ? contents.sortArray : [];

  // let columnHeaders = [{ text: title, style: 'header', alignment: 'left', border: [false, false, false, false] }, {}, {}, {}, {}, {}, {}, {}, {}, date]
  let reportTitle = [];
  let columnTitles = [];
  let rows = [];
  let rowSpecificInfo = [];
  let hiddenColumns = [];
  let rowlimit = 30;
  let rowFontSize = 8;
  columns.forEach(element => {
    if (element.hidden !== true || (groupArray.includes(element.prop) || sortArray.includes(element.prop))) {
      let alignment = element.reportAlignment ? element.reportAlignment : 'center';
      let reportTotal = element.reportTotalName ? element.reportTotalName : null;
      let diffColumn = element.diffColumn ? element.diffColumn : false;
      reportTitle.push({});
      columnTitles.push({ text: element.reportColumnName, fontSize: 10, alignment: alignment, border: [false, false, false, true] });
      rowSpecificInfo.push({ prop: element.prop, alignment: alignment, total: reportTotal, type: element.type, diffColumn })
    } else {
      hiddenColumns.push(element.prop)
    }
  });
  reportTitle.splice(0, 1, { text: title + date, style: 'header', colSpan: reportTitle.length, alignment: 'left', border: [false, false, false, false] });
  body.push(reportTitle, columnTitles);

  let currentMainHeader;
  for (let rowIndex = 0; rowIndex < results.length; rowIndex++) {
    const element = results[rowIndex];
      
    if (groupArray.length > 0){
      if ('_groupRowHeaderMain' in element){
        currentMainHeader = element;
      }
      if (rowlimit <= 0) {
        results.splice((rowIndex + 1), 0, currentMainHeader)
        rowlimit = 30;
      } else {
        rowlimit -= 1;
      }
    }


    let row = [];
    // console.log('@*@*@*@*',element)
    if ('_groupRowHeader' in element || '_groupRowHeaderMain' in element) {
      rowSpecificInfo.forEach((rowInfo, index) => {
        if (rowInfo.prop in element){
          row.push({ text: element[rowInfo.prop], colSpan: (rowSpecificInfo.length - index), alignment: rowInfo.alignment, fontSize: rowFontSize, border: [false, false, false, false] })
        } else {
          row.push({ text: '', fontSize: rowFontSize, border: [false, false, false, false]})
        }
      })
    } else {
      rowSpecificInfo.forEach((rowInfo, index) => {
        let text = element[rowInfo.prop];
        let color = 'black';
        if (rowInfo.diffColumn) {
          color = text > 0 ? 'green': 'red';
        }
        if (!_.contains(hiddenColumns, rowInfo.prop)) {
          if ((element[rowInfo.prop] instanceof Date || rowInfo.type === 'date') && element[rowInfo.prop] !== undefined) {
            text = moment(element[rowInfo.prop]).isValid() ? moment(element[rowInfo.prop]).format("MM/DD/YYYY") : element[rowInfo.prop];
          } else {
            if (element[rowInfo.prop] !== null && element[rowInfo.prop] !== undefined) {
              text = (typeof element[rowInfo.prop] == 'number') ? funcs.formatMoney(element[rowInfo.prop]) : element[rowInfo.prop];
            } else {
              text = "";
            }
          }
          if ('_id' in element && element['_id'] === '000') {
            if (rowInfo.total) {
              let borders = element['totalFormat'] ? [false, true, false, true] : [false, false, false, false];
              row.push({ text: funcs.formatMoney(element[rowInfo.prop]), color: color, fontSize: rowFontSize, bold: true, alignment: rowInfo.alignment, margin: [0, 0, 0, 0], border: borders })
            } else {
              row.push({ text: '', alignment: rowInfo.alignment, bold: true, color: color, fontSize: rowFontSize, margin: [0, 0, 0, 0], border: [false, false, false, false] })
            }
          } else {
            row.push({ text: text, alignment: rowInfo.alignment, color: color, fontSize: rowFontSize, border: [false, false, false, false] })
          }
        }
      });
    }
    // console.log(row);
    
    body.push(row);
  };

  if (totals) {
    let rowTotal = [];
    rowSpecificInfo.forEach((rowInfo, index) => {
      if (rowInfo.total) {
        rowTotal.push({ text: funcs.formatMoney(totals[rowInfo.total]), fontSize: rowFontSize, bold: true, alignment: rowInfo.alignment, margin: [0, 0, 0, 0], border: [false, true, false, true] })
      } else {
        rowTotal.push({ text: '', alignment: rowInfo.alignment, bold: true, fontSize: rowFontSize, margin: [0, 0, 0, 0], border: [false, true, false, true] })
      }
    });
    body.push(rowTotal);
  }

  if (grandTotal) {
    let rowTotal = [];
    rowSpecificInfo.forEach((rowInfo, index) => {
      let color = 'black';
      if (rowInfo.diffColumn) {
        color = grandTotal[rowInfo.total] > 0 ? 'green' : 'red';
      }
      if (rowInfo.total) {
        rowTotal.push({ text: funcs.formatMoney(grandTotal[rowInfo.total]), fontSize: rowFontSize, color: color, bold: true, alignment: rowInfo.alignment, margin: [0, 0, 0, 0], border: [false, true, false, true] })
      } else {
        rowTotal.push({ text: (index == 0 ? "Report Totals" : ''), alignment: rowInfo.alignment, bold: true, fontSize: rowFontSize, margin: [0, 0, 0, 0], border: [false, false, false, false] })
      }
    });
    body.push(rowTotal);
  }

  return body;
}

function generateColumnWidths(contents) {
  let columns = contents.lookup.dataTable.columns;
  let groupArray = contents.groupArray ? contents.groupArray : [];
  let sortArray = contents.sortArray ? contents.sortArray : [];
  
  let columnArr = [];
  columns.forEach(element => {
    if (element.hidden !== true || (groupArray.includes(element.prop) || sortArray.includes(element.prop))) {
      let width = element.reportColumnWidth ? element.reportColumnWidth : '*';
      columnArr.push(width);
    }
  });
  
  return columnArr;
}

function groupAndMap(items, itemKey, childKey, predic?) {
  let grouped = _.map(
    _.groupBy(items, itemKey), (obj, key) => ({
      [itemKey]: checkType(key),
      [childKey]: (predic && predic(obj)) || obj
    }),
  )

  // console.log(grouped);
  return grouped;
}

function checkType(text) {
  return text instanceof Date ? moment(text).format("MM/DD/YYYY") : text;
}

function formatGroupedResults(groupedArray, groupByArray) {
  let expandedArray = [];
  let keys = [];
  for (let group of groupedArray){
    expandedArray.push({ [groupByArray[0]]: group[groupByArray[0]], _groupRowHeaderMain: true})
    
    keys.push(groupByArray[0]);
    if (group['items']) {
      group['items'].forEach(item => {
        for (let i = 0; i < groupByArray.length; i++) {
          delete item[groupByArray[i]]
        }
        // expandedArray.push(item);
      });
      // console.log('1',group);
      
      if (group['totals']) {
        expandedArray.push(group['totals'])
        keys = [...keys, ...Object.keys(group['totals'])]
      }
    }
    
    if (groupByArray[1]) {
      group[groupByArray[1]].forEach(secondGroup => {
        expandedArray.push({ [groupByArray[1]]: secondGroup[groupByArray[1]], _groupRowHeader: true });
        keys.push(groupByArray[1]);
        if (secondGroup['items']) {
          secondGroup['items'].forEach(item => {
            for (let i = 0; i < groupByArray.length; i++) {
              delete item[groupByArray[i]]
            }
            // expandedArray.push(item);
          });
          // expandedArray.concat(secondGroup['items'])
          // console.log('2', secondGroup);
          if (secondGroup['totals']) {
            expandedArray.push(secondGroup['totals'])
            keys = [...keys, ...Object.keys(secondGroup['totals'])]
          }
        } else if (secondGroup[groupByArray[2]]) {
          secondGroup[groupByArray[2]].forEach(thirdGroup => {
            expandedArray.push({ [groupByArray[2]]: thirdGroup[groupByArray[2]], _groupRowHeader: true });
            keys.push(groupByArray[2]);
            if (thirdGroup['items']) {
              thirdGroup['items'].forEach(item => {
                for (let i = 0; i < groupByArray.length; i++) {
                  delete item[groupByArray[i]]
                }
                // expandedArray.push(item);
              });
              // expandedArray.concat(thirdGroup['items'])
              if (thirdGroup['totals']) {
                expandedArray.push(thirdGroup['totals'])
                keys = [...keys, ...Object.keys(thirdGroup['totals'])]
              }
            }
          });
        }
      });
    }
    if (group['_firstLevelTotal']) {
      group['_firstLevelTotal']['totalFormat'] = true;
      expandedArray.push(group['_firstLevelTotal'])
    }
  };
  keys = _.uniq(keys);
  return {
    expandedArray,
    keys
  }
}

function reorderColumns(columns, groupArray) {
  let returnColumns = [];
  for (let i = 0; i < groupArray.length; i++) {
    let index = columns.findIndex(column => column.prop === groupArray[i]);
    columns.splice(index, 0, columns.splice(i, 1)[0]);
  }
  returnColumns = columns;
  return returnColumns;
}

export function groupFunctions(pdfContent, groupOrderArray){
  let result
  switch (groupOrderArray.length) {
    case 1:
      result = groupAndMap(pdfContent.result, groupOrderArray[0], "items");
      break;
    case 2:
      result = groupAndMap(pdfContent.result, groupOrderArray[0], groupOrderArray[1],
        arr => groupAndMap(arr, groupOrderArray[1], "items"));
      break;
    case 3:
      result = groupAndMap(pdfContent.result, groupOrderArray[0], groupOrderArray[1],
        arr => groupAndMap(arr, groupOrderArray[1], groupOrderArray[2],
          arr => groupAndMap(arr, groupOrderArray[2], "items")));
      break;
    default:
  }
  
  return result;
}

async function findObjects(obj, finalResults) {
  async function getObject(theObject) {
    let result = null;
    if (theObject instanceof Array) {
      for (let i = 0; i < theObject.length; i++) {
        getObject(theObject[i]);
      }
    } else {
      for (let prop in theObject) {
        if (theObject.hasOwnProperty(prop)) {
          if (prop === 'items') {
            finalResults.push(theObject);
          }
          if (theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
            getObject(theObject[prop]);
          }
        }
      }
    }
  }
  getObject(obj)
  return finalResults
}

async function groupTotals(result) {
  let returnGroups = []
  let allGroupItemArray = []
  // console.log('result', result);
  
  for (let res of result) {
    let finalResults = [];
    let group = res;
    let groupedItems = await findObjects(group, finalResults);
    // console.log('groupedItems',groupedItems);
    
    let firstGroupItems = [];
    groupedItems.map(e => firstGroupItems = [...firstGroupItems, ...e.items])
    let firstGroupTotal = await getGroupedTotal(firstGroupItems);
    res['_firstLevelTotal'] = firstGroupTotal['result'][0];
    allGroupItemArray.push(res['_firstLevelTotal']);

    for (let grouped of groupedItems) {
      let x = await getGroupedTotal(grouped['items']);
      grouped['totals'] = x['result'][0];
    }
    returnGroups.push(res)
  }
  let grandTotal = await getGroupedTotal(allGroupItemArray);

  if (returnGroups) {
    return { returnGroups, _grandTotal: grandTotal['result'][0] };
  }
}

function normalSort(rows, sortArray) {
  let sortString = "return _.chain(rows)";
  for (let i = sortArray.length; i--;) {
    sortString += '.sortBy("' + sortArray[i] + '")';
  }
  sortString += '.value()'
  let sort = new Function('rows', sortString)
  let sortedRows = sort(rows);
  return sortedRows;
}

async function getGroupedTotal(groupedItems) {
  let returnObj = {
    _id: '000'
  }
  groupedItems.forEach(element => {
    for (var key in element) {
      if (key !== '_id') {
        if (key in returnObj) {
          returnObj[key] += element[key]
        } else {
          returnObj[key] = element[key]
        }
      }
    }
  });
  return { result: [returnObj] };
}