import {Injectable} from "@angular/core";
import PrintNode from "../pages/inventory/api";
import * as pdfMake from "pdfmake/build/pdfmake";
import {testlog} from "../../../both/functions/common";
import {Observable} from "rxjs/Observable";
import {MeteorObservable} from "meteor-rxjs";
import {tap} from "rxjs/operators";

@Injectable()
export class PrintService {
  // API_KEY = "dcc5ec09b7732839fa278ea97065b8cdb8ff15f2";
  API_KEY = '6d9a0138eb44ca68305d5c7820847e990369e6aa';
  printers: Array<any>;
  api: any;
  options = {
    // changes the value of 'this' in the success, error, timeout and complete
    // handlers. The default value of 'this' is the instance of the PrintNodeApi
    // object used to make the api call
    context: null,
    // called if the api call was a 2xx success
    success: function (response, headers, xhrObject) {
      testlog("success", response, headers);
    },
    // called if the api call failed in any way
    error: function (response, headers, xhrObject) {
      testlog("error", response, headers);
    },
    // called afer the api call has completed after success or error callback
    complete: function (response) {
      testlog(
        "%d %s %s returned %db in %dms",
        response.xhr.status,
        response.reqMethod,
        response.reqUrl,
        response.xhr.responseText.length,
        response.getDuration()
      );
    },
    // called if the api call timed out
    timeout: function (url, duration) {
      testlog("timeout", url, duration)
    },
    // the timeout duration in ms
    timeoutDuration: 3000
  };

  constructor() {
    pdfMake.pdfMake;
    this.api = new PrintNode.HTTP(
      new PrintNode.HTTP.ApiKey(this.API_KEY),
      this.options
    );
  }

  print(payload) {
    // let p = this.api.printers(this.options, {});
    // testlog('p', p);

    this.api.createPrintjob(this.options, payload);
  }

  _loadPrinters$(): Observable<any> {
    return MeteorObservable.call('findOne', 'systemOptions', {name: "printers", tenantId: Session.get('tenantId')})
      .pipe(
        tap(res => {
          if (res) {
            this.printers = res.value;
            this.API_KEY = res.data.api_key;
          }
        })
      )
  }

  getPrinters() {
  }
}
