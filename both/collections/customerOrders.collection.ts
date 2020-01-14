import {MongoObservable} from "meteor-rxjs";
import { CustomerOrder } from '../models/customerOrder.model';

export const CustomerOrders = new MongoObservable.Collection<CustomerOrder>('customerOrders');


