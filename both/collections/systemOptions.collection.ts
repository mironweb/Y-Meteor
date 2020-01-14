import {MongoObservable} from "meteor-rxjs";

export const SystemOptions = new MongoObservable.Collection<any>('systemOptions');

