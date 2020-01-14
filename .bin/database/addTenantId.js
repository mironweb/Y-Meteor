/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/addTenantId.js')
 */

function initialize() {
  print("Adding Tenant ID into collections");

  var collections = [
    "categories",
    "customerContracts",
    "customerInvoices",
    "customerMeetings",
    "customerOrders",
    "customerPayments",
    "customerPendingData",
    "customerQuotes",
    "customerShipments",
    "customers",
    "ledgerAccounts",
    "productionOrders",
    "productionRuns",
    "products",
    "salespersonTerritories",
    "vendorOrders",
    "vendors",
    "warehouseBins",
    "warehouses"
  ];

  collections.forEach(function(collection) {
    print(`  Processing ${collection}`);

    const totalDocument = db[collection].count();

    db[collection].update(
      {},
      { $set: { tenantId: "4sdRt09goRP98e456" } },
      { upsert: false, multi: true }
    );

    const totalProcessed = db[collection]
      .find({ tenantId: "4sdRt09goRP98e456" })
      .count();
    print(`  Total documents processed: ${totalProcessed} / ${totalDocument} \n`);
  });
}
initialize();