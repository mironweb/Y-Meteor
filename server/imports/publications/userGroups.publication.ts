import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Counts } from 'meteor/tmeasday:publish-counts';

import { UserGroups } from '../../../both/collections/userGroups.collection';
import { UserGroup } from '../../../both/models/userGroup.model';

// Meteor.publish('adminGroups', function(): Mongo.Cursor<UserGroup> {
//   Counts.publish(this, 'adminGroups', UserGroups.find({}).cursor, {noReady: false});
//
//   return UserGroups.collection.find({}, {limit: 10});
// });
