import {MongoObservable} from "meteor-rxjs";
import { CustomerQuote } from '../models/customerQuote.model';

export const CustomerQuotes = new MongoObservable.Collection<CustomerQuote>('customerQuotes');


