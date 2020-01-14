import {MongoObservable} from "meteor-rxjs";
import { Role } from '../models/role.model';

export const Roles = new MongoObservable.Collection<Role>('roles');