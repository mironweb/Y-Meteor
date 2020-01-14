import {MongoObservable} from "meteor-rxjs";

export const CustomerPendingData = new MongoObservable.Collection<any>('customerPendingData');