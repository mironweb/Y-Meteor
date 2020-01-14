/*
* exported functions with _ before each function name must return something
* */
import * as moment from 'moment-timezone';
import * as funcs from './common';
import * as _ from "underscore";

declare let lookup: any;

export async function reportPdf(pdfContent, groupArray, sortArray) {
  lookup = pdfContent.lookup;
  let groupedAndSorted, resultWithTotals
  if (pdfContent.lookup.displayedColumns) {
    pdfContent.lookup.dataTable.columns = pdfContent.lookup.columns.filter(function (item) { return pdfContent.lookup.displayedColumns.indexOf(item.prop) > -1 });
  }
  if (sortArray.length > 0 || groupArray.length > 0) {
    groupedAndSorted = await func1(pdfContent, groupArray, sortArray);
    //IF TOTALED
    if (lookup['totalLogic']) {
      resultWithTotals = await func2(groupedAndSorted);
      pdfContent.result = resultWithTotals;
     
    }
    if (groupArray.length > 0){
      let formatted = formatAndReorder(pdfContent, groupArray)
      pdfContent.result = formatted.result;
      pdfContent.lookup.dataTable.columns = formatted.columns;
    }
  }

  let dd = finishPdf(pdfContent);
  return dd;
}

async function func1(pdfContent, groupArray, sortArray) {
  
  if (sortArray.length > 0) {
    let sort = await normalSort(pdfContent.result, sortArray);
    pdfContent.result = sort;
  }
  if (groupArray.length > 0) {
    let group = groupFunctions(pdfContent, groupArray)
    pdfContent.result = group;
  }
  
  return pdfContent
}
async function func2(result) {
  let totalResults = await groupTotals(result.result)
  return totalResults;
}

function formatAndReorder(pdfContent, groupOrderArray){
  let result = formatGroupedResults(pdfContent.result, groupOrderArray);
  let columns = reorderColumns(pdfContent.lookup.dataTable.columns, groupOrderArray);
  let groupObj = {
    result: result,
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
  let totals = contents.totals;
  let date = (contents.date) ? ' (' + moment(contents.date).format("MM/DD/YYYY") + ')' : ''

  // let columnHeaders = [{ text: title, style: 'header', alignment: 'left', border: [false, false, false, false] }, {}, {}, {}, {}, {}, {}, {}, {}, date]
  let reportTitle = [];
  let columnTitles = [];
  let rows = [];
  let rowFontSize = 8;
  let rowSpecificInfo = [];
  let hiddenColumns = [];
  columns.forEach(element => {
    if (element.hidden !== true) {
      let alignment = element.reportAlignment ? element.reportAlignment : 'center';
      let reportTotal = element.reportTotalName ? element.reportTotalName : null;
      reportTitle.push({});
      columnTitles.push({ text: element.reportColumnName, fontSize: 9, alignment: alignment, border: [false, false, false, true] });
      rowSpecificInfo.push({ prop: element.prop, alignment: alignment, total: reportTotal, type: element.type })
    } else {
      hiddenColumns.push(element.prop)
    }
  });
  reportTitle.splice(0, 1, { text: title + date, style: 'header', colSpan: reportTitle.length, alignment: 'left', border: [false, false, false, false] });
  body.push(reportTitle, columnTitles);
  results.forEach(element => {
    let row = [];
    rowSpecificInfo.forEach(rowInfo => {
      let text = element[rowInfo.prop];
      if (!_.contains(hiddenColumns, rowInfo.prop)) {
        if ((element[rowInfo.prop] instanceof Date || rowInfo.type === 'date') && element[rowInfo.prop] !== undefined) {
          text = moment(element[rowInfo.prop]).isValid() ? moment(element[rowInfo.prop]).format("MM/DD/YYYY") : element[rowInfo.prop];
        } else {
          if (element[rowInfo.prop] !== null && element[rowInfo.prop] !== undefined) {
            text = (typeof element[rowInfo.prop] == 'number') ? element[rowInfo.prop].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : element[rowInfo.prop];
          } else {
            text = "";
          }
        }
        if ('_id' in element && element['_id'] === '000') {
          if (rowInfo.total) {
            row.push({ text: element[rowInfo.prop].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: rowFontSize, bold: true, alignment: rowInfo.alignment, margin: [0, 0, 0, 0], border: [false, true, false, true] })
          } else {
            row.push({ text: '', alignment: rowInfo.alignment, bold: true, fontSize: rowFontSize, margin: [0, 0, 0, 0], border: [false, false, false, false] })
          }
        } else {
          row.push({ text: text, alignment: rowInfo.alignment, fontSize: rowFontSize, border: [false, false, false, false] })
        }
      }
    });
    body.push(row);
  });

  if (totals) {
    let rowTotal = [];
    rowSpecificInfo.forEach(rowInfo => {
      if (rowInfo.total) {
        rowTotal.push({ text: totals[rowInfo.total].toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","), fontSize: rowFontSize, bold: true, alignment: rowInfo.alignment, margin: [0, 0, 0, 0], border: [false, true, false, true] })
      } else {
        rowTotal.push({ text: '', alignment: rowInfo.alignment, bold: true, fontSize: rowFontSize, margin: [0, 0, 0, 0], border: [false, false, false, false] })
      }
    });
    body.push(rowTotal);
  }
  return body;
}

function generateColumnWidths(contents) {
  let columns = contents.lookup.dataTable.columns;
  let columnArr = [];
  columns.forEach(element => {
    if (element.hidden !== true) {
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
  return grouped;
}

function checkType(text) {
  return text instanceof Date ? moment(text).format("MM/DD/YYYY") : text;
}

function formatGroupedResults(groupedArray, groupByArray) {
  let expandedArray = [];
  for (let group of groupedArray){
    expandedArray.push({ [groupByArray[0]]: group[groupByArray[0]]})
    if (group['items']) {
      group['items'].forEach(item => {
        for (let i = 0; i < groupByArray.length; i++) {
          delete item[groupByArray[i]]
        }
        expandedArray.push(item);
      });
      if (group['totals']) {
        expandedArray.push(group['totals'])
      }
    }

    if (groupByArray[1]) {
      group[groupByArray[1]].forEach(secondGroup => {
        expandedArray.push({ [groupByArray[1]]: secondGroup[groupByArray[1]] });
        if (secondGroup['items']) {
          secondGroup['items'].forEach(item => {
            for (let i = 0; i < groupByArray.length; i++) {
              delete item[groupByArray[i]]
            }
            expandedArray.push(item);
          });
          expandedArray.concat(secondGroup['items'])
          if (secondGroup['totals']) {
            expandedArray.push(secondGroup['totals'])
          }
        } else if (secondGroup[groupByArray[2]]) {
          secondGroup[groupByArray[2]].forEach(thirdGroup => {
            expandedArray.push({ [groupByArray[2]]: thirdGroup[groupByArray[2]] });
            if (thirdGroup['items']) {
              thirdGroup['items'].forEach(item => {
                for (let i = 0; i < groupByArray.length; i++) {
                  delete item[groupByArray[i]]
                }
                expandedArray.push(item);
              });
              expandedArray.concat(thirdGroup['items'])
              if (thirdGroup['totals']) {
                expandedArray.push(thirdGroup['totals'])
              }
            }
          });
        }
      });
    }
    // if (group['totals']) {
    //   expandedArray.push(group['totals'])
    // }
  };
  return expandedArray;
}

function reorderColumns(columns, groupArray) {
  for (let i = groupArray.length; i--;){
    let index = columns.findIndex(column => column.prop === groupArray[i]);
    let element = columns[index];
    columns.splice(index, 1);
    columns.splice(0, 0, element);
  }
  return columns;
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
  for (let res of result) {
    let finalResults = []
    let group = res
    let groupedItems = await findObjects(group, finalResults);
    for (let grouped of groupedItems) {
      let x = await getGroupedTotal(grouped['items']);
      grouped['totals'] = x['result'][0];
    }
    returnGroups.push(res)
  }
  if (returnGroups) {
    return returnGroups;
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
  let pipeline, groupTotal;
  let totalLogic = funcs.parseAll(lookup['totalLogic'], {});;
  pipeline = [
    {
      "$group": {
        "_id": "groupTotalRow",
      }
    },
    {
      "$project": { items: groupedItems}
    },
    { "$unwind": '$items' },
    { "$replaceRoot": { newRoot: "$items" } },
  ]
  pipeline = pipeline.concat(totalLogic[0])

  return await funcs.runAggregate(lookup.methods[0]['collectionName'], pipeline);
}
