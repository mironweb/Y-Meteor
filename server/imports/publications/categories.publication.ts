// import { Categories } from '../../../both/collections/categories.collection';
// import { Customers } from '../../../both/collections/customers.collection';
//
// import { Counts } from 'meteor/tmeasday:publish-counts';
// const Collections = [Categories, Customers];
// let arr = {};
// Collections.forEach((Collection:any) => {
//   let obj = {};
//   arr[Collection._collection._name] = Collection;
// })
//
// Object.keys(arr).forEach((collectionName:any) => {
//   let Collection = arr[collectionName];
//   Meteor.publish(collectionName, function (selector: any, options: any, keywords: string) {
//     let fields = options.fields;
//
//     let select;
//     if (!keywords || keywords == '') {
//       select = selector;
//     } else {
//       select = generateRegex(fields, keywords);
//     }
//     select.tenantId = selector.tenantId;
//
//     Counts.publish(this, collectionName, Collection.find(select).cursor, {noReady: false});
//
//     this.onStop(() => {
//     });
//
//     options.fields.tenantId = 1;
//
//     return Collection.collection.find(select, options);
//   });
// })
//
// function generateRegex(fields: Object, keywords) {
//   let obj = {
//     $or: []
//   };
//   Object.keys(fields).forEach((key, index) => {
//     obj.$or.push({
//       [key]: {$regex: new RegExp(keywords, 'i')}
//     })
//   });
//   return obj;
// }