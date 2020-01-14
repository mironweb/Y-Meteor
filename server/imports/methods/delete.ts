import { AllCollections } from '../../../both/collections';
import { Meteor } from 'meteor/meteor';

Meteor.methods({
  deleteUserFilter(query, options) {
    AllCollections['userFilters'].remove(query, options);
  }
});