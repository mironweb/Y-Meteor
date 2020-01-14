import { Products } from '../../../both/collections/products.collection';
import { Counts } from 'meteor/tmeasday:publish-counts';
import {Meteor} from 'meteor/meteor';
Meteor.publish('one_products', function(query: any, options: any) {

  Counts.publish(this, 'one_products', Products.find(query).cursor, {noReady: false});
  return Products.collection.find(query, options);

})