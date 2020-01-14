/*
* exported functions with _ before each function name must return something
* */
import { MeteorObservable } from "meteor-rxjs";
import * as moment from 'moment-timezone';
import { SystemTenants } from "../collections/systemTenants.collection";
import { globalBanner } from './globalBanner';
import { trustTheG } from './logo';
import * as funcs from './common';
import * as _ from "underscore";
import { jsonize } from '@ngui/map/dist/services/util';

this.rowlimit = 47;
export function pdfContentArray(pdfObj) {
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [33, 115, 33, 65],
    header: function (currentPage, pageCount) {
      return {
        margin: [10, 8, 10, 20],
        table: {
          body: [
            [{ image: globalBanner, colSpan: 2, height: 70, width: 565, alignment: 'center', border: [false, false, false, false] }, {}],
            [{
              width: '*',
              margin: [20, 10, 0, 20],
              text: pdfObj.customer,
              bold: true,
              fontSize: 12,
              border: [false]
            }, {
              width: '*',
              alignment: 'right',
              text: `Prices effective ` + moment(new Date(pdfObj.revised)).format("MMM DD, YYYY").toString(),
              fontSize: 13,
              margin: [20, 10, 20, 20],
              border: [false]
            }]
          ]
        }
      }
    },
    footer: function (currentPage, pageCount) {
      return [
        {
          margin: [20, 10, 20, 0],
          table: {
            widths: [100, '*', 100],
            body: [
              [{ text: 'Page ' + currentPage.toString() + ' of ' + pageCount, fontSize: 8, border: [false, false, false, false] }, { image: trustTheG, width: 90, alignment: 'center', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] },],
              [{ text: '', border: [false, false, false, false] }, { text: 'Pricing subject to change without notice.', fontSize: 10, alignment: 'center', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }]
              // [{ text: '', border: [false, false, false, false] }, { text: 'Price Sheet for: ' + pdfObj.customer + "   Revised on " + pdfObj.revised, fontSize: 6, alignment: 'center', border: [false, false, false, false] }, { text: '', border: [false, false, false, false]}]
            ]
          }
        }
      ]
    },
    content: [
      _.sortBy(pdfObj.content, '_id').map((table, index) => {
        return getTables(table, index, pdfObj)
      })
    ],
    pageBreakBefore: function (currentNode) {},
    // Styles dictionary
    styles: {
      header: {
        fontSize: 18,
        bold: false,
        margin: [0, 0, 0, 10],
        color: 'black',
      },
      subheader: {
        alignment: 'center',
        bold: false,
        color: 'white',
        fillColor: '#C3622D'
      },
      tableHeader: {
        bold: true,
        fontSize: 8,
        color: 'black',
        alignment: 'center',
        fillColor: '#dedede'
      },
    },
    defaultStyle: {
      alignment: 'justify',
      font: 'arial',
      fontSize: 8,
    }
  };
  return docDefinition;
}

function getTables(table, index, pdfObj) {
  let tableRows = (table.row.length + 2);
  let pageBreak = false;
  let head = {};
  if (tableRows > this.rowlimit && index !== 0) {
    pageBreak = true;
    this.rowlimit = 45;
    this.rowlimit -= tableRows;
  } else {
    pageBreak = false;
    this.rowlimit -= tableRows;
  }
  let columnHeaders;
  let colArr = [];
  let rowArr = [];

  columnHeaders = ['Customer Part No.', 'Global Part No.', 'Description', 'Price', 'Case Qty']

  columnHeaders.map((column, index) => {
    if (index !== 3 && index !== 4) {
      colArr.push({ text: column, style: 'tableHeader', alignment: 'left', border: [true, true, true, true] })
    } else {
      colArr.push({ text: column, style: 'tableHeader', alignment: 'right', border: [true, true, true, true] })
    }
  })

  let tableBody = table.row;
  if (table.categoryDescription.split(' - ')[0] === '1950') {
    tableBody = _.sortBy(tableBody, 'description');
    let collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
    tableBody = tableBody.sort((a, b) => collator.compare(a.description, b.description))
  } 

  tableBody.map((row) => {
    let eachRowArr = [];
    let rowValue = _.values(row)

    rowValue.map((Row, index) => {
      if (index !== 3 && index !== 4) {
        eachRowArr.push({ text: Row, alignment: 'left', })
      } else {
        if (index === 3) {
          eachRowArr.push({ text: "$" + Row.toFixed(2), alignment: 'right', })
        } else if (index === 4) {
          eachRowArr.push({ text: Row, alignment: 'right', })
        }
      }
    });
    rowArr.push(eachRowArr)
  })

  rowArr.unshift(colArr)
  if (table.categoryDescription.split(' - ')[0] === '5700' || table.categoryDescription.split(' - ')[0] === '5800') {
    rowArr.unshift([{ text: '', style: 'subheader', border: [false, false, false, false] }, { text: table.categoryDescription,colSpan: 2, bold: true, style: 'subheader', alignment: 'center', border: [false, false, false, false]}, {}, { text: '(Expires ' + getNextFriday() + ')', colSpan: 2, bold: true, style: 'subheader', alignment: 'right', border: [false, false, false, false]}, {}])
  } else {
    rowArr.unshift([{ text: table.categoryDescription, bold: true, style: 'subheader', colSpan: 5, alignment: 'center', border: [false, false, false, false] }, {}, {}, {}, {}])
  }

  let tableContent = {
    margin: [0, 0, 0, 0],
    table: {
      headerRows: 2,
      widths: [110, 80, 155, 60, 40],
      keepWithHeaderRows: 1,
      dontBreakRows: true,
      body: rowArr
    },
    layout: {
      hLineWidth: function (i, node) {
        return (i === 0 || i === node.table.body.length) ? .75 : .75;
      },
      vLineWidth: function (i, node) {
        return (i === 0 || i === node.table.widths.length) ? .75 : .75;
      },
      fillColor: function (i, node) {
        return (i % 2 === 1 && (i !== 1 || i !== 2)) ? '#DCDCDC' : null;
      },
      hLineColor: function (i, node) {
        return (i === 0 || i === node.table.body.length) ? '#8C8C8C' : '#8C8C8C';
      },
      vLineColor: function (i, node) {
        return (i === 0 || i === node.table.widths.length) ? '#8C8C8C' : '#8C8C8C';
      },
      paddingLeft: function (i, node) { return 8; },
      paddingRight: function (i, node) { return 8; },
      paddingTop: function (i, node) { return 2; },
      paddingBottom: function (i, node) { return 2; }
    }
  }
  if (pageBreak) {
    Object.assign(tableContent, { pageBreak: 'before' });
  }
  return tableContent;
}

function getNextFriday(){
  let dayINeed = 5;
  let today = moment().isoWeekday();
  let nextFriday;
  if (today <= dayINeed) {
    nextFriday = moment().isoWeekday(dayINeed);
  } else {
    nextFriday = moment().add(1, 'weeks').isoWeekday(dayINeed);
  }
  return nextFriday.format('MMM. D');
}