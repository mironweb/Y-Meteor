import { Injectable } from '@angular/core';
import moment = require("moment");
var JsBarcode = require('jsbarcode');

@Injectable()
export class InventoryService {

  textToBase64Barcode(text){
    var canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {format: "CODE39"});
    return canvas.toDataURL("image/png");
  }

  _getPDFData(model, extraInfo) {
    let dirtyRows = model.lineItems;
    const fieldSorter = (fields) => (a, b) => fields.map(o => {
      let dir = 1;
      if (o[0] === '-') { dir = -1; o=o.substring(1); }
      return a[o] > b[o] ? dir : a[o] < b[o] ? -(dir) : 0;
    }).reduce((p, n) => p ? p : n, 0);
    dirtyRows.sort(fieldSorter(['warehouse', 'bin']));

    let pdfTableHeaders = [
      "Bin",
      "Warehouse",
      "Component",
      "Unit of Measure",
      {text: "Total Qty", alignment: "right"},
      {text: "Qty Picked", alignment: "center"},
      {text: "Short/Over", alignment: "center"}
    ];

    let pdfTableRows = [];

    dirtyRows.forEach(row => {
      let arr = [];
      arr.push(row.warehouseBinName);
      arr.push(row.warehouseName);
      arr.push(row.component);
      arr.push('Each');
      let key = 'qtyToPick';
      if (row[key]) {
        arr.push({text: row[key], alignment: "right"});
      } else {
        arr.push('');
      }
      arr.push({text: "____________", alignment: 'center', margin: [10, 10]});
      arr.push({text: "____________", alignment: 'center', margin: [10, 10]});
      pdfTableRows.push(arr);

    });
    let billNumber_barcode = this.textToBase64Barcode(model.itemCode);
    let quantity_barcode = this.textToBase64Barcode(model.productionQty);
    let orderNo_barcode = this.textToBase64Barcode(model.number);

    return {
      fontSize: 20,
      pageSize: 'A4',
      pageMargins: [30, 30, 30, 30],
      content: [
        { text: 'Work Order Picking Sheet', style: 'header' },
        {
          margin: [0, 20, 0, 0],
          columns: [
            {
              columns: [
                {
                  text: "Bill Number :",
                  alignment: "right"
                },
                {
                  table: {
                    body: [
                      [{
                        image: billNumber_barcode,
                        fit: [100, 100],
                        alignment: "center",
                        border: [false, false, false, false]
                      }],
                      [{ text: 'Version: ' + extraInfo.version, alignment: "center", fontSize: 8, border: [false, false, false, false,] }]
                    ]
                  }
                },
              ]
            },
            {
              columns: [
                {
                  text: "Quantity:",
                  alignment: "right"
                },
                {
                  image: quantity_barcode,
                  fit: [100, 100],
                  alignment: "center"
                }
              ]
            }
          ]
        },
        {
          margin: [0, 5, 0, 0],
          columns: [
            {
              columns: [
                {
                  text: "Order No :",
                  alignment: "right"
                },
                {
                  image: orderNo_barcode,
                  fit: [100, 100],
                  alignment: "center"
                }
              ]
            },
            {
              columns: [
                {
                  margin: [85, 0, 0, 0],
                  table: {
                    body: [
                      [
                        {
                          text: 'Created:',
                          alignment: 'right',
                          border: [false, false, false, false]
                        },
                        {
                          text: extraInfo.createdAt + ' by ' + extraInfo.createdBy,
                          fontSize: 10,
                          margin: [10, 0],
                          border: [false, false, false, false]
                        }
                      ],
                      [
                        {
                          text: 'Printed:',
                          alignment: 'right',
                          border: [false, false, false, false]
                        },
                        {
                          text: extraInfo.printedAt + ' by ' + extraInfo.printedBy,
                          fontSize: 10,
                          margin: [10, 0],
                          border: [false, false, false, false]
                        }
                      ]
                    ]
                  }
                },
              ]
            }
          ]
        },
        {
          margin: [0, 15, 0, 15],
          fontSize: 10,
          // layout: 'lightHorizontalLines', // optional
          layout: {
            hLineWidth: function (i, node) {
              return ( i === 1) ? 2 : 0;
            },
            vLineWidth: function (i, node) {
              return (i === 0 || i === node.table.widths.length) ? 0 : 0;
            },
            hLineColor: function (i, node) {
              return (i === 0 || i === node.table.body.length) ? 'black' : 'black';
            },
            vLineColor: function (i, node) {
              return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
            },
            paddingLeft: function(i, node) { return 4; },
            paddingRight: function(i, node) { return 4; },
            paddingTop: function(i, node) { return 10; },
            paddingBottom: function(i, node) { return 2; },
            fillColor: function (rowIndex, node, columnIndex) { return null; }
          },
          table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers
            headerRows: 1,
            widths: [ '*', '*', "*", '*', "auto", 'auto', "auto" ],
            body: [
              pdfTableHeaders,
              ...pdfTableRows
            ],


          }
        },
        {
          margin: [10, 10, 10, 10],
          columns: [
            '',
            { text: 'Boxer __________           Rcv __________', alignment: 'right' }
          ]
        }
      ],
      styles: {
        header: {
          fontSize: 20,
          alignment: "center"
        },
        table: {
          fontSize: 16
        }
      }
    }
  }
}
