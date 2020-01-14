/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/addShippingModule.js')
 */

function addShippingModulePermissions() {
    print('Adding shipping module permissions');

    (function saveShippingModulePermission() {
        const permission = {
            "_id": "4aNYuM5knH7WT8hcp",
            "name": "Shipping",
            "url": "shipping",
            "copiedFrom": "systemModules",
            "type": "module",
        };
        const query = { _id: permission._id };

        const exists = db.systemPermissions.findOne(query);
        if (exists) {
            db.systemPermissions.update(query, permission);
            print(`  Shipping module permission updated`);
        } else {
            db.systemPermissions.insert(permission);
            print(`  Shipping module permission created`);
        }
    })();

    (function saveShippingSideNavPermission() {
        const permission = {
            "_id": "gFC7Juuwi4MECPqjk",
            "createdUserId": "YoKFKBqCosExsKBHE",
            "createdAt": ISODate("2018-05-16T15:30:15.258Z"),
            "name": "manageShippingModule",
            "description": "Manage Shipping Module",
            "url": "shipping",
            "tenantId": "4sdRt09goRP98e456",
            "parentTenantId": "4sdRt09goRP98e456",
            "moduleId": "4aNYuM5knH7WT8hcp",
            "isModulePermission": true,
            "copiedFrom": "userPermissions",
            "parentPermissionId": "4aNYuM5knH7WT8hcp",
            "label": "Shipping",
            "type": "sideNav",
        };
        const query = { _id: permission._id };

        const exists = db.systemPermissions.findOne(query);
        if (exists) {
            db.systemPermissions.update(query, permission);
            print(`  Shipping sideNav permission updated`);
        } else {
            db.systemPermissions.insert(permission);
            print(`  Shipping sideNav permission created`);
        }
    })();

    (function addShippingModuleToDeveloperGroup() {
        const groupName = 'Developer';
        const group = db.userGroups.findOne({ name: groupName });
        if (!group) {
            print(`  ERROR! userGroups.name = ${groupName} not found`);
            return;
        }

        const permissions = ['4aNYuM5knH7WT8hcp', 'gFC7Juuwi4MECPqjk'];
        permissions.forEach((permissionId) => {
            const query = { name: groupName };
            const update = {
                $addToSet: {
                    groupPermissions: {
                        _id: permissionId,
                        value: 'enabled',
                    },
                },
            };
            const result = db.userGroups.update(query, update);
            const added = result.nModified;
            print(`  ${permissionId} ${added? 'added': 'already added'}`);
        });
    })();
}

function addShippingOnRoutes() {
    const systemOptionName = 'routes';
    print('Adding shipping menu group on sidebar');

    const routes = db.systemOptions.findOne({ name: systemOptionName });
    if (!routes) {
        print(`  ERROR! systemOptions.name = ${systemOptionName} not found`);
        return;
    }

    const oldRoute = routes.value.findIndex(route => route.name === 'shipping');
    const newRoute = {
        "permissionId": "4aNYuM5knH7WT8hcp",
        "name": "shipping",
        "url": "shipping",
        "sidenavLabel": "Shipping",
        "label": "Shipping",
        "routes": [
            {
                "permissionId": "gFC7Juuwi4MECPqjk",
                "label": "Shipping",
                "name": "shipping",
                "url": "dashboard",
                "pageHeader": "Shipping",
                "sidenavLabel": "Shipping",
                "component": "ShippingDashboardPage",
            },
        ],
    };

    if (oldRoute === -1) {
        const query = { name: systemOptionName };
        const update = { $push: { 'value': { $each: [newRoute], $position: 0 }}};
        db.systemOptions.update(query, update);
        print(`  Shipping menu group inserted`);
    } else {
        const query = { name: systemOptionName };
        const update = { $set: {[`value.${oldRoute}`]: newRoute } };
        db.systemOptions.update(query, update);
        print(`  Shipping menu group updated`);
    }
}

function addShippingModuleSystemOptions() {
    print('Adding shipping module system option');

    const option = {
        "_id": "egtg589M4LnNY4ZtW",
        "name": "customerShipmentsNextNumber",
        "value": 100000,
        "tenantId": "4sdRt09goRP98e456",
        "default": true,
        "createdUserId": "",
        "createdAt": ISODate("2019-06-25T14:47:07.514Z"),
        "parentTenantId": "4sdRt09goRP98e456"
    };
    const query = { _id: option._id };

    const exists = db.systemOptions.findOne(query);
    if (exists) {
        delete option.value; // don't override the value
        db.systemOptions.update(query, { $set: option });
        print(`  Shipping module option updated`);
    } else {
        db.systemOptions.insert(option);
        print(`  Shipping module option created`);
    }
}

addShippingModulePermissions();
addShippingOnRoutes();
addShippingModuleSystemOptions();
