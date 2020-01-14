import {MongoObservable} from "meteor-rxjs";
import { salespersonTerritory } from '../models/salespersonTerritory.model';

export const salespersonTerritories = new MongoObservable.Collection<salespersonTerritory>('salespersonTerritories');