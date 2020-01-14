import {MongoObservable} from "meteor-rxjs";

export const SystemSyncs = new MongoObservable.Collection<any>('systemSyncs');

