import {MongoObservable} from "meteor-rxjs";
import { CustomerAliases } from '../models/customerAlias.model';

export const CustomerAlias = new MongoObservable.Collection<CustomerAliases>('customerAlias');