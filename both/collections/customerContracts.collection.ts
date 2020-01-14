import {MongoObservable} from "meteor-rxjs";
import { CustomerContractModel } from '../models/customerContract.model';

export const CustomerContracts = new MongoObservable.Collection<any>('customerContracts');
export const CopyCustomerContracts = new MongoObservable.Collection<any>('Copy_of_customerContracts');