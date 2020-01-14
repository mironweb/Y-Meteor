import { Meteor } from 'meteor/meteor';
var rocketshipit = require('../api/rocketship/rocketshipit');
const auth = 'Basic Z2xvYmFsdGhlc291cmNlOlR1cmJvMjAw'

Meteor.methods({
  // users who manage this current user
  "selfSubmitQuote"() {

    let params = {
      "CustomerAccount": "045003596",
      "CustomerName": "Global The Source",
      "CustomerCity": "Universal City",
      "CustomerStreet": "1648 Northlake Pass",
      "CustomerState": "TX",
      "CustomerZip": "78148",
      "PickupMonth": "06",
      "PickupDay": "25",
      "PickupYear": "2019",
      "returnX": "Y",
      "rateXML": "Y",
      "Option": "S",
      "Terms": "P",
      "EmailAddress": "test@sefl.com",
      "OriginZip": "78148",
      "OriginCity": "Universal City",
      "OriginState": "TX",
      "OrigCountry": "U",
      "DestinationZip": "75220",
      "DestinationCity": "Dallas",
      "DestinationState": "TX",
      "DestCountry": "U",
      "Class1": "70",
      "Weight1": "7813",
      "Description": "Test commodity",
      allowSpot: 'Y',
      floorSpace: 16,
      widthSpace: 8,
      heightSpace: 5,
      'Pieces1': 8,
    };

    return new Promise(resolve => {
      HTTP.call('POST', 'https://www.sefl.com/webconnect/ratequotes/rest/submitQuote', {
        content: 'string',
        'params': params,
        'headers': {
          'Authorization': auth,
          'Content-Type': 'application/json'
        }
      }, function (error, response) {
        if (error) {
          console.log(error);
          resolve('');
        } else {
          console.log('SUCCESS',response);
          resolve(response);
        }
      });
    })
  },

  "getQuote"(number) {
    return new Promise(resolve => {
      HTTP.call('GET', `https://www.sefl.com/webconnect/ratequotes/rest/${number}?ReturnDetail=Y`, {
        content: 'string',
        'headers': {
          'Authorization': auth,
          'Content-Type': 'application/json'
        }
      }, function (error, response) {
        if (error) {
          console.log(error);
          resolve('');
        } else {
          console.log('~~~~~', response);
          resolve(response);
        }
      });
    })
  }
});