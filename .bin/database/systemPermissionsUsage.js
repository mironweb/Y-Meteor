/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/systemPermissionsUsage.js')
 */

function initialize() {
    const query = { type: { $ne: 'module' } };
    const permissions = db.systemPermissions.find(query).toArray();
    permissions.forEach((permission, i) => {
        print(`${permission._id} | ${permission.name}`);

        let totalUsage = 0;
        db.getCollectionNames().forEach((collectionName) => {
            if (/^__/.test(collectionName)) return;
            if (/^customer/.test(collectionName)) return;
            if (/^product/.test(collectionName)) return;
            if (/^systemLogs/.test(collectionName)) return;

            const usage = db[collectionName].find({
                $where: `function() {
                    const json = JSON.stringify(this);
                    const containsId = json.indexOf('${permission._id}') !== -1;
                    const containsName = json.indexOf('${permission.name}') !== -1;
                    return containsId || containsName;
                }`,
            }).count();
            totalUsage += usage;
            // if (usage) print(`    ${collectionName}/${usage}`);
        });
        print(`  found ${totalUsage} usage`);
    });
    print(`Total permissions: ${permissions.length}`);
}
initialize();
