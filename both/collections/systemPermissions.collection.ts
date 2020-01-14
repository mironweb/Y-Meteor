import {MongoObservable} from "meteor-rxjs";


export const SystemPermissions = new MongoObservable.Collection<any>('systemPermissions');


SystemPermissions.deny({
  insert() { return true },
  update() { return true },
  remove() { return true }
});
