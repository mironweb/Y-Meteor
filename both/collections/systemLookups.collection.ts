import {MongoObservable} from "meteor-rxjs";
import { SystemLookup } from '../models/systemLookup.model';

export const SystemLookups = new MongoObservable.Collection<SystemLookup>('systemLookups');