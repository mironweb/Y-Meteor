import {MongoObservable} from "meteor-rxjs";

export const SystemAlerts = new MongoObservable.Collection<any>('systemAlerts');
