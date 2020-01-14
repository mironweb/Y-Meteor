import {MongoObservable} from "meteor-rxjs";
import { CustomerModel } from '../models/customer.model';

export const Customers = new MongoObservable.Collection<CustomerModel>('customers');

Customers.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});