import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import {Profile} from '../../../both/models/profile.model';
import { Random } from 'meteor/random';
import { Email } from 'meteor/email';
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
import { generateRegexWithKeywords } from '../../../both/functions/common';
import * as moment from 'moment';
import * as funcs from '../../../both/functions/common';
import {DatabaseService} from "../api/con.service";

import {Promise as MPromise} from 'meteor/promise';
import {TransactionLineItem, TransactionModel} from "../../../both/models/transaction.model";

const {client} = MongoInternals.defaultRemoteCollectionDriver().mongo;

const nonEmptyString = Match.Where((str) => {
  check(str, String);
  return str.length > 0;
});

Meteor.methods({
  async test(methods) {

    const session = client.startSession({mode: 'primary'});
    session.startTransaction();


    // let result = await AllCollections['transactions'].rawCollection().insert(
    //   methods[0].document,
    //   {session}
    // );




    // await AllCollections['transactions'].rawCollection().insert(
    //   methods[0].document,
    //   {session}
    // );
    // await AllCollections['transactions'].rawCollection().insert(
    //   methods[1].document,
    //   {session}
    // );

    // let _methods = [
    //   {
    //     _id: Random.id(),
    //     collectionName: "transactions",
    //     methodType: "insert",
    //     document: {
    //       _id: Random.id(),
    //       "lineItems" : [
    //         {
    //           "_id" : "WurdcexP4naDtGdkF",
    //           createdAt: new Date(),
    //           "createdUserId" : "YoKFKBqCosExsKBHE",
    //           "wharehosueId" : "XZS76uMBAx3nLuqRu",
    //           "binId" : "OlygyPAnmsMDjOVvN",
    //           "qty" : 245,
    //           "cost" : 15.901
    //         },
    //         {
    //           "_id" : "u2SzhRycTmq3yCA9E",
    //           createdAt: new Date(),
    //           "createdUserId" : "YoKFKBqCosExsKBHE",
    //           "wharehosueId" : "XZS76uMBAx3nLuqRu",
    //           "binId" : "qvy9DqyA30TwNpauo",
    //           "qty" : 245,
    //           "cost" : 0.009
    //         }
    //       ],
    //     }
    //   },
    //   {
    //     _id: Random.id(),
    //     collectionName: "transactions",
    //     methodType: "insert",
    //     document: {
    //       _id: Random.id(),
    //       "lineItems" : [
    //         {
    //           "_id" : "WurdcexP4naDtGdkF",
    //           createdAt: new Date(),
    //           "createdUserId" : "YoKFKBqCosExsKBHE",
    //           "wharehosueId" : "XZS76uMBAx3nLuqRu",
    //           "binId" : "OlygyPAnmsMDjOVvN",
    //           "qty" : 245,
    //           "cost" : 15.901
    //         },
    //         {
    //           "_id" : "u2SzhRycTmq3yCA9E",
    //           createdAt: new Date(),
    //           "createdUserId" : "YoKFKBqCosExsKBHE",
    //           "wharehosueId" : "XZS76uMBAx3nLuqRu",
    //           "binId" : "qvy9DqyA30TwNpauo",
    //           "qty" : 245,
    //           "cost" : 0.009
    //         }
    //       ],
    //     }
    //   }
    // ];

    // await Promise.all(_methods.map(  async (_method, index) => {
    //   let result = await AllCollections['transactions'].rawCollection().insert(
    //     _method.document,
    //     {session}
    //   );
    //   return result;
    // }));


    let i = 0;
    while(i < methods.length) {
      try {
        let method:any = methods[i];
        if (method.methodType == 'rawInsert') {
          if (method.args.length == 2) {
            method.args[1] = Object.assign(method.args[1], {session});
          }
          let result = await rawInsert(method.collectionName, [...method.args]);
          // let result = await Meteor.call(method.methodType, 'transactions', {_id: Random.id(), lineItems: []}, {session});
        } else if (method.methodType == 'rawUpdate') {
          // console.log('raw update', method);

          if (method.args.length == 3) {
            method.args[2] = Object.assign(method.args[2], {session});
          }

          // console.log('method.args', method.args[2]);
          let result = await rawUpdate(method.collectionName, method.args[0], method.args[1], method.args[2]);

          // let result = await Meteor.call(method.methodType, method.collectionName, ...method.args, {session});
        }

        //   AllCollections['transactions'].rawCollection().insert(
        //   methods[i - 1].document,
        //   {session}
        // );
      } catch (error) {
        console.log('error', error);
        break;
      }
      i++;
    }


    // const funcs = methods.map(async (_method, index) => {
    //   const result = await AllCollections['transactions'].rawCollection().insert(
    //     _method.document,
    //     {session}
    //   );
    //   console.log('_method', index);
    //   return result;
    // });
    //
    // const promiseresult = await Promise.all(funcs);
    //
    // console.log('rpsadfasdf', promiseresult);





    //
    //
    // ids.forEach(async (id, index) => {
    //
    //   // let res = Meteor.call('rawInsert', 'transactions', docu);
    //   // console.log('asdfasdfasdf', res);
    //   // return res;
    //   // return rawInsert(_method.collectionName, _method.document, {session});
    //
    //   let _method = methods[index];
    //   console.log('done1 ', index);
    //
    //   let result = await AllCollections['transactions'].rawCollection().insert(
    //     _method.document,
    //     {session}
    //   );
    //
    //   console.log('done2 ', index);
    //   //
    //   // console.log('id', id, index);
    //   // try {
    //   //   let result = await AllCollections['transactions'].rawCollection().insert(
    //   //     _method.document,
    //   //     {session}
    //   //   );
    //   //   console.log('done', index);
    //   //   return true;
    //   // } catch (error) {
    //   //   console.log('there is an error', error);
    //   // }
    // });
    //
    // //  await AllCollections['transactions'].rawCollection().insert(
    // //   methods[0].document,
    // //   {session}
    // // );
    // //  await AllCollections['transactions'].rawCollection().insert(
    // //   methods[1].document,
    // //   {session}
    // // );

    console.log('done');
    MPromise.await(session.commitTransaction());
    session.endSession();
    return true;
  },



  checkContractProductPrice() {
    var contracts = AllCollections['customerContracts'].collection.find({}).fetch();

    let arr = [];
    contracts.forEach(function(contract) {

      contract.products.forEach(function (product) {
        var price = product.price.toString().split('.');
        if (price[1]) {
          if (price[1].length > 2) {
            arr.push({
              contractId: contract._id,
              productId: product._id,
              price: product.price
            })
          }
        }
      })
    })
    // console.log('arr', arr);
    return arr;
  },
  tempFind(collectionName, query) {
    return AllCollections[collectionName].collection.find(query).fetch();
  },
  sendEmail(emailData, emailPath, variables) {
    SSR.compileTemplate('htmlEmail', Assets.getText(emailPath));
    emailData.html = SSR.render('htmlEmail', variables);

    try {
      Email.send(emailData);
    }
    catch (e) {
      delete emailData.html;
      return emailData;
    }
  },
  sendSupportEmail(emailData) {
    Email.send(emailData);
  },
  setPassword(userId, newPassword) {
    Accounts.setPassword(userId, newPassword, {});
    return true;
  },
  remove(collectionName, query, justOne) {
    let queryResults = AllCollections[collectionName].collection.find(query).fetch();
    let result = AllCollections[collectionName].collection.remove(query);
    // if (result) {
    //   // Meteor.call('afterRemove', queryResults, collectionName);
    // }
    return result;
  },

  afterRemove(queryResults, collectionName) {
    queryResults.forEach(_doc => {
      let syncDoc = {
        collectionName,
        type: "REMOVE",
        documentId: _doc._id,
        createdAt: new Date()
      };
      let result = AllCollections['systemSyncs'].collection.insert(syncDoc);
      return {result};
    })
  },

  rawInsert(collectionName, document, options?) {
    return AllCollections[collectionName].rawCollection().insert(document, options);
    //
    // document.createdUserId = this.userId;
    // document.createdAt = new Date();
    // if (!('_id' in document)) {
    //   document._id = Random.id();
    // }
    // if (['customerContracts'].indexOf(collectionName) > -1) {
    //   document.isSynced = false
    // }
    //
    // console.log('collectionName', collectionName, document, options);
    // try {
    //   return AllCollections[collectionName].rawColloction().insert(document, options);
    // }
    // catch (e) {
    //   return {error: e};
    // }
  },

  insert(collectionName, document, options) {
    document.createdUserId = this.userId;
    document.createdAt = new Date();
    if (!('_id' in document)) {
      document._id = Random.id();
    }
    if (['customerContracts'].indexOf(collectionName) > -1) {
      document.isSynced = false
    }

    try {
      return AllCollections[collectionName].collection.insert(document, options);
    }
    catch (e) {
      return {error: e};
    }
  },

  insertOne(collectionName, document, options) {
    document.createdUserId = this.userId;
    document.createdAt = new Date();
    if (!('_id' in document)) {
      document._id = Random.id();
    }
    if (['customerContracts'].indexOf(collectionName) > -1) {
      document.isSynced = false
    }

    console.log('documenty', document);
    try {
      return AllCollections[collectionName].rawCollection().insert(document);
      // return document._id;
    }
    catch (e) {
      console.log('error', e);
      return {error: e};
    }
  },
  insertMany(collectionName, documents, options) {
    documents.createdUserId = this.userId;
    documents.createdAt = new Date();
    if (!('_id' in documents)) {
      documents._id = Random.id();
    }
    if (['customerContracts'].indexOf(collectionName) > -1) {
      documents.isSynced = false
    }

    try {
      return AllCollections[collectionName].rawCollection().insert(documents)
      // return document._id;
    }
    catch (e) {
      return {error: e};
    }
  },

  afterInsert(insertResult, collectionName, document) {
    if (insertResult) {
      let syncDoc = {
        collectionName,
        type: 'INSERT',
        documentId: document._id,
      };
      try {
        AllCollections['systemSyncs'].collection.insert(syncDoc);
      } catch (e) {
        console.log('catch', e);
      }
    }
  },

  find(collectionName, query, options) {
    if (collectionName !== null) {
      if (collectionName == 'users') {
        options = {
          fields: {
            services: 0
          }
        }
      }
      return AllCollections[collectionName].collection.find(query, options).fetch();
    } else
      return null;
  },
  findOne(collectionName, query, options) {
    if (!funcs.isEmptyObject(query)) {
      return AllCollections[collectionName].collection.findOne(query, options);
    } else {
      return null;
    }
  },

  sync_FindOne(collectionName, query, options) {
    // let syncFunc = Meteor.wrapAsync(AllCollections[collectionName].collection.findOne(query, options));
    // return syncFunc;

    return AllCollections[collectionName.collectionName].collection.findOne(query, options);
  },
  updateRawCollection(collectionName, query, update, options) {
    try{
      let promise = AllCollections[collectionName].rawCollection().update(query, update, options);
      return promise.then(res => {
        if (res.result.nModified) {
          return { result: 1, message: 'update successfully' };
        } else {
          return { result: 0, message: 'not updated' };
        }
      })
    } catch(e) {
      return e;
    }
  },
  update(collectionName, query, update, options) {
    if (collectionName == 'customerContracts') {
      // console.log('update', update);
    }

    try{
      let updateResult = AllCollections[collectionName].collection.update(query, update, options);

      // if (fieldPath) {
      //   Meteor.call('afterUpdate', collectionName, query, update, updateResult, fieldPath, type);
      // }
      return updateResult;
    } catch(e) {
      return e;
    }
  },

  rawUpdate(collectionName, query, update, options, fieldPath, type) {
    try{
      let updateResult = AllCollections[collectionName].rawCoolection().update(query, update, options);
      return updateResult;
    } catch(e) {
      return e;
    }
  },

  findAndModify(collectionName, query, update, options){
    try {
      let updateResult = AllCollections[collectionName].rawCollection().findAndModify(query, [], update, options);
      return updateResult;
    } catch (e) {
      return e;
    }
  },

  afterUpdate(collectionName, query, update, updateResult, fieldPath, type) {
    if (updateResult == 1) {
      if (collectionName == 'customerContracts') {
        let queryResult = AllCollections[collectionName].collection.find(query).fetch();
        queryResult.forEach(_row => {
          let syncDoc = {
            collectionName,
            fieldPath,
            type: type.toUpperCase(),
            documentId: _row._id,
          };

          try {
            AllCollections['systemSyncs'].collection.insert(syncDoc);
          } catch (e) {
            console.log('catch', e);
          }
        });
      }
    }
  },

  save(collectionName, doc) {
    return AllCollections[collectionName].rawCollection().save(doc);
  },

  'update.remove'(collectionName, query, update, options, fieldPath) {
    return Meteor.call('update', collectionName, query, update, options);
  },

  'update.insert'(collectionName, query, update, options, fieldPath) {
    return Meteor.call('update', collectionName, query, update, options);
  },

  getAllowedCategoryProducts(categoryId) {
    let pipeline = [
      {
        $match: {
          categoryId,
          allowCustomerContract: true
        }
      }
    ];
    return Meteor.call('runAggregate', 'products', pipeline);

  },

  log() {
    return true;
  },

  replaceOne(collectionName, filter, replacement, options) {
    try {
      let promise = AllCollections[collectionName].rawCollection().replaceOne(filter, replacement, {upsert: true});
      return promise.then(res => {
        if (res.result.nModified) {
          return {result: 1, message: 'update successfully'};
        } else {
          return { result: 0, message: 'not updated'};
        }
      })
    }
    catch (e) {
      return {result: 0, message: e};
    }
  },

  updateProfile(profile: Profile): void {
    if (!this.userId) throw new Meteor.Error('unauthorized',
      'User must be logged-in to create a new chat');

    check(profile, {
      name: nonEmptyString,
      picture: nonEmptyString
    });

    Meteor.users.update(this.userId, {
      $set: {profile}
    });
  },

  returnUser(id) {
    return Meteor.users.findOne({_id: id});
  },

  returnBreadcrumbs() {
    return SystemOptions.findOne({name: "breadcrumbs"})
  },


  returnGroup(id) {
    return UserGroups.findOne({_id: id});
  },

  adminUpdateGroup(updatedInfo) {
    return UserGroups.update({_id: updatedInfo.id},{
      $set :{
        name: updatedInfo.name
      }
    });
  },

  removeGroup(groupID) {
    AllCollections['userGroups'].remove({_id: groupID});
  },

  removeGroupFromUserCollection(groupID) {
    return Users.update({},
      {
        $pull: {
      	   "groups":{
      	      $in: [groupID]
      	     }
           }
         },
      { multi: true }
    );
  },


  returnPermission(id) {
    return SystemPermissions.findOne({_id: id});
  },

  returnPermissionNames(array) {
    let result = SystemModules.collection.find({
        _id: {
        $in: array
        }
      }
    ).fetch();
    let nameArray = [];
    for (let i = 0; i < result.length; i++) {
      nameArray.push(result[i]["name"]);
    }
    return nameArray
  },

  addUser(newUser) {
    let result = Users.collection.findOne({username: newUser.username});
    if (result === undefined) {
      let userId = Accounts.createUser(newUser);
      let update = {
        $set:{
          manages: [],
          tenants: [],
          parentTenantId: newUser.parentTenantId,
          createdUserId: this.userId
        }
      };
      Users.collection.update({_id: userId}, update);
      return {result: 'success', subject: "Success", message: "Add Successfully", userId: userId};
    } else {
      return {result: "error", subject: "Error", message: 'Email already exists'};
    }
  },

  addManagesGroupsTenants(userInfo) {
    return Users.update({username: userInfo.email}, {
      $set:{
        manages: [],

        tenants: userInfo.tenants
      }
    })
  },
  returnLookup(id) {
    return SystemLookups.findOne({_id: id});
  },

  adminUpdateUser(updatedInfo) {
    return Meteor.users.update(
      {_id: updatedInfo.id}, {
        $set: {
          "profile.firstName": updatedInfo.firstName,
          "profile.lastName": updatedInfo.lastName,
          "username": updatedInfo.username,
          "emails.0.address": updatedInfo.email
        }
      })
  },

  insertDocument(selectedCollection, insertDocumentInfo){
    let collection = selectedCollection;
    insertDocumentInfo.createdUserId = this.userId;
    insertDocumentInfo.createdAt = new Date();
    // insertDocumentInfo.updatedAt = ""
    // insertDocumentInfo.updatedUserId = ""
    return AllCollections[collection].insert(insertDocumentInfo)
  },

  updateDocument(selectedCollection, Id, updateDocumentInfo){
    return AllCollections[selectedCollection].update({_id: Id}, { $set: updateDocumentInfo })
  },


  addPermission(permissionInfo) {
    let permission = {
      _id: Random.id(),
      createdUserId: Meteor.userId(),
      createdAt: new Date()
    };
    Object.assign(permission, permissionInfo);
    let result = Meteor.call('insert', 'systemPermissions', permission);
    if (typeof result == 'string') {
      Meteor.call('update', 'userGroups',
        {
          parentTenantId: permissionInfo.parentTenantId
        },
        {
          $addToSet: {
            groupPermissions: {
              _id: permission._id,
              value: ""
            }
          }
        },
        {
          multi: true
        });
    }
    return result;
  },

  addPermissionToModule(permissionInfo) {
    return SystemModules.update({name: permissionInfo.module},{
        $push: {
          permissions: permissionInfo.name
      }
    })
  },

  removePermissionFromModule(permissionInfo) {
    return SystemModules.update({name: permissionInfo.module},{
        $pull: {
          permissions: permissionInfo.name
      }
    },{ multi: true })
  },

  adminUpdatePermission(updatedInfo) {
    return SystemPermissions.update(
      {_id: updatedInfo.id}, {
        $set: {
          "name": updatedInfo.name,
          "description": updatedInfo.description,
          "url": updatedInfo.url,
          "updatedUserId": Meteor.userId(),
          "updatedDate": new Date(),
        }
      })
  },

  adminAddGroupsPermissions(permissionName) {
    return UserGroups.update({},
      {
        $push: {
           groupPermissions: {
             name: permissionName,
             value: ""
           }
         }
        },
	    { multi: true }
    )
  },

  adminRemoveGroupsPermissions(permissionName) {
    return UserGroups.update({},
      {
        $pull: {
           groupPermissions: {name: permissionName}
         }
        },
	    { multi: true }
    )
  },

  adminRemovePermissions(id) {
    SystemPermissions.remove({_id: id})
  },

  deleteSystemLookups(deleteID) {
    SystemLookups.remove({_id: deleteID})
  },

  globalSearch(keywords) {

    return Customers.collection.find({name: keywords}).fetch();
  },

  getTenantPermissions(parentTenantId) {
    let pipeline = [
      {
        "$match" : {
          "parentTenantId" : parentTenantId
        }
      },
      {
        "$unwind" : "$modules"
      },
      {
        "$lookup" : {
          "from" : "systemTenants",
          "localField" : "parentTenantId",
          "foreignField" : "_id",
          "as" : "tenant"
        }
      },
      {
        "$unwind" : "$tenant"
      },
      {
        "$project" : {
          "enabled" : {
            "$in" : [
              "$modules",
              "$tenant.modules"
            ]
          },
          "name" : 1.0
        }
      },
      {
        "$match" : {
          "enabled" : true
        }
      },
      {
        "$group" : {
          "_id" : "$_id",
          "name" : {
            "$first" : "$name"
          }
        }
      }
    ];

    return Meteor.call('runAggregate', 'systemPermissions', pipeline);
  },

  getParentTenantPermissions(parentTenantId) {
    return SystemPermissions.collection.find({parentTenantId}).fetch();
  },

  getAllPermissionsUrl() {
    // this returns only the urls in Permissions collection with its name be key of this array
    let urls = {};
    SystemPermissions.collection.find({}).map(permission => {
      urls[permission._id] = permission.url;
    });
    return urls;
  },

  getUserGroupPermissions(tenantId) {
    // this returns this group's permissions of that user.
    let tenants = Users.findOne(this.userId).tenants;
    let tenant:any = tenants.find((tenant:any={}) => {
      return tenant._id == tenantId;
    });
    let groupId = tenant.groups[1];
    // return UserGroups.collection.findOne(groupId).permissions;
    let groupPermissions = UserGroups.collection.findOne(groupId).groupPermissions;

    let result:any = {};
    let length = groupPermissions.length;
    for (let i = 0; i < length; i++) {
      let permission = groupPermissions[i];
      result[permission.name] = permission.value;
    }
    return result;
  },

  userHasPermission(tenantId, permissionName: string): boolean {
    // this check if the user has this permission, like accessCustomers
    let userGroupPermissions = Meteor.call('getUserGroupPermissions', tenantId);
    if (permissionName === 'manageAdmin'){
    }
    return userGroupPermissions[permissionName];
  },

  checkSystemPermission(userId, match) {
    const pipeline = [
      ...(userId ? [{ $match: { _id: userId } }] : []),
      {$project: { _id: 1, tenants: 1}},
      {$unwind: '$tenants'},
      {$unwind: '$tenants.groups'},
      {
            $lookup:
              {
                from: "userGroups",
                localField: "tenants.groups",
                foreignField: "_id",
                as: "groupInfo"
              }
         },
         {$unwind: '$groupInfo'},
         {$unwind: '$groupInfo.groupPermissions'},

         {
            $lookup:
              {
                from: "systemPermissions",
                localField: "groupInfo.groupPermissions._id",
                foreignField: "_id",
                as: "permissionInfo"
              }
         },
      {$unwind: '$permissionInfo'},
      { $project: { 'name': '$permissionInfo.name', 'status': '$groupInfo.groupPermissions.value', 'permissionId': '$permissionInfo._id' } },
      { $match : match },
    ];
    // console.log(JSON.stringify(pipeline));
    
    return Meteor.call('aggregate', 'users', pipeline);
  },

  addGroup(group) {
    let doc = {
      _id: Random.id(),
      name: group.name,
      groupPermissions: group.groupPermissions,
      parentTenantId: group.parentTenantId,
      createdUserId: this.userId,
      createdAt: new Date(),

    };
    Meteor.call('insert', 'userGroups', doc);

    return doc._id;
  },

  getCurrentUserGroups(tenantId: string) {
    const pipeline = [
      {
        $match: {
          _id: this.userId
        }
      },
      {
        $unwind: {
          path: "$tenants"
        }
      },
      {
        $project: {
          groups: "$tenants.groups"
        }
      }
    ];

    return Meteor.call('runAggregate', 'users', pipeline);
  },

  getSystemPermissions(userGroups: any[]) {
    let result:any = {};

    userGroups.forEach((groupId) => {
      // return UserGroups.collection.findOne(groupId).permissions;
      if (groupId) {
        let groupPermissions = UserGroups.collection.findOne(groupId).groupPermissions;

        let length = groupPermissions.length;
        for (let i = 0; i < length; i++) {
          let permission = groupPermissions[i];
          if (permission._id in result) {
            if (result[permission._id] === 'disabled') {
              continue;
            } else if (result[permission._id] === 'enabled') {
              if (permission.value === 'disabled') {
                result[permission._id] = permission.value;
              }
            } else {
              result[permission._id] = permission.value;
            }

          } else {
            result[permission._id] = permission.value;
          }
        }
      }
    });
    return result;
  },

  getUserGroupsPermissions(tenantId) {
    let userGroups = Meteor.call('getCurrentUserGroups', tenantId);
    if (userGroups.length > 0) {
      // merge user's group permissions
      return Meteor.call('getSystemPermissions', userGroups[0].groups);
    } else {
      return [];
    }
  },

  // getMenus(systemOptionName: string, parentTenantId: string) {
  //   let document = SystemOptions.findOne({name: systemOptionName, parentTenantId});
  //   if (document) {
  //     let menus = document.value;
  //     let arr = [];
  //     // get user groups
  //     let userGroups = Meteor.call('getCurrentUserGroups', parentTenantId);
  //     // const parentTenant = SystemTenants.findOne({_id: parentTenantId});
  //     //
  //     // const parentTenantModules = parentTenant.modules;
  //
  //
  //     // merge user's group permissions
  //     let userGroupPermissions = Meteor.call('getSystemPermissions', userGroups);
  //     // let allowedPermissions = Meteor.call('getAllowedPermissions', userGroups);
  //
  //     for (let i = 0; i < menus.length; i++) {
  //       let result = userGroupPermissions[menus[i].permissionId];
  //
  //       let allPermissionsUrl = Meteor.call('getAllPermissionsUrl');
  //       if (result == "enabled") {
  //         let subMenus = menus[i].subMenus.filter(subMenu => {
  //           // if (menus[i].permissionName == 'manageAdmin') {
  //           // }
  //           if (userGroupPermissions[subMenu.permissionId] === 'enabled') {
  //             subMenu.url = allPermissionsUrl[subMenu.permissionId];
  //             return true;
  //           }
  //         });
  //         arr.push({
  //           name: menus[i].name,
  //           label: menus[i].label,
  //           url: allPermissionsUrl[menus[i].permissionName],
  //           subMenus: subMenus,
  //           collapse: false
  //         })
  //       }
  //     }
  //     return arr;
  //   }
  // },

  getMenus() {
    let pipeline = [
      {
        $match: {
          name: "routes"
        }
      },
      {
        $lookup: {
          from: "users",
          pipeline: [
            {
              $match: {
                _id: Meteor.userId()
              }
            },
            {
              $unwind: "$tenants"
            },
            {
              $project: {
                groups: "$tenants.groups"
              }
            },
            {
              $unwind: "$groups"
            },
            {
              $lookup: {
                from: "userGroups",
                localField: "groups",
                foreignField: "_id",
                as: "group"
              }
            },
            {
              $unwind: "$group"
            },
            {
              $unwind: "$group.groupPermissions"
            },
            {
              $group: {
                _id: "$group.groupPermissions._id",
                group: {
                  $addToSet: "$group.groupPermissions.value"
                }
              }
            },
            {
              $project: {
                permissionStatus: {
                  $switch: {
                    branches: [
                      {
                        case: {$in: ["disabled", "$group"]},
                        then: "disabled"
                      },
                      {
                        case: {$in: ["enabled", "$group"]},
                        then: "enabled"
                      },
                    ],
                    default: ""
                  }
                }
              }
            },
            {
              $match: {
                permissionStatus: "enabled"
              }
            },
            {
              $group: {
                _id: "",
                ids: {
                  $addToSet: "$_id"
                }
              }
            }
          ],
          as: "permissions"
        }
      },

      {
        $unwind: "$permissions"
      },
      {
        $addFields: {
          permissionIds: "$permissions.ids"
        }
      },

      {
        $addFields: {
          value: {
            $filter: {
              input: "$value",
              as: "route",
              cond: {
                $in: ["$$route.permissionId", "$permissionIds"]
              }
            }
          }
        }
      },
      {
        $unwind: "$value"
      },
      {
        $addFields: {
          "value.routes": {
            $filter: {
              input: "$value.routes",
              as: "route",
              cond: {
                $in: ["$$route.permissionId", "$permissionIds"]
              }
            }
          }
        }
      },
      {
        $unwind: "$value.routes"
      },
      {
        $lookup: {
          from: "systemPermissions",
          localField: "value.routes.permissionId",
          foreignField: "_id",
          as: "subRoutePermissionName"
        }
      },
      {
        $unwind: "$subRoutePermissionName"
      },
      {
        $lookup: {
          from: "systemPermissions",
          localField: "value.routes.permissionId",
          foreignField: "_id",
          as: "value.routes.permission"
        }
      },
      {
        $unwind: "$value.routes.permission"
      },
      {
        $addFields: {
          "value.routes.sidenavLabel": "$value.routes.permission.label",
          "value.routes.icon": "$value.routes.permission.icon",
        }
      },
      {
        $project: {
          name: "$value.name",
          sidenavLabel: "$value.label",
          url: {$concat: ["/", "$value.url"]},
          routes: {
            url: {$concat: ["/", "$value.url", "/", "$value.routes.url"]},
            sidenavLabel: "$value.routes.permission.label",
            "icon": "$value.routes.permission.icon"
          }
        }
      },
      {
        $group: {
          _id: "$name",
          routes: {
            $push: "$routes",
          },
          url: {
            $first: "$url"
          },
          sidenavLabel: {
            $first: "$sidenavLabel"
          }
        }
      }
    ];
    return Meteor.call('runAggregate', 'systemOptions', pipeline);
  },

  getMenusTest(parentTenantId) {

    const userGroupsPermissions = Meteor.call('getUserGroupsPermissions', {parentTenantId: parentTenantId});

    const routes = SystemOptions.findOne({name: 'routes', parentTenantId}).value;

    let arr:any = [];
    routes.forEach((route, index) => {
      if (userGroupsPermissions[route.permissionId]) {
        let subRoutes = [];
        if ('routes' in route && route.routes.length > 0) {
          route.routes.forEach(subRoute => {

            if (userGroupsPermissions[subRoute.permissionId]== 'enabled') {
              subRoutes.push({
                sidenavLabel: subRoute.sidenavLabel,
                url: "/" + route.url + '/' + subRoute.url,
              })
            }
          })
        }

        arr.push({
          "sidenavLabel": route.sidenavLabel,
          routes: subRoutes
        });
      }
    });



    return arr;
  },

  updateField(collectionName, selector, update) {
     const Collections = [Categories, Customers, Users, UserGroups];
     let arr = {};

     Collections.forEach((Collection:any) => {
       arr[Collection._collection._name] = Collection;
     });

     let Collection = arr[collectionName];
       Collection.collection.update(selector, update);
   },

  getSubMenus(tenantId, systemOptionName: string, menuName: string) {
    let result = [];
    let allPermissionsUrl = Meteor.call('getAllPermissionsUrl');
    let document = SystemOptions.collection.findOne({name: systemOptionName});

    if (document) {
      let menus = document.value;
      let userGroupPermissions = Meteor.call('getUserGroupPermissions', tenantId);

      for (let i = 0; i < menus.length; i++) {
        let menu = menus[i];
        if (menu.name == menuName) {
          for (let j = 0; j < menu.subMenus.length; j++) {
            let subMenu = menu.subMenus[j];
            if (userGroupPermissions[subMenu.permissionName] === 'enabled') {
              result.push({
                label: subMenu.label,
                permissionName: subMenu.permissionName,
                url: allPermissionsUrl[subMenu.permissionName]
              })
            }
          }
          return result;
        }
      }
    }
  },
  getTenants() {
    return Users.collection.findOne(this.userId).tenants;
  },
  getTenant(subdomain) {
    return SystemTenants.collection.find({subdomain: subdomain});
  },

  getCustomerMeetings() {

    let rawUsers = CustomerMeetings.rawCollection();
    let aggregateQuery = Meteor.wrapAsync(rawUsers.aggregate, rawUsers);
    let pipeline = [
      {$match: {status: 'Complete'}}
    ];
    return aggregateQuery(pipeline);

  },

  // getDailyMeetings(query) {
  //   var rawUsers = CustomerMeetings.rawCollection();
  //   var aggregateQuery = Meteor.wrapAsync(rawUsers.aggregate, rawUsers);
  //   var pipeline = query
  //   var result
  //   // console.log('$$$$$$$$$$',pipeline);
  //   result = aggregateQuery(pipeline);
  //
  //   return result;
  // },

  getUsersMeetings(collectionName, query, firstDay, lastDay) {
    let pipeline = query, result;
    let match = {$match: {dateTime: {$gte: new Date(firstDay), $lt: new Date(lastDay)}}};
    pipeline.push(match);
    return Meteor.call('runAggregate', collectionName, pipeline);
  },

  aggregateWithoutCount(collectionName, pipeline) {
    let rawCollection = AllCollections[collectionName].rawCollection();
    let aggregateQuery = Meteor.wrapAsync(rawCollection.aggregate, rawCollection);
    return aggregateQuery(pipeline);
  },

  aggregate(collectionName, pipeline) {
    let rawCollection = AllCollections[collectionName].rawCollection();
    let aggregateQuery = Meteor.wrapAsync(rawCollection.aggregate, rawCollection);
    let result = {
      result: MPromise.await(aggregateQuery(pipeline).toArray()),
      count: [{count: 500}],
      error: ""
    }; 

    let newPipeline = [];
    pipeline.forEach((arg) => {
      Object.keys(arg).forEach((key) => {
        if (key === '$limit' || key === '$skip') {
        } else {
          newPipeline.push(arg);
        }
      });
    });

    newPipeline.push({
      "$count": "count"
    });

    try {
      result.count = MPromise.await(aggregateQuery(newPipeline, {maxTimeMS: 20000, allowDiskUse: true}).toArray());
    } catch (error) {
      console.log('error', error.message);
      result.error = error.message
    }

    return result;
  },

  runAggregate(collectionName, pipeline) {
    let rawCollection = AllCollections[collectionName].rawCollection();
    let aggregateQuery = Meteor.wrapAsync(rawCollection.aggregate, rawCollection);

    try{
      return MPromise.await(aggregateQuery(pipeline, {allowDiskUse: true}).toArray());
      // return aggregateQuery(pipeline, {allowDiskUse: true}).toArray();
    } catch(error) {
      return error;
    }
  },
  getAggregateResultCount(collectionName, pipeline) {
    let rawCollection = AllCollections[collectionName].rawCollection();
    let aggregateQuery = Meteor.wrapAsync(rawCollection.aggregate, rawCollection);


    let newPipeline = [];
    pipeline.forEach((arg) => {
      Object.keys(arg).forEach((key) => {
        if (key === '$limit' || key === '$skip') {
        } else {
          newPipeline.push(arg);
        }
      });
    });

    newPipeline.push({
      "$count": "count"
    });

    let result:any = {};
    try {
      result = MPromise.await(aggregateQuery(newPipeline, {maxTimeMS: 10000, allowDiskUse: true}).toArray());
    } catch (error) {
      console.log('error', error.message);
      result.error = error.message
    }

    return result;
  },

  consoleLog(message) {
    console.log(message);
  },

  // input: master collection name, pipeline
  getAggregations(tenantId, collection: any, pipeline, columns, keywords: any) {
    pipeline.unshift({$match: {
      $or: [
        {
          tenantId: tenantId
        },
        {
          tenants: { $in: [tenantId]}
        }
      ]
    }});

    let rawCollection = AllCollections[collection].rawCollection();
    let aggregateQuery = Meteor.wrapAsync(rawCollection.aggregate, rawCollection);

    let indexOfLimit = findLastIndexInArray(pipeline, "$limit");

    if (keywords) {
      let search = generateRegexWithKeywords(columns, keywords);
      if (indexOfLimit)
        pipeline.splice(indexOfLimit, 0, {$match: search});
      else {
        pipeline.push({$match: search});
      }
    }

    // indexOfLimit = findObjectIndexInArray(pipeline, "$limit");
    //
    // pipeline.splice(indexOfLimit, 1);

    return aggregateQuery(pipeline);
  },

  softDeleteDocument(selectedCollection, documentId) {

    return  AllCollections[selectedCollection].update({_id: documentId},
      {	$set:{"removed": true}
    })
  },

  getSalesForCurrentAndPreviousYear(customer, startDate, endDate){

    let pipeline = [
      {
        $match: {
          'customerId': customer._id,
          'type': {
            $in: ['standard', 'credit memo']
          },
          'status': 'complete',
          'date': {
            '$gte': new Date(new Date().getFullYear(), 0, 1, 0, 0, 0),
            '$lte': new Date()
          },
          'shipToAddress1': customer.branches.address1,
          'shipToAddress2': customer.branches.address2,
          'shipToAddress3': customer.branches.address3,
          'shipToCity': customer.branches.city,
          'shipToState': customer.branches.state,
          'shipToZipCode': customer.branches.zipCode
        }
      },

      {
        $unwind: "$lineItems"
      }, {
        $group: {
          "_id": "_id",
          "total": {
            "$sum": "$lineItems.total"
          },
          "discountAmt": {
            "$max": "$discount"
          }
        }
      }, {
        $project: {
          total: {
            $subtract: ["$total", "$discountAmt"]
          }
        }
      },
      {
        $addFields: {
          total: { $toDouble: "$total" },
        },
      },
    ];

    let currentYearSales = Meteor.call('runAggregate', 'customerInvoices', pipeline);
    pipeline = [
      {
        $match: {
          'customerId': customer._id,
          'type': {
            $in: ['standard', 'credit memo']
          },
          'status': 'complete',
          'date': {
            '$gte': new Date(new Date(new Date().getFullYear() -1 , 0, 1, 0, 0, 0) ),
            '$lte': new Date(moment().subtract(1, 'years').format())
          },
          'shipToAddress1': customer.branches.address1,
          'shipToAddress2': customer.branches.address2,
          'shipToAddress3': customer.branches.address3,
          'shipToCity': customer.branches.city,
          'shipToState': customer.branches.state,
          'shipToZipCode': customer.branches.zipCode
        }
      },

      {
        $unwind: "$lineItems"
      }, {
        $group: {
          "_id": "_id",
          "total": {
            "$sum": "$lineItems.total"
          },
          "discountAmt": {
            "$max": "$discount"
          }
        }
      }, {
        $project: {
          total: {
            $subtract: ["$total", "$discountAmt"]
          }
        }
      },
      {
        $addFields: {
          total: { $toDouble: "$total" },
        },
      },
    ];

    let previousYearSales = Meteor.call('runAggregate', 'customerInvoices', pipeline);
    return {
      currentYearSales: currentYearSales,
      previousYearSales: previousYearSales
    }
  },

  returnCustomerBranches(bounds){
    let pipeline = [
      {$unwind: "$branches"},
      {$match:
        { 'branches.latitude':{$gte: bounds.f.b, $lt: bounds.f.f},
         'branches.longitude':{$gte: bounds.b.b, $lt: bounds.b.f} }
      },
      {
        $addFields: {
          branches: {
            latitude: { $toDouble: "$branches.latitude" },
            longitude: { $toDouble: "$branches.longitude" },
          },
        },
      },
    ];

    return Meteor.call('runAggregate', 'customers', pipeline);
  },

  getPageLogs(pathname: string) {
    let pipeline = [
      {
        $match: {
          "actions.pathname": pathname
        }
      },
      {
        $unwind: "$actions"
      },
      {
        $sort: {
          "actions.date": -1
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: "createdUserId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      }
    ];
    return Meteor.call('runAggregate', 'systemLogs', pipeline);
  },

  getCategoriesProducts(categoriesIds) {
    const pipeline = [
      {
        $match: {
          categoryId: {
            $in: categoriesIds
          }
        }
      }
    ];

    return Meteor.call('runAggregate', 'products', pipeline);
  },

  getCategorySales(year, categoryId) {
    const pipeline1 = [
      {
        $match: {
          categoryId: categoryId
        }
      },
      {
        $group: {
          _id: '',
          productIds: {
            $push: "$_id"
          }
        }
      }
    ];
    const result1 = Meteor.call('runAggregate', 'products', pipeline1);

    if (result1) {
      const pipeline = [
        {
          "$match": {
            "date": {
              $gt: new Date((year).toString()),
              $lt: new Date((year+1).toString())
            },
            "status": "complete"
          }
        },
        {
          "$project": {
            "categoryProductIds": result1[0].productIds,
            "lineItems": 1
          }
        },
        {
          "$project": {
            "lineItems": {
              "$filter": {
                "input": "$lineItems",
                "as": "item",
                "cond": {
                  "$in": [
                    "$$item.productId",
                    "$categoryProductIds"
                  ]
                }
              }
            },
            "categoryProductIds": 1
          }
        },
        {
          "$unwind": {
            "path": "$lineItems",
            "preserveNullAndEmptyArrays": true
          }
        },
        {
          "$group": {
            "_id": "",
            "lineItems": {
              "$push": "$lineItems"
            },
            "categoryProductIds": {
              "$first": "$categoryProductIds"
            }
          }
        },
        {
          "$unwind": "$categoryProductIds"
        },
        {
          "$project": {
            "lineItems": {
              "$filter": {
                "input": "$lineItems",
                "as": "item",
                "cond": {
                  "$eq": [
                    "$$item.productId",
                    "$categoryProductIds"
                  ]
                }
              }
            },
            "categoryProductIds": 1
          }
        },
        {
          "$unwind": {
            "path": "$lineItems",
          }
        },
        {
          $group: {
            _id: "$categoryProductIds",
            units: {
              '$sum': '$lineItems.qtyShipped'
            },
            revenue: {
              '$sum': {
                '$multiply': [
                  '$lineItems.qtyShipped',
                  '$lineItems.price'
                ]
              }
            },
            cost: {
              '$sum': {
                '$multiply': [
                  '$lineItems.qtyShipped',
                  '$lineItems.cost'
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: "",
            units: {
              $sum: "$units"
            },
            revenue: {
              $sum: "$revenue"
            },
            cost: {
              $sum: "$cost"
            }
          }
        },
        {
          '$project': {
            _id: 1,
            units: 1,
            revenue: 1,
            cost: 1,
            net: {
              '$subtract': [
                '$revenue',
                '$cost'
              ]
            },
            gp: {
              '$cond': {
                if: {
                  '$gt': [
                    '$revenue',
                    0
                  ]
                },
                then: {
                  '$subtract': [
                    1,
                    {
                      '$divide': [
                        '$cost',
                        '$revenue'
                      ]
                    }
                  ]
                },
                else: 0
              }
            }
          }
        },
        {
          $addFields: {
            units: { $toDouble: "$units" },
            revenue: { $toDouble: "$revenue" },
            cost: { $toDouble: "$cost" },
            net: { $toDouble: "$net" },
            gp: { $toDouble: "$gp" },
          },
        },
      ];

      return Meteor.call('runAggregate', 'customerInvoices', pipeline);
    } else {}
    return [];
  },

  getCustomerCategorySales(year, customerId, categoryId) {
    const pipeline = [
      {
        $match: {
          date: {
            $gt: new Date(Number(year).toString()),
            $lt: new Date(Number(year+1).toString())
          },
          customerId: customerId,
          status: "complete"

        }
      },
      {
        $unwind: "$lineItems"
      },
      {
        $match: {
          "lineItems.categoryId": categoryId
        }
      },
      {
        $group: {
          _id: "$lineItems.categoryId",
          units: {
            $sum: "$lineItems.qtyShipped"
          },
          revenue: {
            $sum: {$multiply: ["$lineItems.qtyShipped", "$lineItems.price"]}
          },
          cost: {
            $sum: {$multiply: ["$lineItems.qtyShipped", "$lineItems.cost"]}
          }

        }
      },
      {
        $project: {
          _id: 1,
          units: 1,
          revenue: 1,
          cost: 1,
          net: {
            $subtract: ["$revenue", "$cost"]
          },
          gp: {
            $cond: {
              if: {$gt: ["$revenue", 0]}, then: {$subtract: [1, {$divide: ["$cost", "$revenue"]}]}, else: 0
            }
          }
        }
      },
      {
        $addFields: {
          units: { $toDouble: "$units" },
          revenue: { $toDouble: "$revenue" },
          cost: { $toDouble: "$cost" },
          net: { $toDouble: "$net" },
          gp: { $toDouble: "$gp" },
        },
      },
    ];
    // console.log(Util.inspect(pipeline, false, null));

    return Meteor.call('runAggregate', 'customerInvoices', pipeline);
  },

  'users.setEditable' (pathname) {
    // let pageUsers = Meteor.users.find();
    const pageUsers = Meteor.users.find({"status.page": pathname, "status.online": true}, {sort: {"status.landTime": 1}}).fetch();
    const activeUser:any = Meteor.users.find({"status.page": pathname, "status.online": true, "status.editable": true}, {sort: {"status.landTime": 1}}).fetch();
    let isEditableSet = false;
    if (activeUser.length > 0) {
      if (activeUser[0].status.idle) {
        Meteor.call('update', 'users', {_id: activeUser[0]._id}, {$set: {"status.editable": false}});
        isEditableSet = false;
      } else {
        isEditableSet = true;
      }
    }
    if (!isEditableSet) {
      pageUsers.forEach((user:any) => {
        if (!user.status.idle) {
          // Meteor.call('update', 'users', {_id: user._id}, {$set: {"status.editable": true}});
          isEditableSet = true;
        } else {
          // Meteor.call('update', 'users', {_id: user._id}, {$set: {"status.editable": false}});
        }
      });
    }
  },

  getPageConnections (pathname) {
    let pipeline = [
      {
        $match: {
          "status.online": true
        }
      },
      {
        $unwind: "$status.connections"
      },
      {
        $project: {
          firstName: "$profile.firstName",
          lastName: "$profile.lastName",
          personalColor: "$profile.personalColor",
          idle: "$status.connections.idle",
          connectionId: "$status.connections._id",
          lastActivity: "$status.connections.lastActivity",
          landTime: "$status.connections.landTime",
          editable: "$status.connections.editable",
          pathname: "$status.connections.pathname"
        }
      },
      {
        $match: {
          pathname: pathname
        }
      },
      {
        $group: {
          _id: "$_id",
          firstName: {
            $first: "$firstName"
          },
          lastName: {
            $first: "$lastName"
          },
          personalColor: {
            $first: "$personalColor"
          },
          idle: {
            $min: "$idle"
          },
          lastActivity: {
            $min: "$lastActivity"
          },
          landTime: {
            $min: "$landTime"
          },
          editable: {
            $max: "$editable"
          }
        }
      }
    ];
    let currentConnection = Meteor.call('runAggregate', 'users', pipeline);
    return currentConnection;
  },

  setConnectionLandTime(connectionId, pathname) {
    // return UserStatus.connections.update({_id: connectionId}, {$set: {landTime: new Date(), pathname}});
  },

  setConnectionEditable(pathname) {
    // const pageConnections = UserStatus.connections.find({"pathname": pathname}, {sort: {"landTime": 1}}).fetch();
    // const activeConnection:any = UserStatus.connections.find({"pathname": pathname, "editable": true}, {sort: {"landTime": 1}}).fetch();
    //
    // let isEditableSet = false;
    // if (activeConnection.length > 0) {
    //   if (activeConnection[0].idle) {
    //     UserStatus.connections.update({_id: activeConnection[0]._id}, {$set: {editable: false}});
    //     isEditableSet = false;
    //   } else {
    //     isEditableSet = true;
    //   }
    // }
    //
    // if (!isEditableSet) {
    //   pageConnections.forEach((connection:any) => {
    //     if (!connection.idle && !isEditableSet) {
    //       UserStatus.connections.update({_id: connection._id}, {$set: {"editable": true}}, {multi: true});
    //       // funcs.syncUserStatus(connection.userId);
    //       isEditableSet = true;
    //     } else {
    //       UserStatus.connections.update({_id: connection._id}, {$set: {"editable": false}}, {multi: true});
    //       // funcs.syncUserStatus(connection.userId);
    //     }
    //   });
    // }
    //
    // let arr = [];
    // pageConnections.forEach((connection:any) => {
    //   let index = arr.indexOf(connection.userId);
    //   if (index == -1) {
    //     arr.push(connection.userId);
    //   }
    // })
    // arr.forEach(userId => {
    //   funcs.syncUserStatus(userId);
    // })
  },

  getContractId(customerId) {
    const collection = AllCollections['customers'];
    const customer = collection.collection.findOne({_id: customerId});
    return customer.contractId;
  },

  getContractProductsById(contractId) {
    if (contractId) {
      const collection = AllCollections['customerContracts'];
      const contract = collection.collection.findOne({_id: contractId});
      return contract.products;
    }
  },

  _getContractsByProducts(excludedContractIds, productIds) {
    let pipeline = [
      {
        $match: {
          "_id": {
            $nin: excludedContractIds
          }
        }
      },
      {
        $project: {
          products: 1,
          updatedProducts: productIds
        }
      },
      {
        $unwind: "$updatedProducts"
      },
      {
        $project: {
          products: 1,

          in: {
            $in: ["$updatedProducts", "$products._id"]
          }
        }
      },
      {
        $match: {
          in: true
        }
      },
      {
        $group: {
          _id: "$_id"
        }
      }
    ];
  },

  getUpdatedContractProducts(contractId, categoryIds, increasePercentage) {
    let pipeline = [
      {
        $match: {
          _id: contractId
        }
      },
      {
        $unwind: "$products"
      },
      {
        $lookup: {
          from: "products",
          localField: "products._id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $project: {
          contractProduct: "$products",
          product: 1,
        }
      },
      {
        $match: {
          "product.categoryId": {
            $in: categoryIds
          }
        }
      },
      {
        $project: {
          _id: "$contractProduct._id",
          price: "$contractProduct.price",
          newPrice: {
            $multiply: ["$contractProduct.price", increasePercentage]
          }
        }
      },
      {
        $addFields: {
          price: { $toDouble: "$price" },
          newPrice: { $toDouble: "$newPrice" },
        },
      },
    ];
    return Meteor.call('runAggregate', 'customerContracts', pipeline);
  },

  getContractProductByProductId(contractId, productId) {
    const pipeline = [
      {
        $match: {
          _id: contractId,
        }
      },
      {
        $unwind: "$products"
      },
      {
        $match: {
          "products._id": productId
        }
      },
      {
        $project: {
          _id: "$products._id",
          price: "$products.price",
          previousPrice: "$products.previousPrice"
        }
      }
    ]
    return Meteor.call('runAggregate', 'products', pipeline);
  },

  getFullContract(customerAndCategoryIds) {
    let catgoryIds = (customerAndCategoryIds.categoryId.length > 0) ? { "$in": customerAndCategoryIds.categoryId } : { "$ne": [] };

    let pipeline = [
      { $match: { _id: customerAndCategoryIds.customerId } },
      {
        "$lookup": {
          "from": "customerContracts",
          "localField": "contractId",
          "foreignField": "_id",
          "as": "contractInfo"
        }
      },
      {
        "$unwind": "$contractInfo"
      },
      {
        "$project": {
          "_id": 1,
          "contractProducts": "$contractInfo.products"
        }
      },
      {
        "$unwind": "$contractProducts"
      },
      {
        "$lookup": {
          "from": "products",
          "localField": "contractProducts._id",
          "foreignField": "_id",
          "as": "productInfo"
        }
      },
      {
        "$unwind": "$productInfo"
      },
      {
        "$addFields": {
          "aliasInfo": '$productInfo.customers'
        }
      },
      {
        "$unwind": {
          "path": "$aliasInfo",
          "preserveNullAndEmptyArrays": true
        }
      },
      {
        "$project": {
          "_id": 1,
          "contractProducts": 1,
          "productInfo": {
            "_id": "$productInfo._id",
            "product": "$productInfo.name",
            "description": "$productInfo.description",
            "categoryId": "$productInfo.categoryId",
            'caseQty': {
              "$cond": {
                "if": {
                  "$gt": [
                    "$productInfo.shippingCaseQty",
                    1
                  ]
                },
                "then": "$productInfo.shippingCaseQty",
                "else": ""
              }
            },
            "alias": {
              "$cond": {
                "if": {
                  "$eq": [
                    "$aliasInfo._id",
                    "$_id"
                  ]
                },
                "then": "$aliasInfo.name",
                "else": ""
              }
            }
          }
        }
      },
      {
        "$group": {
          "_id": "$productInfo._id",
          "contractProducts": {
            "$first": "$contractProducts"
          },
          "productInfo": {
            "$max": "$productInfo"
          },
        }
      },
      {
        "$lookup": {
          "from": "categories",
          "localField": "productInfo.categoryId",
          "foreignField": "_id",
          "as": "categoryInfo"
        }
      },
      {
        "$unwind": "$categoryInfo"
      },
      { "$match": { 'categoryInfo.allowCustomerContract': true } },
      {
        "$project": {
          "_id": 1,
          "contractProducts": 1,
          "productInfo": 1,
          "categoryInfo": {
            "category": "$categoryInfo.name",
            "description": {
              "$concat": [
                "$categoryInfo.name",
                " - ",
                "$categoryInfo.description"
              ]
            },
            "categoryId": "$categoryInfo._id"
          }
        }
      },
      { "$sort": { "productInfo.product": 1 } },
      {
        "$match": {
          "contractProducts.price": {
            $ne: 0
          }
        }
      },
      {
        "$group": {
          "_id": "$categoryInfo.category",
          "categoryId": {
            "$first": "$categoryInfo.categoryId"
          },
          "categoryDescription": {
            "$first": "$categoryInfo.description"
          },
          "row": {
            "$push": {
              'customerPartNo': "$productInfo.alias",
              "partNumber": "$productInfo.product",
              "description": "$productInfo.description",
              "price": { 
                $toDouble: "$contractProducts.price" 
              },
              'caseQty': {
                $cond: [{ $ne: ["$productInfo.caseQty", ''] }, { "$toDouble": "$productInfo.caseQty" }, '']
              }
            }
          }
        }
      },
      {
        "$match": {
          "categoryId": catgoryIds,
        }
      },
      {
        "$sort": {
          _id: 1
        }
      }
    ];
    // console.log(JSON.stringify(pipeline));
    return Meteor.call('runAggregate', 'customers', pipeline);
  },

  'systemOptions.getPermissionIds'(parentTenantId) {
    const pipeline = [
      {
        $match: {
          name: "routes",
          parentTenantId
        }
      },
      {
        $unwind: "$value"
      },
      {
        $project: {
          "permissionId": "$value.permissionId",
          "url": "$value.url",
          "routes": "$value.routes",
          "sidenavLabel": "$value.sidenavLabel"
        }
      }
    ];

    return Meteor.call('runAggregate', 'systemOptions', pipeline);
  },

  'systemOptions.getPermissionIdByUrl'(url, parentTenantId) {
    const pipeline = [
      {
        $match: {
          name: "routes",
          parentTenantId
        }
      },
      {
        $unwind: "$routes"
      },
      {
        $match: {
          "routes.url": url
        }
      },
      {
        $project: {
          "permissionId": "$routes.permissionId",
          "url": "$routes.url",
          "subMenus": "$routes.subMenus"
        }
      }

    ];

    return Meteor.call('runAggregate', 'systemOptions', pipeline);
  },

  getContractCategory(contractId, categoryId) {
    const pipeline = [
      {
        $match: {
          _id: contractId,
        }
      },
      {
        $unwind: "$categories"
      },
      {
        $match: {
          "categories._id": categoryId
        }
      },
      {
        $project: {
          priceLevel5Percent: "$categories.priceLevel5Percent"
        }
      },
      {
        $addFields: {
          priceLevel5Percent: { $toDouble: "$priceLevel5Percent" },
        },
      },
    ];
    return Meteor.call('runAggregate', 'customerContracts', pipeline);
  },

  'customerContracts.updateProductsPrice'() {
    const s1_nothing = [
      '2sSV6jxDQomDokzxE',
      'UmKQUM2SrN4OnFOwk',
      'FhFzqNqyaS6wrESjo',
      'vWNv8Tx7w8rFHHWe3',
      'xLrTiazPETds4xtN6',
      'uxbqNZzrCScmNkWoI'];
    const s1c1 = 'q7eWGm6mJHFSsrA4w';
      const s1c1s1_nothing = ['1800', '1900', '1950', '3100', '3200', '3900', '6100', '6200'];
      // const s1c1s1_default = ['1800', '1900', '1950', '3100', '3200', '3900', '6100', '6200'];
    const s1c2 = 'PTELsGb0Vnwy2Bsee';
      const s1c2s1_nothing = ['1800', '1900', '1950', '3100', '3200', '3900', '6100', '6200', '9500'];

    const s1c3 = '1ggDZ1pM60Hl61ciU';
      const s1c3_nothing = ['1800', '1900', '1950', '3100', '3200', '3900', '6100', '6200'];
      const s1c3_default_s1c1 = ['WN-7J', '5004/1/2'];

    const s1c4 = 'MDWGb5tUsReoWLTcY';
    const s1c4s1c1_if = ['1800', '1900', '3100', '3200', '3900', '6100', '6200'];

    const s1c5 = 'I7ChzlW7RfGBMFtY1';
      const s1c5s1c1_if = ['1800', '1900', '3100', '3200', '3900', '6100', '6200'];

    const s1c6 = 'TeBlAiatmvEBQqcKw';
      const s1c6s1_nothing = ['1800', '1900', '1950', '3100', '3200', '3900', '6100', '6200'];
        const s1c6s1_default_s1c1 = '8073';
        const s1c6s1_default_s1c2 = '8077';

    const s1c7 = 'fKeWFuZVOxeiD7bvX';
    const s1c7s1_if = ['1800', '1900', '1950', '3100', '3200', '3900', '6100', '6200'];

    const s1_default_s1_nothing = ['1800', '1900', '1950', '3100', '3200', '3900', '6100', '6200'];





    const pipeline = [
      {
        $unwind: "$products"
      },
      {
        $lookup: {
          from: "products",
          localField: "products._id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $lookup: {
          from: "categories",
          localField: "product.categoryId",
          foreignField: "_id",
          as: "productCategory"
        }
      },
      {
        $unwind: "$productCategory"
      },
      {
        $project: {
          _id: 1,
          product: {
            _id: "$product._id",
            categoryName: "$productCategory.name",
            productName: "$product.name",
            price: "$products.price",
            previousPrice: "$products.previousPrice",
            isSynced: "$products.isSynced",
            categoryId: "$productCategory._id",
            createdUserId: "$products.createdUserId",
            createdAt: "$products.createdAt"
          }
        }
      },
      {
        $group: {
          _id: "$_id",
          products: {
            $push: "$product"
          }
        }
      }
    ];

    let contracts = Meteor.call('runAggregate', 'customerContracts', pipeline);

    return contracts;
    //
    // contracts.forEach(contract => {
    //   let contractId = contract._id;
    //   // if (contractId in ) {
    //   //
    //   // }
    //
    //
    //   // switch(contract._id) {
    //   //   case 1:
    //   //     break;
    //   //   case "2":
    //   //     break;
    //   //   case "3":
    //   //     break;
    //   //   case "4":
    //   //     break;
    //   //   case "5":
    //   //     break;
    //   //   case "6":
    //   //     break;
    //   //   case "7":
    //   //     break;
    //   //
    //   // }
    //
    // })
    //
    //



    // const result = AllCollections['Copy_of_customerContracts'].collection.find({}, {limit: 10}).fetch();
  },

  getAllowedRoutes(query) {
    const pipeline = [];
    Meteor.call('runAggregate', 'systemOptions', pipeline);
  },

  'systemOptions.getModulePermissionIdByPermissionId'(permissionId) {
    const pipeline = [
      {
        $match: {
          _id: permissionId
        }
      },
      {
        $project: {
          moduleId: 1
        }
      },
      {
        $lookup: {
          from: "systemPermissions",
          localField: "moduleId",
          foreignField: "moduleId",
          as: "modulePermission"
        }
      },
      {
        $unwind: "$modulePermission"
      },
      {
        $match: {
          "modulePermission.isModulePermission": true
        }
      },
      {
        $lookup: {
          from: "systemModules",
          localField: "moduleId",
          foreignField: "_id",
          as: "module"
        }
      },
      {
        $unwind: "$module"
      },
      {
        $project: {
          moduleId: 1,
          moduleName: "$module.name",
          modulePermissionId: "$modulePermission._id",
          pagePermissionId: "$_id"
        }
      }
    ];

    return Meteor.call('runAggregate', 'systemPermissions', pipeline);
  },
  syncDatabase(collectionName) {
    // live database
    let db = new DatabaseService();
    let liveUrl = 'mongodb+srv://deploy_4126:YdTt6fTRaJhAjYcQ@cluster0-uoly7.mongodb.net/app-yibas-angular';
    let dbConn = db.newConnection(liveUrl);
    let liveCollection = dbConn.open(collectionName);
    const liveData = liveCollection.find().fetch();

    AllCollections[collectionName].collection.remove({});
    AllCollections[collectionName].rawCollection().insert(liveData, {ordered: true});

    return 1;
  },

  unitTesting(collectionName) {
    let db = new DatabaseService();
    let liveUrl = 'mongodb://deploy:GdqOO9sRUl6VO6pDv@ds057976-a0.mlab.com:57976,ds057976-a1.mlab.com:57976/unit-?replicaSet=rs-ds057976';
    let dbConn = db.newConnection(liveUrl);
    let liveCollection = dbConn.open(collectionName);
  },

});


function findIndexInArray(arr: any[], objectKey) {
  return arr.findIndex((obj) => {
    let result = Object.keys(obj).some((key) => {
      if (key == objectKey) {
        return true
      }
    });
    if (result) {
      return true;
    }
  })
}

function findLastIndexInArray(arr: any[], objectKey) {
  let lastIndex;
  for (let i = arr.length-1; i>= 0; i--) {
    let obj = arr[i];
    let result = Object.keys(obj).some((key) => {
      if (key == objectKey) {
        return true
      }
    });
    if (result) {
      lastIndex  = i;
      break;
    }
  }
  return lastIndex;
}

function generateMongoID () {
  let mongoID = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for( let i=0; i < 17; i++ ) {
    mongoID += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return mongoID;
}

function insert(collectionName, document, options) {
  return AllCollections[collectionName].collection.insert(document, options);
}

function rawInsert(collectionName, document, options?) {
  return AllCollections[collectionName].rawCollection().insert(document, options);
}


function rawUpdate(collectionName, query?, update?, options?) {
  return AllCollections[collectionName].rawCollection().update(query, update, options);
}