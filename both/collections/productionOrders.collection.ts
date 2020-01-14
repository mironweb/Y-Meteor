import { MongoObservable } from "meteor-rxjs";
import {ProductionOrderModel} from '../models/productionOrder.model'

export const ProductionOrders = new MongoObservable.Collection<ProductionOrderModel>('productionOrders');