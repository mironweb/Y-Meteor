import {MongoObservable} from "meteor-rxjs";

let collectionName = '';


if (Meteor.isProduction) {
  collectionName += 'dev_';
}

collectionName += "categories";

export const Categories = new MongoObservable.Collection<any>('categories');

Categories.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
