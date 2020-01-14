import { MongoObservable } from 'meteor-rxjs';
import { SystemTenantModal } from '../models/systemTenant.model';

export const SystemTenants = new MongoObservable.Collection<SystemTenantModal>('systemTenants');