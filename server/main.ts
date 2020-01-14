import { Main } from './imports/server-main/main';
import { Meteor } from 'meteor/meteor';
import { setupAdalApi } from './imports/api/adal/index';
import { setupMsGraphApi } from './imports/api/msGraph/index';

import './imports/publications/systemTenants.publication';
import './imports/publications';
import './imports/methods';

/// <reference types="node" />

// start: Oct 26, 2017
declare const SSR;
declare const MarkerClusterer;
// end: Oct 26, 2017

declare const TimeSync;
declare const UserStatus;

// May 22, 2018
declare const MongoInternals;
declare const Npm;


Meteor.startup(() => {
  setupAdalApi(); // instantiate new auth route for ms graph authentication
  setupMsGraphApi(); // instantiate new ms graph route for ms graph request

  // test();
  // detectServer();

  if (!Meteor.settings.public.isTestWebsite) {
    console.log('is production');
    let options = {
      to: "support@globalthesource.com",
      from: "noreply@globalthesource.com",
      subject:  Meteor.settings.public.url + " has restarted",
      text: ''
    }
    console.log('send email');
    sendEmail(options);
  }

  // change the reset password url
  Accounts.urls.resetPassword = (token) => {
    return Meteor.absoluteUrl(`reset/${token}`);
  };
});

const mainInstance = new Main();
mainInstance.start();
console.log(Meteor.settings.public.url + " has restarted");

function sendEmail(options) {
  Email.send(
    options
  );
}
//
// function detectServer() {
//   Meteor.users.find({'status.online': true}).observe({
//     added: function(id) {
//     },
//     removed: function(id) {
//       // console.log('just removed idle', id);
//     }
//   });
//
//   Meteor.publish('userStatus', function(query, options, extra) {
//     // UserStatus.connections.update({_id: extra.connectionId}, {$set: {pathname: extra.pathname}});
//     funcs.syncUserStatus(Meteor.userId());
//     return Meteor.users.find(query, {fields: {status:1, emails: 1, username: 1, profile: 1}});
//   });
//
//
//   UserStatus.events.on("connectionLogin", function(fields) {
//     funcs.syncUserStatus(fields.userId);
//
//     // Meteor.call('users.setEditable');
//   });
//
//   UserStatus.events.on("connectionLogout", function(fields) {
//
//     funcs.syncUserStatus(fields.userId);
//     const allConnections = UserStatus.connections.find().fetch();
//
//     // console.log('all connections', allConnections);
//   });
//
//   UserStatus.events.on("connectionActive", function(fields) {
//     const connection = UserStatus.connections.findOne(fields.connectionId);
//     // console.log('active', connection);
//     if ('pathname' in connection) {
//       // console.log('pathname', connection.pathname);
//       Meteor.call('setConnectionEditable', connection.pathname);
//     }
//     // funcs.syncUserStatus(fields.userId);
//   });
//
//   UserStatus.events.on('connectionIdle', function(fields) {
//     UserStatus.connections.update({_id: fields.connectionId}, {$set: {editable: false}});
//     const connection = UserStatus.connections.findOne(fields.connectionId);
//     // console.log('idle', connection);
//
//     if ('pathname' in connection) {
//       Meteor.call('setConnectionEditable', connection.pathname);
//     }
//     // funcs.syncUserStatus(fields.userId);
//   });
//
//   Meteor.users.find({ "status.online": true }).observe({
//     added: function(id) {
//       // id just came online
//       // console.log('added ', id);
//     },
//     removed: function(id) {
//       // id just went offline
//       // console.log('removed ', id);
//
//     }
//   });
// }
