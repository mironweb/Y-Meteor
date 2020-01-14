import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';

export const UserRoles = new MongoObservable.Collection<any>("userRoles");

function loggedIn() {
  return !!Meteor.user();
}

UserRoles.allow({
  insert: loggedIn,
  update: loggedIn,
  remove: loggedIn
});
