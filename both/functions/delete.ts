import {MeteorObservable} from "meteor-rxjs";
import { Meteor } from 'meteor/meteor';


export function deleteUserFilter(filterName, lookupName, parentTenantId) {
  const query = {
    name: filterName,
    lookupName,
    parentTenantId
  };
  return MeteorObservable.call('deleteUserFilter', query, {justOne: true}).subscribe();
}