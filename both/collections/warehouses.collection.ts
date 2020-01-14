import { MongoObservable } from 'meteor-rxjs';
import { Warehouse } from '../models/warehouse.model';

export const Warehouses = new MongoObservable.Collection<any>('warehouses');
