import { Meteor } from 'meteor/meteor';
var rocketshipit = require('../api/rocketship/rocketshipit');

Meteor.methods({
  // users who manage this current user
  "rocketshipit" (carrier, action, params) {

    // {
    //   "key": "0D4C89EA83C600CC",
    //   "username": "7659200117105100",
    //   "password": "Turbomini963&",
    //   "account_number": "765920",
    //   "request_option": "64",
    //   "ship_city": "Atlanta",
    //   "ship_state": "GA",
    //   "ship_code": "85281",
    //   "ship_code_extended": "4510",
    //   "ship_country": "US",
    //   "test": true
    // }
    params = {
      "key": "0D4C89EA83C600CC",
      "username": "7659200117105100",
      "password": "Turbomini963&",
      "account_number": "765920",
      "packages": [
        {
          "weight": 50,
          "length": 24,
          "height": 12,
          "width": 23,
          "reference_code": "PO",
          "reference_value": "428-P5563450",
          "reference_code2": "IN",
          "reference_value2": "155037"
        }
      ],
      "service": "03",
      "shipper": "GLOBAL THE SOURCE",
      "ship_addr1": "1648 NORTHLAKE PASS",
      "ship_city": "UNIVERSAL CITY",
      "ship_state": "TX",
      "ship_code": "78148",
      "ship_phone": "(210)226-8100",
      "ship_country": "US",
      "to_name": "BRAN JOHNSTONE SUPPLY BRANDON",
      "to_addr1": "203 KELSEY LANE",
      "to_addr2": "SUITE A",
      "to_state": "FL",
      "to_city": "TAMPA",
      "to_code": "33619-4334",
      "to_country": "US",
      "image_type": "PNG"
    };
    // console.log('rocketshipit carrier', carrier);
    // console.log('rocketshipit action', action);
    // console.log('rocketshipit params', params);



    return new Promise(resolve => {
      rocketshipit.request(
        carrier,
        action,
        params,
        (res) => {
          // let parseData:any = JSON.parse(res);
          // fs.writeFile(process.env.PWD + '/guofu.png', parseData.data.packages[0].label, {encoding: 'base64'}, (res) => {
          //   console.log("file", res)
          // });
          // console.log('rocketshipit result', res);
          resolve(res);
        }
      )
    })


    // return Observable.create(observer => {
    //   console.log('it is running2');
    //
    //   const choiceCallback = (data: boolean) => {
    //     console.log('data', data);
    //     console.log('data', data);
    //     console.log('data', data);
    //     console.log('data', data);
    //     console.log('data', data);
    //     if (data) {
    //       observer.next(data);
    //     }
    //     observer.complete();
    //   };

    // })

  }
});