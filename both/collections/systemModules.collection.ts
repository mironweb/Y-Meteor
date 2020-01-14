import {MongoObservable} from "meteor-rxjs";

export const SystemModules = new MongoObservable.Collection<any>('systemModules');

