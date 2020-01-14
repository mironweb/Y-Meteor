import {MongoObservable} from "meteor-rxjs";

export const SystemJS = new MongoObservable.Collection<any>('system.js');