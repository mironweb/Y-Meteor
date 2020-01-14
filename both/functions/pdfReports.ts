/*
* exported functions with _ before each function name must return something
* */
import { MeteorObservable } from "meteor-rxjs";
import * as moment from 'moment-timezone';
import { SystemTenants } from "../collections/systemTenants.collection";
import { Logo } from './image';
import { trustTheG } from './logo';
import * as funcs from './common';
import * as _ from "underscore";

export function invoiceOrOrderPdf(pdfContent) {
  let array = [];
  let widths = [];
  switch (pdfContent.docTitle) {
    case 'Invoice':
      widths = [40, 40, 20, 70, '*', 50, 25, 50]
      break;
    case 'Sales Order':
      widths = [30, 40, 65, '*', 25, 50]
      break;
    default:
  }

  let dd = {
    pageMargins: [40, 315, 40, 60],
    header: function (currentPage, pageCount) {
      return {
        margin: [40, 20, 40, 10],
        table: {
          widths: ['*', '*', '*', '*', '*', '*'],
          heights: ['auto', 'auto', 'auto', 60, 'auto', 'auto', 'auto'],
          body: [
            [{ text: 'Page ' + currentPage, alignment: 'right', colSpan: 6, fontSize: 10, border: [false, false, false, false] }, {}, {}, {}, {}, {}],
            [{ text: pdfContent.docTitle, colSpan: 6, alignment: 'center', border: [false, false, false, false], fontSize: 10, bold: true, }, {}, {}, {}, {}, {}],
            [
              {
                table: {
                  body: [
                    [{ text: 'Global, The Source', border: [false, false, false, false] }],
                    [{ text: '1648 Northlake Pass', border: [false, false, false, false] }],
                    [{ text: 'Universal City, TX 78148', border: [false, false, false, false] }],
                    [{ text: '(210) 226-8100', border: [false, false, false, false] }]
                  ]
                }, layout: layout([0, 0, 0, 0]), colSpan: 2, border: [false, false, false, false]
              },
              {},
              { image: trustTheG, width: 125, colSpan: 2, alignment: 'center', border: [false, false, false, false] },
              {},
              invoiceOrderHeaderTable(pdfContent),
              {},
            ],
            [
              {
                table: {
                  body: [
                    [{ text: 'Sold To:', bold: true, border: [false, false, false, false] }],
                    [{ text: pdfContent.billToName, border: [false, false, false, false] }],
                    [{ text: pdfContent.billToAddress1, border: [false, false, false, false] }],
                    ...pdfContent.billToAddress2 ? [[{ text: pdfContent.billToAddress2, border: [false, false, false, false] }]] : [],
                    ...pdfContent.billToAddress3 ? [[{ text: pdfContent.billToAddress3, border: [false, false, false, false] }]] : [],
                    [{ text: pdfContent.billToCity + ', ' + pdfContent.billToState + ', ' + pdfContent.billToZipCode, border: [false, false, false, false] }],
                  ]
                },
                layout: layout([0, 0, 0, 0]), colSpan: 4, border: [false, false, false, false]
              },
              {}, {}, {},
              {
                table: {
                  body: [
                    [{ text: 'Ship To:', bold: true, border: [false, false, false, false] }],
                    [{ text: pdfContent.shipToName, border: [false, false, false, false] }],
                    [{ text: pdfContent.shipToAddress1, border: [false, false, false, false] }],
                    ...pdfContent.shipToAddress2 ? [[{ text: pdfContent.shipToAddress2, border: [false, false, false, false] }]] : [],
                    ...pdfContent.shipToAddress3 ? [[{ text: pdfContent.shipToAddress3, border: [false, false, false, false] }]] : [],
                    [{ text: pdfContent.shipToCity + ', ' + pdfContent.shipToState + ', ' + pdfContent.shipToZipCode, border: [false, false, false, false] }],
                  ]
                },
                layout: layout([0, 0, 0, 0]), colSpan: 2, border: [false, false, false, false]
              },
              {},
            ],
            [{
              table: {
                body: [
                  [{ text: 'Confirm To:', bold: true, border: [false, false, false, false] }],
                  [{ text: 'Carlos Ramos Vallecillo', border: [false, false, false, false] }],
                ]
              },
              layout: layout([0, 0, 0, 0]), colSpan: 6, border: [false, false, false, false]
            }, {}, {}, {}, {}, {}],
            ...pdfContent.docTitle === "Invoice" ? [[{
              table: {
                widths: ['*', '*', '*', '*'],
                body: [
                  [{ text: 'Customer P.O.:', bold: true, border: [false, true, false, false] }, { text: 'Ship VIA:', bold: true, border: [false, true, false, false] }, { text: 'F.O.B:', bold: true, border: [false, true, false, false] }, { text: 'Terms', bold: true, border: [false, true, false, false] }],
                  [{ text: pdfContent.customerPurchaseOrder, border: [false, false, false, true] }, { text: 'UPS:', border: [false, false, false, true] }, { text: 'UC TX:', border: [false, false, false, true] }, { text: 'Net 30 Days', border: [false, false, false, true] }],
                ]
              }, colSpan: 6, alignment: 'center', border: [false, false, false, false]
            }, {}, {}, {}, {}, {}]] : [],
            ...pdfContent.docTitle === "Sales Order" ? [[{
              table: {
                widths: ['*', '*', '*', '*', '*'],
                body: [
                  [{ text: 'Customer P.O.:', bold: true, border: [false, true, false, false] }, { text: 'Ship Terms:', bold: true, border: [false, true, false, false] }, { text: 'F.O.B:', bold: true, border: [false, true, false, false] }, { text: 'Terms', bold: true, border: [false, true, false, false] }, { text: 'Order Origin', bold: true, border: [false, true, false, false] }],
                  [{ text: pdfContent.customerPONumber, border: [false, false, false, true] }, { text: 'PREPAID', border: [false, false, false, true] }, { text: 'UC TX:', border: [false, false, false, true] }, { text: 'Net 30 Days', border: [false, false, false, true] }, { text: 'Emailed', border: [false, false, false, true] }],
                ]
              }, colSpan: 6, alignment: 'center', border: [false, false, false, false]
            }, {}, {}, {}, {}, {}]] : [],

            ...pdfContent.docTitle === "Invoice" ? [[{
              table: {
                widths: widths,
                body: [
                  [
                    { text: 'Ordered', alignment: 'right', bold: true, border: [false, false, false, true] },
                    { text: 'Shipped', alignment: 'right', bold: true, border: [false, false, false, true] },
                    { text: 'B/O', alignment: 'right', bold: true, border: [false, false, false, true] },
                    { text: 'P/N', alignment: 'left', bold: true, border: [false, false, false, true] },
                    { text: ' ', bold: true, border: [false, false, false, true] },
                    { text: 'Price', alignment: 'right', bold: true, border: [false, false, false, true] },
                    { text: 'Unit', bold: true, border: [false, false, false, true] },
                    { text: 'Amount', alignment: 'right', bold: true, border: [false, false, false, true] },
                  ],
                ]
              },
              layout: layout([4, 4, -3, 5]), colSpan: 6, alignment: 'center', border: [false, false, false, false]
            }, {}, {}, {}, {}, {}]] : [],
            ...pdfContent.docTitle === "Sales Order" ? [[{
              table: {
                widths: widths,
                body: [
                  [
                    { text: ' ', bold: false, border: [false, false, false, true] },
                    { text: 'Ordered', alignment: 'right', bold: true, border: [false, false, false, true] },
                    { text: 'Item Code', alignment: 'left', bold: true, border: [false, false, false, true] },
                    { text: 'Item Descriptor', alignment: 'left', bold: true, border: [false, false, false, true] },
                    { text: 'Price', alignment: 'right', bold: true, border: [false, false, false, true] },
                    { text: 'Amount', alignment: 'right', bold: true, border: [false, false, false, true] },
                  ],
                ]
              },
              layout: layout([4, 4, -3, 5]), colSpan: 6, alignment: 'center', border: [false, false, false, false]
            }, {}, {}, {}, {}, {}]] : [],
          ],

        },
        layout: layout([0, 0, 3, 3])
      }
    },
    content: this.invoiceOrderMainContent(pdfContent, widths),
    footer: function (currentPage, pageCount) {
      if (currentPage === pageCount) {
        return {
          margin: [20, -60, 20, 0],
          columns: [
            ...pdfContent.docTitle === "Sales Order" ? [{
              table: {
                widths: ['*', '*'],
                body: [
                  [{ text: 'TRACKING NUMBERS: ', border: [false, false, false, false], colSpan: 2 }, {}],
                  [{ text: '', colSpan: 2, border: [false, false, false, false] }, {}],
                  [{ text: '', colSpan: 2, border: [false, false, false, false] }, {}],
                  [{ text: [{ text: 'CAUTION: \n', bold: true }, 'All products purchased are intended to be used by a licensed HVAC contractor.'], border: [false, false, false, false], colSpan: 2, fontSize: 10 }, {}],

                ]
              }
            }] : [{ text: '' }],
            {
              alignment: 'right',
              margin: [100, 0, 0, 0],
              table: {
                widths: [90, 50],
                body: [
                  ...pdfContent.docTitle === "Invoice" ? [[{ text: 'Net Invoice:', border: [false, false, false, false], }, { text: formatNumberForPdf(pdfContent.invoiceTotal), alignment: 'right', border: [false, false, false, false], style: 'tableContent' }]] : [],
                  ...pdfContent.docTitle === "Sales Order" ? [[{ text: 'Net Order:', border: [false, false, false, false], }, { text: formatNumberForPdf(pdfContent.orderTotal), alignment: 'right', border: [false, false, false, false], style: 'tableContent' }]] : [],
                  [{ text: 'Less Discount:', border: [false, false, false, false], }, { text: formatNumberForPdf(0), alignment: 'right', border: [false, false, false, false], style: 'tableContent' }],
                  ...pdfContent.docTitle === "Invoice" ? [[{ text: 'Shipping and Handling:', border: [false, false, false, false], }, { text: formatNumberForPdf(0), alignment: 'right', border: [false, false, false, false], style: 'tableContent' }]] : [],
                  ...pdfContent.docTitle === "Invoice" ? [[{ text: 'Invoice Total:', border: [false, false, false, false], style: 'tableHeaders' }, { text: formatNumberForPdf(pdfContent.invoiceTotal), alignment: 'right', border: [false, true, false, false], style: 'tableContent' }]] : [],
                  ...pdfContent.docTitle === "Sales Order" ? [[{ text: 'Order Total:', border: [false, false, false, false], style: 'tableHeaders' }, { text: formatNumberForPdf(pdfContent.orderTotal), alignment: 'right', border: [false, true, false, false], style: 'tableContent' }]] : [],
                ]
              },
            }
          ]


        }
      }
    },
    styles: {
      indent: {
        margin: [10, 0, 0, 0]
      },
      defintions: {
        margin: [140, 0, 0, 0],
        fontSize: 6
      },
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeaders: {
        bold: true,
        alignment: 'right',
      },
      tableContent: {
        alignment: 'left',
      },
      tableHeader: {
        bold: true,
        fontSize: 13,
        color: 'black'
      }
    },
    defaultStyle: {
      fontSize: 8,
    }
  }
  return dd;
}

export function invoiceAndOrderHeaderSection(pdfContent) {
  let array = []

  let docTitle = {
    text: pdfContent.docTitle,
    alignment: 'center',
    fontSize: 10,
    bold: true,
    margin: [0, 0, 0, 10]
  }

  let headerSection = {
    columns: [
      {
        table: {
          body: [
            [{ text: 'Global, The Source', border: [false, false, false, false] }],
            [{ text: '1648 Northlake Pass', border: [false, false, false, false] }],
            [{ text: 'Universal City, TX 78148', border: [false, false, false, false] }],
            [{ text: '(210) 226-8100', border: [false, false, false, false] }]
          ]
        },
        layout: layout([0, 0, 0, 0])
      },
      {
        image: trustTheG,
        alignment: 'center',
        width: 130
      },
      invoiceOrderHeaderTable(pdfContent)
    ]
  }

  let soldShipTo = {
    margin: [0, 10, 0, 0],
    columns: [
      {
        table: {
          body: [
            [{ text: 'Sold To:', bold: true, border: [false, false, false, false] }],
            [{ text: pdfContent.billToName, border: [false, false, false, false] }],
            [{ text: pdfContent.billToAddress1, border: [false, false, false, false] }],
            ...pdfContent.billToAddress2 ? [[{ text: pdfContent.billToAddress2, border: [false, false, false, false] }]] : [],
            ...pdfContent.billToAddress3 ? [[{ text: pdfContent.billToAddress3, border: [false, false, false, false] }]] : [],
            [{ text: pdfContent.billToCity + ', ' + pdfContent.billToState + ', ' + pdfContent.billToZipCode, border: [false, false, false, false] }],
          ]
        },
        layout: layout([0, 0, 0, 0])
      },
      {

      },
      {
        margin: [50, 0, 0, 0],
        table: {
          body: [
            [{ text: 'Ship To:', bold: true, border: [false, false, false, false] }],
            [{ text: pdfContent.shipToName, border: [false, false, false, false] }],
            [{ text: pdfContent.shipToAddress1, border: [false, false, false, false] }],
            ...pdfContent.shipToAddress2 ? [[{ text: pdfContent.shipToAddress2, border: [false, false, false, false] }]] : [],
            ...pdfContent.shipToAddress3 ? [[{ text: pdfContent.shipToAddress3, border: [false, false, false, false] }]] : [],
            [{ text: pdfContent.shipToCity + ', ' + pdfContent.shipToState + ', ' + pdfContent.shipToZipCode, border: [false, false, false, false] }],
          ]
        },
        layout: layout([0, 0, 0, 0])
      },
    ]
  }

  let confirmTo = {
    columns: [
      {
        margin: [0, 10, 0, 5],
        table: {
          body: [
            [{ text: 'Confirm To:', bold: true, border: [false, false, false, false] }],
            [{ text: 'Carlos Ramos Vallecillo', border: [false, false, false, false] }],
          ]
        },
        layout: layout([0, 0, 0, 0])
      },
    ]
  }

  array.push(docTitle, headerSection, soldShipTo, confirmTo)
  return array;
}

export function invoiceOrderHeaderTable(pdfContent) {
  let body

  switch (pdfContent.docTitle) {
    case 'Invoice':
      body = [
        [{ text: 'Invoice Number:', border: [false, false, false, false], style: 'tableHeaders' }, { text: pdfContent.number, border: [false, false, false, false], style: 'tableContent' }],
        [{ text: 'Invoice Date:', border: [false, false, false, false], style: 'tableHeaders' }, { text: moment(pdfContent.date).format("MM/DD/YYYY"), border: [false, false, false, false], style: 'tableContent' }],
        [{ text: ' ', border: [false, false, false, false], style: 'tableHeaders' }, { text: '', border: [false, false, false, false], style: 'tableContent' }],
        [{ text: 'Order Number:', border: [false, false, false, false], style: 'tableHeaders' }, ...pdfContent.orderInfo ? [{ text: pdfContent.orderInfo.number, border: [false, false, false, false], style: 'tableContent'  }] : [{ text: '', border: [false, false, false, false], style: 'tableContent'  }]],
        [{ text: 'Order Date:', border: [false, false, false, false], style: 'tableHeaders' }, ...pdfContent.orderInfo ? [{ text: moment(pdfContent.orderInfo.date).format("MM/DD/YYYY"), border: [false, false, false, false], style: 'tableContent' }] : [{ text: '', border: [false, false, false, false], style: 'tableContent' }]],
        [{ text: 'Order Taken By:', border: [false, false, false, false], style: 'tableHeaders' }, { text: '10101010', border: [false, false, false, false], style: 'tableContent' }],
        [{ text: 'SalesPerson', border: [false, false, false, false], style: 'tableHeaders' }, { text: '10101010', border: [false, false, false, false], style: 'tableContent' }],
        [{ text: 'Customer Number:', border: [false, false, false, false], style: 'tableHeaders' }, { text: pdfContent.customerNumber, border: [false, false, false, false], style: 'tableContent' }],
      ]
      break;
    case 'Sales Order':
      body = [
        [{ text: 'Order Number:', border: [false, false, false, false], style: 'tableHeaders' }, { text: pdfContent.number, border: [false, false, false, false], style: 'tableContent' }],
        [{ text: 'Order Date:', border: [false, false, false, false], style: 'tableHeaders' }, { text: moment(pdfContent.date).format("MM/DD/YYYY"), border: [false, false, false, false], style: 'tableContent' }],
        [{ text: 'RMA Number:', border: [false, false, false, false], style: 'tableHeaders' }, { text: ' ', border: [false, false, false, false], style: 'tableContent' }],
        [{ text: ' ', border: [false, false, false, false], style: 'tableHeaders' }, { text: '', border: [false, false, false, false], style: 'tableContent' }],
        [{ text: 'SalesPerson', border: [false, false, false, false], style: 'tableHeaders' }, { text: '10101010', border: [false, false, false, false], style: 'tableContent' }],
        [{ text: 'Customer Number:', border: [false, false, false, false], style: 'tableHeaders' }, { text: pdfContent.customerNumber, border: [false, false, false, false], style: 'tableContent' }],
        [{ text: 'Order Taken By:', border: [false, false, false, false], style: 'tableHeaders' }, { text: '10101010', border: [false, false, false, false], style: 'tableContent' }],
      ]
      break;
    default:

  }
  let header = {
    margin: [40, 0, 0, 0],
    table: {
      body: body
    },
    layout: layout([0, 0, 0, 0]),
    colSpan: 2, border: [false, false, false, false]
  }
  // header = invoiceHeader;
  return header
}

export function invoiceOrderMainContent(pdfContent, widths) {
  let result;
  switch (pdfContent.docTitle) {
    case 'Invoice':
      result = invoiceItems(widths, pdfContent.lineItems);
      break;
    case 'Sales Order':
      result = orderItems(widths, pdfContent.lineItems);
      break;
    default:
  }
  return result;
}

export function invoiceItems(widths, lineItems) {
  let itemArr = [];
  lineItems.forEach((lineItem, index) => {
    if (lineItem.type !== "comment") {
      let item = {
        margin: [0, 0, 0, 0],
        table: {
          widths: widths,
          body: [
            [
              ...lineItem.orderLineItemInfo ? [{ text: lineItem.orderLineItemInfo.qtyOrdered, border: [false, false, false, false], alignment: 'right' }] : [{ text: '', border: [false, false, false, false] }],
              { text: lineItem.qtyShipped, alignment: 'right', border: [false, false, false, false] },
              ...lineItem.orderLineItemInfo ? [{ text: lineItem.orderLineItemInfo.qtyBackordered, border: [false, false, false, false], alignment: 'right' }] : [{ text: '', border: [false, false, false, false] }],
              { text: lineItem.productInfo.product, border: [false, false, false, false] },
              { text: lineItem.productInfo.description, border: [false, false, false, false] },
              { text: formatNumberForPdf(lineItem.price), alignment: 'right', border: [false, false, false, false] },
              { text: 'EACH', alignment: 'center', border: [false, false, false, false] },
              { text: formatNumberForPdf(lineItem.total), alignment: 'right', border: [false, false, false, false] },
            ],
            [
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: 'Customer Part #: ' + lineItem.alias, colSpan: 3, alignment: 'left', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
            ],
          ]
        },
        layout: layout([4, 4, 2, 0])
      }
      if (index && (index % 15 === 0) && (index + 1) !== lineItems.length) {
        item['pageBreak'] = 'after';
        item.table.body.push([
          { text: '', alignment: 'right', border: [false, false, false, false] },
          { text: '', colSpan: 3, alignment: 'left', border: [false, false, false, false] },
          { text: '', alignment: 'right', border: [false, false, false, false] },
          { text: '', border: [false, false, false, false] },
          { text: '', border: [false, false, false, false] },
          { text: '', alignment: 'right', border: [false, false, false, false] },
          { text: '', border: [false, false, false, false] },
          { text: 'Continued', alignment: 'right', border: [false, false, false, false] },
        ])
      }
      itemArr.push(item)
    } else if (lineItem.type === "comment") {
      let item = {
        margin: [0, 0, 0, 0],
        table: {
          widths: widths,
          body: [
            [
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: lineItem.notes, colSpan: 3, alignment: 'left', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
            ],
          ]
        },
        layout: layout([4, 4, 2, 0])
      }
      itemArr.push(item)
    }
  });

  return itemArr;
}

export function orderItems(widths, lineItems) {
  let itemArr = [];
  lineItems.forEach((lineItem, index) => {
    if (lineItem.type !== "comment") {
      let item = {
        margin: [0, 0, 0, 0],
        table: {
          widths: widths,
          body: [
            [
              { text: index + 1, alignment: 'right', border: [false, false, false, false] },
              { text: lineItem.qtyOrdered, alignment: 'right', border: [false, false, false, false] },
              { text: lineItem.productInfo.product, border: [false, false, false, false] },
              { text: lineItem.description, border: [false, false, false, false] },
              { text: formatNumberForPdf(lineItem.price), alignment: 'right', border: [false, false, false, false] },
              { text: formatNumberForPdf(lineItem.total), alignment: 'right', border: [false, false, false, false] },
            ],
            [
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: 'Customer Part #: ' + lineItem.alias, colSpan: 3, alignment: 'left', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
            ],
          ]
        },
        layout: layout([4, 4, 2, 0])
      }
      if (index && (index % 15 === 0) && (index + 1) !== lineItems.length) {
        item['pageBreak'] = 'after';
        item.table.body.push([
          { text: '', alignment: 'right', border: [false, false, false, false] },
          { text: '', colSpan: 3, alignment: 'left', border: [false, false, false, false] },
          { text: '', alignment: 'right', border: [false, false, false, false] },
          { text: '', border: [false, false, false, false] },
          { text: '', border: [false, false, false, false] },
          { text: 'Continued', alignment: 'right', border: [false, false, false, false] },
        ])
      }
      itemArr.push(item)
    } else if (lineItem.type === "comment") {
      let item = {
        margin: [0, 0, 0, 0],
        table: {
          widths: widths,
          body: [
            [
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: lineItem.notes, colSpan: 3, alignment: 'left', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
            ],
          ]
        },
        layout: layout([4, 4, 2, 0])
      }
      itemArr.push(item)
    } else if (lineItem.type === "comment") {
      let item = {
        margin: [0, 0, 0, 0],
        table: {
          widths: widths,
          body: [
            [
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: lineItem.notes, colSpan: 3, alignment: 'left', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', alignment: 'right', border: [false, false, false, false] },
            ],
          ]
        },
        layout: layout([4, 4, 2, 0])
      }
      itemArr.push(item)
    }
  });

  return itemArr;
}

export function salesOrderPickingSheet(pdfContent) {
  let widths = [];

  let dd = {
    pageMargins: [40, 315, 40, 60],
    header: function(currentPage, pageCount) {

    }
  }

}

export function workOrderPickingSheet() {
  let widths = [];

}

function layout(layoutArr) {
  let layout = {
    paddingLeft: function (i, node) { return layoutArr[0]; },
    paddingRight: function (i, node) { return layoutArr[1]; },
    paddingTop: function (i, node) { return layoutArr[2]; },
    paddingBottom: function (i, node) { return layoutArr[3]; },
  }
  return layout;
}

function formatNumberForPdf(number) {
  return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
