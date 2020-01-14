import {MongoObservable} from "meteor-rxjs";
import { SystemLog } from '../models/systemLog.model';

export const SystemLogs = new MongoObservable.Collection<SystemLog>('systemLogs');