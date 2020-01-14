import {MongoObservable} from "meteor-rxjs";
import {CustomerShipment} from "../models/customerShipment.model";

export const CustomerShipments = new MongoObservable.Collection<CustomerShipment>('customerShipments');
