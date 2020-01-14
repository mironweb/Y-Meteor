import * as moment from 'moment-timezone';
import { trustTheG } from './logo';
import * as _ from "underscore";
import * as funcs from './common';


export async function reportPdf(pdfContent) {
  console.log(pdfContent)
  let dd = finishPdf(pdfContent);
  return dd;
}

function finishPdf(pdfContent) {
  let dd = {
    // pageOrientation: 'landscape',
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
    content: generateContent(pdfContent),
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

function generateContent(input) {
  let content = [];
  content.push({
    image: trustTheG,
    width: 150
  },)
  content.push({ text: 'Executive Overview Report', style: 'header', alignment: 'center', decoration: 'underline'},)
  input.forEach((card, index) => {
    content = content.concat(buildSection(card, index));
  });
  return content;
}

function buildSection(card, index) {
  let arr = [];
  let title = { text: card.title, style: 'header' }
  let table = {
    style: 'tableExample',
      table: {
        widths: generateColumnWidths(card.value.columns),
        body: buildTableBody(card.value)
    }
  }
  arr.push(title, table);
  return arr;
}

function generateColumnWidths(columns) {
  let columnArr = [];
  columns.forEach(element => {
    let width = element.reportColumnWidth ? element.reportColumnWidth : '*';
    columnArr.push(width);
  });
  return columnArr;
}

function buildTableBody(table) {
  let body = [];
  table.rows.forEach(rowObject => {
    let row = [];
    table.columns.forEach(column => {
      let value = rowObject[column.prop];
      switch (column.type) {
        case 'dollar':
          value = funcs.formatMoney(value);
          break;
      
        default:
          value = value;
          break;
      }
      row.push(value);
    });
    body.push(row);
  });
  return body;
}