import { Meteor } from 'meteor/meteor';
import { Counts } from 'meteor/tmeasday:publish-counts';
import { Users } from '../../../both/collections/users.collection';
import { UserGroups } from '../../../both/collections/userGroups.collection';
import { SystemPermissions } from '../../../both/collections/systemPermissions.collection';
import {} from ''

Meteor.publish('allUsers', function() {
  return Users.collection.find();
})

Meteor.publish('adminUsers', function(selector: any, options: any, keywords: string) {
  if (!this.userId) return;

  let fields = options.fields;

  let select = {};
  // if keywords are none
  select['groups'] = {$in: ['wmQgkMnOYymQKH5fl']};
  if (!keywords || keywords == '') {
    Object.assign(select, selector);
  } else {
    Object.assign(select, generateRegex(fields, keywords));
  }


  Counts.publish(this, 'adminUsers', Users.find(select).cursor, {noReady: false});

  return Users.collection.find(select, options);
});


Meteor.publish('manageUserManages', function(selector: any, options: any, keywords: string) {

  if (!this.userId) return;

  let fields = options.fields;

  let select;
  select = selector;
  if (!keywords || keywords == '') {
    // Object.assign(select, selector);
  } else {
    Object.assign(select, generateRegex(fields, keywords));
  }


  Counts.publish(this, 'manageUserManages', Users.find(select).cursor, {noReady: false});

  return Users.collection.find(select, options);
});

Meteor.publish('updateGroupPermissions', function(selector: any, options: any, keywords: string) {

  if (!this.userId) return;

  let fields = options.fields;

  let select;
  select = selector;
  if (!keywords || keywords == '') {
    // Object.assign(select, selector);
  } else {
    Object.assign(select, generateRegex(fields, keywords));
  }


  Counts.publish(this, 'updateGroupPermissions', SystemPermissions.find(select).cursor, {noReady: false});

  return SystemPermissions.collection.find(select, options);
});


Meteor.publish('currentUser', function() {
  return Users.collection.find(this.userId, {
    fields: {
      profile: 1,
      manages: 1,
      groups: 1,
      tenants: 1,
      status: 1
    }
  })
})

Meteor.publish('one_users', function(documentId) {
  return Users.collection.find(documentId, {
    fields: {
      profile: 1,
      manages: 1,
      groups: 1,
      tenants: 1
    }
  })
})

Meteor.publish('one_userGroups', function(documentId) {
  return UserGroups.collection.find(documentId, {
    fields: {
      name: 1,
      permissions: 1
    }
  })
})


// Meteor.publish('groups', function() {
//
//   return UserGroups.collection.find({});
//
// })

Meteor.publish('test', function(test) {
})
//
// Meteor.publish('updateUserGroups', function(selector: any, options: any, keywords: string) {
//   if (!this.userId) return;
//
//   let fields = options.fields;
//
//   let select;
//   select = selector;
//   if (!keywords || keywords == '') {
//     // Object.assign(select, selector);
//   } else {
//     Object.assign(select, generateRegex(fields, keywords));
//   }
//
//   Counts.publish(this, 'updateUserGroups', UserGroups.find(select).cursor, {noReady: false});
//   return UserGroups.collection.find({});
// })


function generateRegex(fields: Object, keywords) {
  let obj = {
    $or: []
  };
  Object.keys(fields).forEach((key, index) => {
    obj.$or.push({
      [key]: {$regex: new RegExp(keywords, 'i')}
    })

  });
  return obj;
}
