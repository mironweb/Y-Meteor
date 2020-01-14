import {MongoObservable} from "meteor-rxjs";
import { VendorOrder } from '../models/vendorOrder.model';

export const VendorOrders = new MongoObservable.Collection<VendorOrder>('vendorOrders');