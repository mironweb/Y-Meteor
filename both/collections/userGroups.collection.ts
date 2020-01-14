// has default, belongs to tenantId

import {MongoObservable} from "meteor-rxjs";

export const UserGroups = new MongoObservable.Collection<any>('userGroups');

