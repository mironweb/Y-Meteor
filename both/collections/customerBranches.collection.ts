import {MongoObservable} from "meteor-rxjs";
import { CustomerBranch } from '../models/customerBranch.model';

export const CustomerBranches = new MongoObservable.Collection<CustomerBranch>('customerBranches');