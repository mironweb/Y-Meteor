import {MongoObservable} from "meteor-rxjs";

export const WarehouseBins = new MongoObservable.Collection<any>('warehouseBins');