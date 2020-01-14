const DRY_RUN = false;

function delete_function (collection, inclusiveQuery, limit = 20) {
    const all_records = db.getCollection(collection).count();
    const toKeep = db.getCollection(collection).find(inclusiveQuery, {_id: 1}).limit(limit).toArray().map(obj => obj._id);

    const exclusiveQuery = { _id: { $nin: toKeep }};
    // flatten "toKeep"

    print(` -keeping ${toKeep.length} of ${all_records} "${collection}"`);
    if (!DRY_RUN) {
        db.getCollection(collection).remove(exclusiveQuery);
    }
};

function empty(collection, keep = 1) {
    const oneRecord = db.getCollection(collection).find({}, {_id: 1})[0];
    if (!oneRecord._id) {
        print (` -Cannot empty ${collection} - already empty`);
        return;
    }

    const oneRecordId = oneRecord._id;
    delete_function(collection, { _id: oneRecordId}, keep)
}

function emptyAll(collection) {
    delete_function(collection, {_id: null});
}

const HIGH_LEVEL_ENTITIES = ['users', 'products', 'systemTenants', 'customers'];
const ENTITIES_TO_KEEP_ONE_RECORD = ['__kdconfig', '__kdtimeevents', '__kdtraces', 'systemSyncs', 'systemAlerts'];

const ENTITIES_TO_EMPTY = ['cronHistory', 'customerPaymentTerms', 'ledgerTransactions', 'ledgerTransactions',
    'meteor_accounts_loginServiceConfiguration', 'myJobQueue.jobs', 'objectlabs-system',
    'objectlabs-system.admin.collections', 'productTransactions', 'users_copy', 'userActivities', 'reports'];

const ENTITIES_TO_KEEP_ALL = ['cronJobs', 'demo-collection', 'emojis', 'categories', 'warehouses', 'warehouseBins', 'userRoles', 'userPermissions',
    'systemPermissions', 'systemSchemaMaps', 'systemOptions', 'systemMessages', 'systemModules', 'meetingNotes', 'userGroups'];

const TENANT_IDS_TO_KEEP = [
    '4sdRt09goRP98e456', // Global, The Source
];

const CUSTOMER_IDS_TO_KEEP = [
    'dWZDlwe0E6u7AehBp', // Dickie has customerBranches
    '6oruZNRttFm3zICEm', // LENNOX INDUSTRIES has customerBranches
    'qYMJVWDnpUjNbAYlk', // Yibase Tech has customer quotes
    '8aXmzp1bmsMfvtP4E', // CENTURY A/C SUPPLY INC has customerInvoices
    'j17yN71uJhEBdeTGu', // INSCO has customerAliases
];

const USER_IDS_TO_KEEP = [
    'haS3cn5p6cgiJZSqn', // Sharon manages people
    'KueeAZtTRJ2Zpgmuj', // Melidy has transactions, productionRuns, and productionOrders
    'AfaXbmrzgZeHsqDHb', // Shaun creates vendors, categories, customerPendingData, and alerts
    'YoKFKBqCosExsKBHE', // Guofu creates system lookups, and systemOptions
    'cFAhh3uAcYd9yw6Yx', // Wanda creates ledger accounts
    'ALSXa4bXHPzuGs5Xy', // Jonathan Kruse creates meeting notes, and customerPayments
    'cEtabMkJrbQGpcRkr', // Alison creates System Syncs
    'evHg3j3rqZRjuYnun', // Lindsay creates salespersonTerritories
    'q5vnWtPmvDKKrgni4', // Christian has customerShipments
    'rAYFpXmz69dAnphRK', // Elaine has customerQuotes
    'SCF34XqFiGJsN2j68', // Katie has customerMeetings
    '5JAYrqRMYLYzxMhpm', // KJ
];

function cleanCustomers() {

}

print('Top level entities')
delete_function('users', { _id: { $in: USER_IDS_TO_KEEP } });
delete_function('vendors', {createdUserId: { $in: USER_IDS_TO_KEEP }}, 20)
const vendorsKept = db.vendors.find({}, { _id: 1 }).toArray().map(obj => obj._id);
delete_function('products', { createdUserId: { $in: USER_IDS_TO_KEEP }, tenantId: { $in: TENANT_IDS_TO_KEEP }, 'vendors._id': { $in: vendorsKept }}, 30)
const productsKept = db.products.find({}, { _id: 1 }).toArray().map(obj => obj._id);
delete_function('productionOrders', { createdUserId: { $in: USER_IDS_TO_KEEP }, tenantId: { $in: TENANT_IDS_TO_KEEP }, productId: { $in: productsKept }}, 20)
const  productionOrdersKept = db.products.find({}, { _id: 1 }).toArray().map(obj => obj._id);
delete_function('customerInvoices', {customerId: { $in: CUSTOMER_IDS_TO_KEEP },tenantId: { $in: TENANT_IDS_TO_KEEP }}, 30);
const  invoicesKept = db.customerInvoices.find({}, { _id: 1 }).limit(30).toArray().map(obj => obj._id);


delete_function('systemTenants', { _id: { $in: TENANT_IDS_TO_KEEP } });
delete_function('customers', { _id: { $in: CUSTOMER_IDS_TO_KEEP } });

print('Empty All');
ENTITIES_TO_EMPTY.forEach(emptyAll);

print('Keep one record');
ENTITIES_TO_KEEP_ONE_RECORD.forEach(empty);

print('Dependent records')
delete_function('customerAlias', {customerId: { $in: CUSTOMER_IDS_TO_KEEP }, productId: { $in: productsKept }}, 5);
delete_function('vendorOrders', {createdUserID: { $in: USER_IDS_TO_KEEP }, vendorId: { $in: vendorsKept }}, 5);
delete_function('userIssues', {userId: { $in: USER_IDS_TO_KEEP }}, 10);
// delete_function('userGroups', {createdUserId: { $in: USER_IDS_TO_KEEP }, parentTenantId: { $in: TENANT_IDS_TO_KEEP }});
delete_function('userFilters', {createdUserId: { $in: USER_IDS_TO_KEEP }, parentTenantId: { $in: TENANT_IDS_TO_KEEP },tenantId: { $in: TENANT_IDS_TO_KEEP }});
delete_function('transactions', {createdUserId: { $in: USER_IDS_TO_KEEP },tenantId: { $in: TENANT_IDS_TO_KEEP }}, 10);
//delete_function('systemLookups', {createdUserId: { $in: USER_IDS_TO_KEEP }, parentTenantId: { $in: TENANT_IDS_TO_KEEP },tenantId: { $in: TENANT_IDS_TO_KEEP }}, 5);
delete_function('systemLogs', {createdUserId: { $in: USER_IDS_TO_KEEP }, parentTenantId: { $in: TENANT_IDS_TO_KEEP },tenantId: { $in: TENANT_IDS_TO_KEEP }}, 10);
delete_function('salespersonTerritories', {createdUserId: { $in: USER_IDS_TO_KEEP },'salespeople.userID': { $in: USER_IDS_TO_KEEP }}, 5);
delete_function('productionRuns', {createdUserId: { $in: USER_IDS_TO_KEEP },tenantId: { $in: TENANT_IDS_TO_KEEP },'workers.createdUserId': { $in: USER_IDS_TO_KEEP}})
delete_function('origin_customerContracts', {'categories.createdUserId': { $in: USER_IDS_TO_KEEP },'products.createdUserId': { $in: USER_IDS_TO_KEEP },'products.productId': { $in: productsKept }})
delete_function('ledgerAccounts', {createdUserId: { $in: USER_IDS_TO_KEEP },tenantId: { $in: TENANT_IDS_TO_KEEP }}, 10);
delete_function('customerShipments', {createdUserId: { $in: USER_IDS_TO_KEEP }});
delete_function('customerQuotes', {createdUserId: { $in: USER_IDS_TO_KEEP }, customerId: { $in: CUSTOMER_IDS_TO_KEEP }, 'products.productId': { $in: productsKept }, tenantId: { $in: TENANT_IDS_TO_KEEP }});
delete_function('customerPendingData', {$where: 'this.branches.length < 2 && this.customerContacts.length < 2 && (!this.pendingBranches || this.pendingBranches.length < 2) && (!this.pendingContacts || this.pendingContacts.length < 2)', createdUserId: { $in: USER_IDS_TO_KEEP }, 'salespeople.userId': { $in: USER_IDS_TO_KEEP },tenantId: { $in: TENANT_IDS_TO_KEEP }}, 10);
delete_function('customerPayments', {createdUserId: 'ALSXa4bXHPzuGs5Xy','remittance.invoices._id': { $in: invoicesKept },tenantId: { $in: TENANT_IDS_TO_KEEP }})
delete_function('customerOrders', {createdUserId: { $in: USER_IDS_TO_KEEP }, customerId: { $in: CUSTOMER_IDS_TO_KEEP }});
delete_function('customerMeetings', {userId: { $in: USER_IDS_TO_KEEP }, customerId: { $in: CUSTOMER_IDS_TO_KEEP }, tenantId: { $in: TENANT_IDS_TO_KEEP }}, 200);
delete_function('customerContracts', {'products.createdUserId': { $in: USER_IDS_TO_KEEP }});
delete_function('customerBranches', {customerId: { $in: CUSTOMER_IDS_TO_KEEP }}, 10);

print('all done');

class Anomylize {
    static randomStreet() {
        const possibleStreets = ['entomoid', 'Entomophila', 'omniparent', 'rainless', 'ultraloyal', 'candlerent', 'canopy'];
        const selectedIndex = parseInt(Math.random() * possibleStreets.length);
        return possibleStreets[selectedIndex];
    }
    static firstName() {
        const possibleNames = ['Bob', 'Sally', 'Harry', 'Joe', 'Ray', 'Ashley', 'Tom'];
        const selectedIndex = parseInt(Math.random() * possibleNames.length);
        return possibleNames[selectedIndex];
    }
    static lastName() {
        const possibleNames = ['Rain', 'Sun', 'Snow', 'Winter', 'Time', 'Wilkons', 'Sawyer'];
        const selectedIndex = parseInt(Math.random() * possibleNames.length);
        return possibleNames[selectedIndex];
    }
    static random() {
        return parseInt(Math.random()*10000, 10)
    }
    static email() {
        return `user.${Anomylize.random()}@example.com`;
    }

    static address1() {
        return `${Anomylize.random()} ${Anomylize.randomStreet()}`
    }

    static address2() {
        return `${Anomylize.random()}`
    }

    static anomalyzeField (field) {
        const fieldName = field.toLowerCase();
        if (fieldName.indexOf('username') > -1) {
            return Anomylize.email();
        }
        if (fieldName.indexOf('email') > -1) {
            return Anomylize.email();
        }
        if (fieldName.indexOf('address1') > -1) {
            return Anomylize.address1();
        }
        if (fieldName.indexOf('address2') > -1) {
            return Anomylize.address2();
        }
        if (fieldName.indexOf('address3') > -1) {
            return ''; // Yep, just remove
        }
        if (fieldName.indexOf('zip') > -1) {
            return '77777'; // Yep, just give a default
        }
        if (fieldName.indexOf('city') > -1) {
            return 'Austin'; // Yep, just give a default
        }
        if (fieldName.indexOf('firstName') > -1) {
            return Anomylize.firstName();
        }
        if (fieldName.indexOf('lastName') > -1) {
            return Anomylize.lastName();
        }
        if (fieldName.indexOf('fax') > -1) {
            return '1111111111';
        }
        if (fieldName.indexOf('phone') > -1) {
            return '1111111111';
        }
        else {
            return 'test';
        }
    }

    static anomalyzeFields(fieldNames) {
        const objDoc = {};

        for (let i in fieldNames) {
            const fieldName = fieldNames[i];
            objDoc[fieldName] = Anomylize.anomalyzeField(fieldName);
        }

        return objDoc
    }
}

function anomalyzeCollection(collection, fieldsToAnomalyze) {
    const allIds = db[collection].find({}, {_id: 1}).map(obj => obj._id);
    print(`Anomalyzing ${allIds.length} records in "${collection}" collection`);
    allIds.forEach((_id) => {
        // here we get an object that we can use to update (set) fields
        const anomalyzedFields = Anomylize.anomalyzeFields(fieldsToAnomalyze);
        const resultOutput = db[collection].update({ _id }, { $set: anomalyzedFields }, false, true);
        if (resultOutput.nMatched !== 1) {
            print(`Error with ${resultOutput}`);
        }
    });
}

function anomalyzeUser() {
    const fieldsToAnomalyze = [
        // 'email', 'emails.0.address', 'username',
        'profile.firstName', 'profile.lastName', 'usernameInput'
    ];
    anomalyzeCollection('users', fieldsToAnomalyze)
}

function anomalyzeVendor() {
    const fieldsToAnomalyze = ['address1', 'address2', 'address3', 'city', 'email', 'fax', 'phone', 'phoneExtension', 'zipCode'];
    anomalyzeCollection('vendors', fieldsToAnomalyze)
}

function anomalyzeVendorOrders() {
    const fieldsToAnomalyze = ['purchaseFromAddress1', 'purchaseFromAddress2', 'purchaseFromAddress3', 'purchaseFromName', 'purchaseFromZipCode', 'shipToAddress1', 'shipToAddress2', 'shipToAddress3', 'shipToZipCode'];
    anomalyzeCollection('vendorOrders', fieldsToAnomalyze)
}

function anomalyzeSystemOptions() {
    const fieldsToAnomalyze = ['email.to', 'email.from'];
    anomalyzeCollection('systemOptions', fieldsToAnomalyze)
}


function anomalyzeMeetingNotes() {
    const fieldsToAnomalyze = ['email.to'];
    anomalyzeCollection('meetingNotes', fieldsToAnomalyze)
}

function anomalyzeCustomers() {
    const fieldsToAnomalyze = ['address1', 'address2', 'address3', "branches.0.address1", "branches.0.address2", "branches.0.address3", "branches.0.city", "branches.0.fax", "branches.0.phone", "branches.0.phoneExtension", "branches.0.state", "branches.0.zipCode", "city", "customerContacts.0.address1", "customerContacts.0.address2", "customerContacts.0.address3", "customerContacts.0.fax", "customerContacts.0.name", "customerContacts.0.state", "email", "customerContacts.0.zipCode", "fax", "phone", "phoneExtension", "state", "zipCode"];
    anomalyzeCollection('customers', fieldsToAnomalyze)
}

function anomalyzeCustomerPendingData() {
    const fieldsToAnomalyze = ["branches.0.address1", "branches.0.address2", "branches.0.address3", "branches.0.city", "branches.0.fax", "branches.0.name", "branches.0.phone", "branches.0.phoneExtension", "branches.0.state", "branches.0.zipCode", "city", "customerContacts.0.address1", "customerContacts.0.address2", "customerContacts.0.address3", "customerContacts.0.fax", "customerContacts.0.name", "customerContacts.0.state", "email", "customerContacts.0.zipCode", "fax", "name", "pendingBranches.0.address1", "pendingBranches.0.address2", "pendingBranches.0.city", "pendingBranches.0.name", "pendingBranches.0.state", "pendingBranches.0.zipCode", "pendingContacts.1.address1", "pendingContacts.1.address2", "pendingContacts.1.city", "pendingContacts.1.email", "pendingContacts.1.name", "pendingContacts.1.phone", "pendingContacts.1.state", "pendingContacts.1.zipCode", "phone", "phoneExtension", "state", "zipCode"];
    anomalyzeCollection('customerPendingData', fieldsToAnomalyze)
}

function anomalyzeCustomerInvoices() {
    const fieldsToAnomalyze = ["shipToZipCode", "shipToName", "shipToCity", "shipToAddress3", "shipToAddress2", "shipToAddress1", "billToZipCode", "billToAddress3", "billToAddress2", "billToName", "billToAddress1"];
    anomalyzeCollection('customerInvoices', fieldsToAnomalyze)
}

function anomalyzeCustomerOrders() {
    const fieldsToAnomalyze = ["shipToZipCode", "shipToState", "shipToName", "shipToCity", "shipToAddress3", "shipToAddress2", "shipToAddress1", "customerPONumber", "billToZipCode", "billToState", "billToName", "billToCity", "billToAddress3", "billToAddress2", "billToAddress1"];
    anomalyzeCollection('customerOrders', fieldsToAnomalyze)
}

function anomalyzeCustomerMeetings() {
    const fieldsToAnomalyze = ["userName", "customerName", "branch", "contact"];
    anomalyzeCollection('customerMeetings', fieldsToAnomalyze)
}

function anomalyzeCustomerBranches() {
    const fieldsToAnomalyze = ["address1", "address2", "address3", "city", "email", "fax", "phone", "phoneExtension", "zipCode"];
    anomalyzeCollection('customerBranches', fieldsToAnomalyze)
}
anomalyzeUser();
anomalyzeVendor();
anomalyzeVendorOrders();
anomalyzeSystemOptions();
anomalyzeMeetingNotes();
anomalyzeCustomers();
anomalyzeCustomerPendingData();
anomalyzeCustomerInvoices();
anomalyzeCustomerOrders();
anomalyzeCustomerMeetings();
anomalyzeCustomerBranches();
