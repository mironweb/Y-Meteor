import { MongoObservable } from "meteor-rxjs";
import { ProductionRunModel } from '../models/productionRun.model';
export const ProductionRuns = new MongoObservable.Collection<ProductionRunModel>('productionRuns');