/**
 * This file should be ran within a mongo cli by executing the command below.
 * Please drop `systemPermissions` first before running the script.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/systemPreferences.js')
 */

function getModulesById() {
    return db.systemPermissions.find({ type: 'module' }).toArray()
        .reduce((map, value) => {
            map[value._id] = value;
            return map;
        }, {});
}

function getUnusedPermissions() {
    return [
        '12345678901234567', // testPermission
        'd2gx5ctSj8x3Qs5Nz', // accessCustomerInfo
        'rPHJCZ9Dg0BY8o0lc', // manageOrders
        'Tt2slUF2OKUWxU4OX', // alwayAllow
        'bVynJTAhlEro2Tslt', // systemTest
        'Qrk2H4eFKETsifaTb', // manageWarehouseBins
        'xurOEk5ktvaIvi5vx', // viewCost
    ];
}

function turnSystemModulesIntoSystemPermissions() {
    print('Migrating systemModules into systemPermissions');
    const systemModules = db.systemModules.find().toArray()
        .map((systemModule) => {
            // before we turn this into a systemPermission, we want to know where it came from
            systemModule.copiedFrom = 'systemModules';
            // set the permission type to module
            systemModule.type = 'module';
            return systemModule;
        });
    print(`  systemPermissions has ${db.systemPermissions.count()} records`);
    print(`  inserting ${systemModules.length} systemModules into systemPermissions`);
    db.systemPermissions.insert(systemModules);
    print(`  systemPermissions now has ${db.systemPermissions.count()} records`);
}

function turnUserPermissionsIntoSystemPermissions() {
    print('Migrating userPermissions into systemPermissions');
    const modulesById = getModulesById();
    const unusedPermissions = getUnusedPermissions();
    const userPermissions = db.userPermissions.find().toArray()
        .map((userPermission) => {
            // before we turn this into a systemPermission, we want to know where it came from
            userPermission.copiedFrom = 'userPermissions';
            // user moduleId as parentPermissionId
            if (modulesById[userPermission.moduleId]) {
                userPermission.parentPermissionId = userPermission.moduleId;
            }
            if (unusedPermissions.indexOf(userPermission._id) !== -1) {
                userPermission.removed = true;
            }
            return userPermission;
        });
    print(`  systemPermissions has ${db.systemPermissions.count()} records`);
    print(`  inserting ${userPermissions.length} userPermissions into systemPermissions`);
    db.systemPermissions.insert(userPermissions);
    print(`  systemPermissions now has ${db.systemPermissions.count()} records`);
}

function updateHierarchyBasedFromRoutes() {
    print('Updating hierarchy from systemOptions into systemPermissions');
    const routesOptions = db.systemOptions.findOne({ _id: 'GJRIfiBthyfx7JR29' });
    const { value: topLevelOptions } = routesOptions;
    print(`  found ${topLevelOptions.length} top level options`);

    topLevelOptions.forEach((option) => {
        const {
            permissionId: grandParentPermissionId,
            routes,
            name,
            label,
            sidenavLabel,
        } = option;
        print(`  ${name} - found ${routes.length} routes`);
        if (!grandParentPermissionId) {
            return;
        }

        // update permission for parent
        db.systemPermissions.update(
            { _id: grandParentPermissionId },
            { $set: {
                label: label || sidenavLabel,
                type: 'sideNav',
            } },
            { multi: true }
        );
        routes.forEach((route) => {
            const {
                permissionId: parentPermissionId,
                label,
                sidenavLabel,
                data: buttonGroup,
            } = route;
            if (!parentPermissionId) {
                return;
            }

            // update permission for child
            db.systemPermissions.update(
                { _id: parentPermissionId },
                { $set: {
                    label: label || sidenavLabel,
                    type: 'sideNav',
                    parentPermissionId: grandParentPermissionId,
                } },
                { multi: true }
            );
            if (!buttonGroup || !buttonGroup.buttons) {
                return;
            }
            buttonGroup.buttons.forEach((button) => {
                const {
                    permissionId,
                    title,
                } = button;
                if (!permissionId) {
                    return;
                }

                // update permission for grandchild
                permissionId, db.systemPermissions.update(
                    { _id: permissionId },
                    { $set: {
                        label: title,
                        type: 'button',
                        parentPermissionId,
                    } },
                    { multi: true }
                );
            });
        });
    });
}

function insertSystemOptionAndGetId(systemOption, type, parentPermissionId) {
    // Make a copy before wrecking shop
    const newDoc = Object.assign({}, systemOption);
    delete newDoc.subMenus;
    delete newDoc.routes;
    newDoc.copiedFrom = 'systemOptions';
    newDoc.type = type;

    // I suspect the name and permissionName should be changed around when type='sideNav'
    if (type == 'sideNav') {
        newDoc.description = newDoc.name;
        newDoc.name = newDoc.permissionName;
    }
    delete newDoc.permissionName;

    if (parentPermissionId) {
        newDoc.parentPermissionId = parentPermissionId;
    }
    
    const {
        insertedId,
    } = db.systemPermissions.insertOne(newDoc);

    return insertedId;
}

function convertOptions(_id, type) {
    print('');
    print(`Converting systemOption with _id=${_id}`);
    const sideNaveOptions = db.systemOptions.findOne({ _id });
    const {
        value: topLevelOptions,
    } = sideNaveOptions;

    print(`Found ${topLevelOptions.length} top level options`);

    topLevelOptions.forEach(option => {
        const {
            subMenus,
            routes,
        } = option;
        print(`- create option "${option.name}"`);

        const parentPermissionId = insertSystemOptionAndGetId(option, type);
        const subItems = routes || subMenus;
        if (!subItems) {
            return;
        }
        print(`-- creating ${subItems.length} subItems`);

        subItems.forEach(subMenu => {
            insertSystemOptionAndGetId(subMenu, type, parentPermissionId);
        });
    });

    print(`systemPermissions now has ${db.systemPermissions.count()} records`);
}

function createSystemPermissions() {
    print('creating systemPermissions collection');
    // Rename the userPermissions collection to be systemPermissions
    db.userPermissions.renameCollection("systemPermissions");
    print(`Turned ${db.systemPermissions.count()} userPermissions into systemPermissions`);
    // Implement the following schema _id, createdAt, createdUserId, name, description, type - module, sideNav, buttonGroup, button, display, etc...., label, url, action, parentPermissionId, sequence
    db.systemPermissions.update({},{$set:{action:"",parentPermissionId:"",sequence:1, copiedFrom: 'userPermissions'},$unset:{"default":1,"removed":1,"parentTenantId":1}},{multi:true});

    // Convert the systemModules collection into documents in the systemPermissions collection
    turnSystemModulesIntoSystemPermissions();
    // Drop the systemModules collection
    print('Dropping systemModules')
    db.systemModules.drop();

    // Convert the systemOptions document where the _id = "L9VZWa0oRUcyOD2hB" into documents in the systemPermissions collection. This is the side navigation menu.
    convertOptions("L9VZWa0oRUcyOD2hB", 'sideNav');
    // Delete the systemOptions document where the _id = "L9VZWa0oRUcyOD2hB"
    db.systemOptions.remove({_id:"L9VZWa0oRUcyOD2hB"});

    // Convert the ss document where the _id = "GJRIfiBthyfx7JR29" into documents in the systemPermissions collection. These are the routes.
    convertOptions("GJRIfiBthyfx7JR29", 'routes');
    // Delete the systemOptions document where the _id = "GJRIfiBthyfx7JR29"
    db.systemOptions.remove({_id:"GJRIfiBthyfx7JR29"})
    print('Finished creating systemPermissions collection');
}

print('');
if (!db.systemPermissions.exists()) {
    print('Creating systemPermissions');
    turnSystemModulesIntoSystemPermissions();
    turnUserPermissionsIntoSystemPermissions();
    updateHierarchyBasedFromRoutes();
} else {
    print('Aborting, systemPermissions exists');
}
