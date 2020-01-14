import {MongoObservable} from "meteor-rxjs";
import { CustomerInvoice } from '../models/customerInvoice.model';

export const CustomerInvoices = new MongoObservable.Collection<CustomerInvoice>('customerInvoices');


