import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import {Profile} from '../../../both/models/profile.model';
import { Random } from 'meteor/random';
import { Email } from 'meteor/email';
import * as Util from 'util';
import { AllCollections } from '../../../both/collections';
import { SystemOptions } from '../../../both/collections/systemOptions.collection';
import { SystemModules } from '../../../both/collections/systemModules.collection';
import { SystemTenants } from '../../../both/collections/systemTenants.collection';
import { UserGroups } from '../../../both/collections/userGroups.collection';
import { SystemPermissions } from '../../../both/collections/systemPermissions.collection';
import { Users } from '../../../both/collections/users.collection';
import { Categories } from '../../../both/collections/categories.collection';
import { SystemLookups } from '../../../both/collections/systemLookups.collection';
import { CustomerMeetings } from '../../../both/collections/customerMeetings.collection';
import { Customers } from '../../../both/collections/customers.collection';
import { CustomerInvoices } from '../../../both/collections/customerInvoices.collection';
import { generateRegexWithKeywords } from '../../../both/functions/common';
import * as moment from 'moment';
import bwipjs from 'bwip-js';


Meteor.methods({
  getLogOptions() {
    let result = SystemOptions.collection.findOne({name: 'logOptions'});
    return result;
  },
  // getCurrentUserGroups() {
  //   let result = Users.collection.findOne(this.userId, {fields: {"tenants.groups": 1}});
  //   return result;
  // },
  getCurrentUser() {
    let result = Users.collection.findOne(this.userId, {fields: {
        profile: 1,
        tenants: 1,
        status: 1,
        manages: 1,
        blockedCustomers: 1
      }});
    return result;
  },
  barcode() {
    console.log('bwipJs', bwipjs);
    // bwipjs.toBuffer({ bcid:'qrcode', text:'0123456789' }, function (err, png) {
    //     if (err) {
    //       document.getElementById('output').textContent = err;
    //     } else {
    //
    //       let docDefinition = {
    //         content: [
    //           {
    //             image: "data:image/png;base64," + png.toString('base64')
    //           }
    //         ]
    //       };
    //       console.log('doc', docDefinition);
    //       // pdfMake.createPdf(docDefinition)
    //       // document.getElementById('myimg').src = 'data:image/png;base64,' +
    //       //   png.toString('base64');
    //     }
    //   });
  }
})