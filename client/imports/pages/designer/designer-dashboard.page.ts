import {Component} from "@angular/core";
import {EventEmitterService} from "../../services";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import {MeteorObservable} from "meteor-rxjs";
import {PrintService} from "../../services/Print.service";

@Component({
  selector: 'designer-dashboard',
  template: `
    <div>
      <button mat-raised-button color="primary" (click)="onSetTheme('default-theme')">Default</button>
      <button mat-raised-button color="warn" (click)="onSetTheme('dark-theme')">Dark</button>
      <button mat-raised-button color="primary" (click)="onSetTheme('light-theme')">Light</button>
      <button mat-raised-button (click)="print()">print</button>
      <button mat-raised-button (click)="stop()">stop</button>
    </div>
  `
})export class DesignerDashboardPage {
  ws: any;
  printerId;
  resolve:any;
  reject:any;
  cancelled:any;
  constructor(private printService: PrintService) {
    pdfFonts.pdfMake;
  }

  ngOnInit() {
    // const { promise, cancel, complete } = this.testFunction();
// wait some time...
//     setTimeout(() => {
//       complete();
//     }, 6000)
    // cancel(); // user will be updated any way

    // this.testFunction()
    //   .then(res => {
    //     console.log("res'", res);
    //   })
    //
    // // wait some time...
    // setTimeout(() => {
    //   console.log('cancel timeout');
    //   this.resolve('resolve');
    //   // this.reject('reject');
    //
    // }, 6000);

    if (this.printService.printers && this.printService.printers.length > 0) {
      let findPrinter = this.printService.printers.find(_printer => _printer.printerName == 'label');
      this.printerId = findPrinter.printerId;
    }
  }

  testFunction() {
    // return new Promise((resolve, reject) => {
    //   this.reject = reject;
    //   this.resolve = resolve;
    //
    //   setTimeout(() => {
    //     console.log('wait for resolve');
    //     reject({
    //       reason: "cancelled"
    //     });
    //   }, 10000);
    //
    // })
    let resolve, reject, cancelled;
    const promise = new Promise((resolveFromPromise, rejectFromPromise) => {
      resolve = resolveFromPromise;
      reject = rejectFromPromise;
    });

    this.promiseFunc1('start func1')
      .then(wrapWithCancel(this.promiseFunc2))
      .then(resolve)
      .then(reject);


    return {
      promise,
      cancel: () => {
        cancelled = true;
        console.log('it get rejected', reject);
        reject({ reason: 'cancelled' });
      },
      complete: () => {
        cancelled = false;
        resolve(true);
      }
    };

    function wrapWithCancel(fn) {
      return (data) => {
        console.log('cancel wrapper');
        if (!cancelled) {
          return fn(data);
        }
      };
    }

  }

  promiseFunc1(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('time out1');
        resolve('yes1');
      }, 5000);
    })
  }

  promiseFunc2(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('time out2');
        resolve('yes2');
      }, 5000);
    })
  }
  wrapWithCancel(fn) {
    return (data) => {
      if (!this.cancelled) {
        return fn(data);
      }
    };
  }

  stop() {
    // const {promise, cancel} = this.testFunction();
    // console.log(cancel);
  }

  print() {
    MeteorObservable.call('rocketshipit', 'UPS', 'SubmitShipment').subscribe((res:any) => {
      res.data.packages.forEach(_package => {
        let content = getContent(res.data);
        let doc = {
          pageSize: { width: 800, height: 1600 },
          pageMargins: [0, 0, 0, 0],
          styles: {
            name: {
              fontSize: 22,
              bold: true
            },
            comma: {
              alignment: 'left',
              margin: [25, 0, 0, 0]
            },
            value: {
              italics: true,
              alignment: 'right'
            }
          },
          content: [
            {
              image: "data:image/png;base64," + _package.label
            },
            ...content
          ]
        };

        pdfMake.createPdf(doc).open();
        // pdfMake.createPdf(doc).getBase64(data => {
        //   let printJobPayload = {
        //     "printerId": this.printerId,
        //     "title": "printjob",
        //     "contentType": "pdf_base64",
        //     "content": data,
        //     "source": "javascript api client"
        //   };
        //   this.printService.print(printJobPayload);
        // });
      });
    })
  }

  onSetTheme(theme) {
    EventEmitterService.Events.next({
      name: 'setTheme',
      value: theme
    });
  }
}


function getContent(data) {
  let content = [
    {
      alignment: 'right',
      margin: [20, -100, 0, 0],
      fontSize: 20,
      columns: [
        {
          columns: [
            {
              text: "TRK#: " + data.tracking_number,
              alignment: "left"
            },
            {
              text: "Ship Date: 8/20/2018",
              alignment: "left"
            }
          ]
        }
      ]
    },
    {
      margin: [20, 20, 0, 0],
      fontSize: 20,
      columns: [
        {
          columns: [
            {
              text: "Acct",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'left',
              text: "785920"
            }
          ]
        },
        {
          columns: [
            {
              text: "ORD#",
              alignment: 'left',
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'left',
              text: "0109546"
            }
          ]
        }
      ]
    },
    {
      alignment: 'right',
      margin: [20, 3, 0, 0],
      fontSize: 20,
      columns: [
        {
          columns: [
            {
              text: "INV",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'left',
              text: "0154829"
            }
          ]
        },
        {
          columns: [
            {
              text: "Type",
              alignment: "left"
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              text: "UPS® Ground",
              alignment: "left"
            }
          ]
        }
      ]
    },
    {
      alignment: 'right',
      margin: [20, 3, 0, 0],
      fontSize: 20,
      columns: [
        {
          columns: [
            {
              text: "COD",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'left',
              text: "N"
            }
          ]
        },
        {
          columns: [
            {
              text: "COD Am",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              text: "0.00",
              alignment: "left"
            }
          ]
        }
      ]
    },
    {
      alignment: 'right',
      margin: [20, 3, 0, 0],
      fontSize: 20,
      columns: [
        {
          columns: [
            {
              text: "WT",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'left',
              text: data.billing_weight + " LB"
            }
          ]
        },
        {
          columns: [
            {
              text: "DV",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'left',
              text: "0.00"
            }
          ]
        }
      ]
    },
    {
      alignment: 'right',
      margin: [20, 3, 0, 0],
      fontSize: 20,
      columns: [
        {
          columns: [
            {
              text: "Dept",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'left',
              text: ""
            }
          ]
        },
        {
          columns: [
            {
              text: "Billing",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'left',
              text: "Sender"
            }
          ]
        }
      ]
    },
    {
      alignment: 'right',
      margin: [20, 3, 0, 0],
      fontSize: 20,
      columns: [
        {
          columns: [
            {
              text: "#Pkgs",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'left',
              text: "1"
            }
          ]
        },
        {
          columns: []
        }
      ]
    },
    {
      alignment: 'right',
      margin: [20, 10, 0, 0],
      fontSize: 20,
      columns: [
        {
          columns: []
        },
        {
          columns: [
            {
              text: "Handling Fee",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'right',
              text: "0.00",
              margin: [40, 0],
            }
          ]
        }
      ]
    },
    {
      alignment: 'right',
      margin: [20, 3, 0, 0],
      fontSize: 20,
      columns: [
        {
          columns: []
        },
        {
          columns: [
            {
              text: "PUB SVC CHG",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'right',
              text: data.charges,
              margin: [40, 0],
            }
          ]
        }
      ]
    },
    {
      alignment: 'right',
      margin: [20, 3, 0, 0],
      fontSize: 20,
      columns: [
        {
          columns: []
        },
        {
          columns: [
            {
              text: "Total Charge",
              alignment: 'left'
            },
            {
              text: ":",
              style: "comma",
              width: 50
            },
            {
              alignment: 'right',
              text: data.charges,
              margin: [40, 0]
            }
          ]
        }
      ]
    }
  ]
  return content;
}

