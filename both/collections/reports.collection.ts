import {MongoObservable} from "meteor-rxjs";
import { Report } from '../models/report.model';

export const Reports = new MongoObservable.Collection<Report>('reports');