import {MongoObservable} from "meteor-rxjs";

export const CronJobs = new MongoObservable.Collection<any>('cronJobs');
