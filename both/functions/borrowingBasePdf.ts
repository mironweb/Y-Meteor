import * as moment from 'moment-timezone';
import * as _ from "underscore";

export function borrowingBaseReport(content) {
  let today = moment().format("MM/DD/YYYY");
  let detailedInfo = content.detailedInfo;

  let dd:any = {
    footer: function (currentPage, pageCount) {
      if (currentPage > 1) {
        return [
          {
            margin: [20, 10, 20, 0],
            table: {
              widths: ['*'],
              body: [
                [{ text: 'Page ' + currentPage.toString() + ' of ' + pageCount, fontSize: 8, border: [false, false, false, false] },],
              ]
            }
          }
        ]
      }
    },
    content: [
      {
        table: {
          body: [
            [{ text: 'Vladmir, Ltd', border: [false, false, false, false] }, { text: today, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Total Accounts Receivable as of', bold: true, border: [false, false, false, false] }, { text: today, border: [false, false, false, true] }, { text: '', alignment: 'left', border: [false, false, false, true] }, { text: '$' + formatNumberForPdf(content.totalAR), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: '90 days from total invoice date', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: formatNumberForPdf(content.invoiceTotal90Day), alignment: 'right', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'TOTAL 90 Days from invoice date', bold: true, style: 'indent', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, true] }, { text: formatNumberForPdf(content.invoiceTotal90Day), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Eligible Receivables', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, true] }, { text: '$' + formatNumberForPdf(content.eligibleReceivable), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            // '\n',
            [{ text: ' ', colSpan: 7, border: [false, false, false, false] },],
            [{ text: 'Loan Value of Accounts', bold: true, border: [false, false, false, false] }, { text: '80%', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, true] }, { text: formatNumberForPdf(content.loanValueAccounts), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Inventory as of', bold: true, border: [false, false, false, false] }, { text: today, border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: formatNumberForPdf(content.totalInventory), alignment: 'right', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Eligible Inventory', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', border: [false, false, false, true] }, { text: formatNumberForPdf(content.totalInventory), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Loan Value of Accounts', bold: true, border: [false, false, false, false] }, { text: '60%', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, false] }, { text: formatNumberForPdf(content.loanValueInventory), alignment: 'right', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            // '\n',
            [{ text: ' ', colSpan: 7, border: [false, false, false, false] },],
            [{ text: 'Maximum Loan Amount', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, true] }, { text: formatNumberForPdf(content.maxLoanAmmount), alignment: 'right', border: [false, false, false, true] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Less 2nd', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, false] }, { text: '-', alignment: 'right', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
            [{ text: 'Total Line Outstanding', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, false] }, { text: formatNumberForPdf(content.totalLineOutstanding), alignment: 'right', border: [false, false, false, false] }, { text: '(GL CASH ACCT LESS LOAN BAL)', fontSize: 8, border: [false, false, false, false] }],
            [{ text: 'Amount Available', bold: true, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '$', alignment: 'left', border: [false, false, false, false] }, { text: formatNumberForPdf(content.amountAvailable), alignment: 'right', border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }],
          ]
        },
      },
      {
        table: {
          body: [
            [{ text: 'The Borrower\'s computation of the following financial covenants contained the Loan Agreement are as follows:', border: [false, false, false, false] }],
          ]
        },
      },
      {
        table: {
          widths: [80, 140, 140, 'auto', 'auto', 'auto'],
          body: [
            [{ text: '1)', fillColor: '#FFFF00', alignment: 'center', border: [false, false, false, false] }, { text: ['Maintain a Current Ratio in excess of ', { text: '1.25', decoration: 'underline' }, ' to 1.00'], fillColor: '#FFFF00', colSpan: 2, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }],
            [{ text: '', fillColor: '#FFFF00', alignment: 'center', border: [false, false, false, false] }, { text: 'Current Assets', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: [{ text: '$' + formatNumberForPdf(content.currentAssets), decoration: 'underline' }, ' / Current Liabilities'], fillColor: '#FFFF00', style: 'right', border: [false, false, false, false] }, { text: '$' + formatNumberForPdf(content.totalLiabilites), fillColor: '#FFFF00', decoration: 'underline', border: [false, false, false, false] }, { text: '=', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: content.currentAssestsRatio, fillColor: '#FFFF00', decoration: 'underline', border: [false, false, false, false] }],
          ]
        },
      },
      '\n',
      {
        table: {
          widths: [80, 140, 140, 'auto', 'auto', 'auto'],
          body: [
            [{ text: '2)', fillColor: '#FFFF00', alignment: 'center', border: [false, false, false, false] }, { text: ['Maintain a ratio of Debt to Tangible Net Worth not in excess of ', { text: '2.75' }, ' to 1.00'], fillColor: '#FFFF00', colSpan: 2, border: [false, false, false, false] }, { text: '', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: '', fillColor: '#FFFF00', border: [false, false, false, false] }],
            [{ text: '', fillColor: '#FFFF00', alignment: 'center', border: [false, false, false, false] }, { text: 'Current Liabilities', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: [{ text: '$' + formatNumberForPdf(content.totalLiabilites), decoration: 'underline' }, ' / Tang. Net Worth'], fillColor: '#FFFF00', style: 'right', border: [false, false, false, false] }, { text: '$' + formatNumberForPdf(content.tangNetWorth), fillColor: '#FFFF00', decoration: 'underline', border: [false, false, false, false] }, { text: '=', fillColor: '#FFFF00', border: [false, false, false, false] }, { text: content.totalLiabilitesRatio, fillColor: '#FFFF00', decoration: 'underline', border: [false, false, false, false] }],
          ]
        },
      },
      '\n',
      { text: 'Defintions:', style: 'defintions', decoration: 'underline', },
      { style: 'defintions', text: [{ text: 'Current Liabilities: ', bold: true }, { text: 'Current Liabilities ' }, { text: 'less', italics: true }, { text: ' Subordinated Debt' }] },
      { style: 'defintions', text: [{ text: 'Tangible Net Worth: ', bold: true }, { text: 'Total Assets ' }, { text: 'less ', italics: true }, { text: 'All Intangible Assets less Current Liabilities ' }, { text: 'plus ', italics: true }, { text: ' Subordinated Debt' }] },
      '\n',
      { style: 'defintions', text: 'The ratios will be based on the operating company financial statements only (not the consolidated statement).', italics: true, bold: true },
      '\n',
      // { style: 'defintions', text: 'Accounts Recivable: ' + defineAccounts(detailedInfo.AR), italics: true, bold: true },
      // { style: 'defintions', text: '90 days from total invoice date: ' + defineAccounts(detailedInfo['90Days']) + ' invoices with due date less than or equal to ' + moment().subtract(90, 'days').endOf('day').format('M/D/YY'), italics: true, bold: true },
      // { style: 'defintions', text: 'Eligible Receivables: Accounts Recivable less 90 days from total invoice date IF 90 Day invoices greater than 0', italics: true, bold: true },
      // '\n',
      // { style: 'defintions', text: 'Loan Value of Accounts: Accounts Recivable x .8', italics: true, bold: true },
      // { style: 'defintions', text: 'Inventory as of: Inventory Accounts (1600-1699)', italics: true, bold: true },
      // { style: 'defintions', text: 'Eligible Inventory: Same as "Inventory as of" total', italics: true, bold: true },
      // '\n',
      // { style: 'defintions', text: 'Loan Value of Accounts: Inventory as of x .6', italics: true, bold: true },
      // { style: 'defintions', text: 'Maximum Loan Amount: Set at $11,500,000.00', italics: true, bold: true },
      // { style: 'defintions', text: 'Less 2nd: N/A', italics: true, bold: true },
      // { style: 'defintions', text: 'Total Line Outstanding: ' + defineAccounts(detailedInfo.lineOutstanding) + ' less 1000-00', italics: true, bold: true },
      // { style: 'defintions', text: 'Amount Available: Maximum Loan Amount less Total Line Outstanding', italics: true, bold: true },
      // { style: 'defintions', text: `Current Assets: (${defineAccounts(detailedInfo.currentAssets)} asset accounts)`, italics: true, bold: true },
      // { style: 'defintions', text: `Current/Current Liabilities: (${defineAccounts(detailedInfo.currentLiabilities)} liability accounts)`, italics: true, bold: true },
      // { style: 'defintions', text: `Tang. Net Worth: Equity (${defineAccounts(detailedInfo.equity)} equity accounts) less Intangible Assets (${defineAccounts(detailedInfo.intangibleAssets)})`, italics: true, bold: true },


      {
        margin: [140, 0, 0, 0],
        table: {
          widths: ['auto', 'auto'],
          body: [
            [{ text: 'Accounts Recivable:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: defineAccounts(detailedInfo.AR), border: [false, false, false, false] }],
            [{ text: '90 days from total invoice date:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: defineAccounts(detailedInfo['90Days']) + ' invoices with due date <= ' + moment().subtract(90, 'days').endOf('day').format('M/D/YY'), border: [false, false, false, false] }],
            [{ text: 'Eligible Receivables:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: 'Accounts Recivable less 90 days from total', border: [false, false, false, false] }],
            [{ text: ' ', colSpan: 2, border: [false, false, false, false] },],
            [{ text: 'Loan Value of Accounts:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: '80% of Accounts Recivable', border: [false, false, false, false] }],
            [{ text: 'Inventory as of:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: '1600-1699', border: [false, false, false, false] }],
            [{ text: 'Eligible Inventory:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: 'Inventory as of', border: [false, false, false, false] }],
            [{ text: 'Loan Value of Accounts:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: '60% of Inventory as of', border: [false, false, false, false] }],
            [{ text: ' ', colSpan: 2, border: [false, false, false, false] },],
            [{ text: 'Maximum Loan Amount:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: 'Set at ' + content.maxLoanAmmount, border: [false, false, false, false] }],
            [{ text: 'Less 2nd:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: 'N/A', border: [false, false, false, false] }],
            [{ text: 'Total Line Outstanding:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: defineAccounts(detailedInfo.lineOutstanding) + ' less 1000-00', border: [false, false, false, false] }],
            [{ text: 'Amount Available:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: 'Maximum Loan Amount less Total Line Outstanding', border: [false, false, false, false] }],
            [{ text: 'Current Assets:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: '1200, 1202, 1224-1229, 1600-1699', border: [false, false, false, false] }],
            [{ text: 'Current Liabilities:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: `1000 + ${detailedInfo.currentLiabilities.arr.length - 1} liability accounts`, border: [false, false, false, false] }],
            [{ text: 'Tang. Net Worth:', bold: true, alignment: 'left', border: [false, false, false, false] }, { text: 'Equity less Intangible Assets', border: [false, false, false, false] }],
          ]
        },
        layout: layout([0, 10, 0, 0]), border: [false, false, false, false]
      },


      { text: '', pageBreak: 'before' },
    ],
    styles: {
      header: {
        bold: true,
        fontSize: 13,
        margin: [0, 10, 0, 0]
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'black'
      },
      cell: {
        margin: [0, 0, 0, 0]
      },
      indent: {
        margin: [10, 0, 0, 0]
      },
      table: {
        margin: [0, 15, 0, 15]
      },
      defintions: {
        margin: [140, 0, 0, 0],
        fontSize: 8
      },
    },
    defaultStyle: {
      fontSize: 8,
    }
  }
  // console.log(detailedInfo);
  // console.log(JSON.stringify(detailedInfo));

  for (let key in detailedInfo) {
    dd.content.push({ text: detailedInfo[key].title, style: 'header'});
    dd.content.push(getTables(detailedInfo[key]));
  }
  return dd;
}

function defineAccounts(detailedInfo){
  if(detailedInfo.arr.length == 1){
    return detailedInfo.arr[0].number.split('-')[0];
  } else {

  }

  return detailedInfo.arr.length;
}

function getTables(detailedInfo) {
  let array = detailedInfo.arr;
  let tableContent:any = {
      table: {
      widths: [
        '*',
        '*', 
        '*', 
        ...detailedInfo.title !== '90 Day Old Invoices' ? [] : ['*']
      ],
      headerRows: 1,
      style: 'table',
      body: [
        [
          { text: 'Number', style: 'tableHeader' }, 
          { text: (detailedInfo.title !== '90 Day Old Invoices' ? 'Description' : 'Customer'), style: 'tableHeader' }, 
          ...detailedInfo.title !== '90 Day Old Invoices' ? [] : [{ text: 'Due Date', style: 'tableHeader' }],
          { text: 'Total', style: 'tableHeader'}
        ],
      ]
    }
  }
  array.sort((a, b) => (a.number > b.number) ? 1 : ((b.number > a.number) ? -1 : 0));
  
  let total = 0
  for (let i = 0; i < array.length; i++) {
    let element = array[i];
    total += element.total
    tableContent.table.body.push([
      { text: element.number }, 
      { text: element.description }, 
      ...detailedInfo.title !== '90 Day Old Invoices' ? [] : [{ text: moment(element.dueDate).format("MM/DD/YYYY") }],
      { text: '$' + formatNumberForPdf(element.total), alignment: 'right'}
    ]);
  }
  tableContent.table.body.push([
    { text: '', border: [false, false, false, false] }, 
    { text: '', border: [false, false, false, false] }, 
    ...detailedInfo.title !== '90 Day Old Invoices' ? [] : [{ text: '', border: [false, false, false, false]}],
    { text: 'TOTAL: $' + formatNumberForPdf(total), alignment: 'right', border: [true, false, true, true] }
  ])
  return tableContent;
}

function formatNumberForPdf(number) {
  number = number ? number : 0;
  return number.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); 
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