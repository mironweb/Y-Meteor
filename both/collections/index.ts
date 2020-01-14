import { Users } from './users.collection';
import { SystemTenants } from './systemTenants.collection';
import { Categories } from './categories.collection';
import { Customers } from './customers.collection';
import { CustomerMeetings } from './customerMeetings.collection';
import { UserGroups } from './userGroups.collection';
import { CustomerContracts, CopyCustomerContracts } from './customerContracts.collection';
import { UserPermissions } from './userPermissions.collection';
import { SystemLookups } from './systemLookups.collection';
import { SystemOptions } from './systemOptions.collection';
import { SystemAlerts } from './systemAlerts.collection';
import { SystemModules } from './systemModules.collection';
import { SystemPermissions } from './systemPermissions.collection';
import { SystemLogs } from './systemLogs.collection';
import { Products } from './products.collection';
import { Warehouses } from './warehouses.collection';
import { WarehouseBins } from './warehouseBins.collection';
import { CustomerOrders } from './customerOrders.collection';
import { CustomerQuotes } from './customerQuotes.collection';
import { CustomerInvoices } from './customerInvoices.collection';
import { UserFilters } from './userFilters.collection';
import { LedgerAccounts } from './ledgerAccounts.collection';
import { CustomerAlias } from './customerAlias.collection';
import { VendorOrders } from './vendorOrders.collection';
import { MeetingNote } from './meetingNotes.collection';
import { SystemSyncs } from './systemSyncs.collection';
import { CustomerPendingData } from './customerPendingData.collection';
import { CustomerShipments } from './customerShipments.collection';
import { ProductionOrders } from './productionOrders.collection';
import { ProductionRuns } from './productionRuns.collection';
import { SystemJS } from './systemJS.collection';
import { Transactions } from './transactions.collection';
import { PaymentApprovals } from './paymentApprovals.collection';

const Collections = [
  CustomerMeetings,
  CustomerContracts,
  CustomerQuotes,
  Users,
  Customers,
  Categories,
  SystemTenants,
  UserGroups,
  UserPermissions,
  SystemLookups,
  SystemOptions,
  SystemAlerts,
  SystemModules,
  SystemPermissions,
  Products,
  Warehouses,
  WarehouseBins,
  CustomerOrders,
  UserFilters,
  CustomerInvoices,
  SystemLogs,
  LedgerAccounts,
  CopyCustomerContracts,
  CustomerAlias,
  VendorOrders,
  MeetingNote,
  SystemSyncs,
  CustomerPendingData,
  CustomerShipments,
  ProductionOrders,
  ProductionRuns,
  SystemJS,
  Transactions,
  PaymentApprovals
];

let AllCollections = {};

Collections.forEach((Collection:any) => {
  AllCollections[Collection._collection._name] = Collection;
});

export { AllCollections };
