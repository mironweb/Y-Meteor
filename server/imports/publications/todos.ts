import { Meteor } from 'meteor/meteor';
import { Counts } from 'meteor/tmeasday:publish-counts';

import { Todos } from '../../../imports/collections/todos';

Meteor.publish('todoList', function() {
  return Todos.find({});
});
