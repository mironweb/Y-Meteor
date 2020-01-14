/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/systemPermissionsRewiringStats.js')
 */

function initialize() {
    print('Checking collections for instance of userPermissions');

    let totalCollections = 0;
    let totalDocuments = 0;
    let totalDocumentsWithPermissions = 0;

    db.getCollectionNames().forEach((collectionName) => {
        if (/^__/.test(collectionName)) return;

        const count = db[collectionName].find({}).count();
        const countWithPermissions = db[collectionName].find({
            $where: function() {
                const json = JSON.stringify(this);
                return /permission/gi.test(json);
            },
        }).count();

        totalCollections++;
        totalDocuments += count;
        totalDocumentsWithPermissions += countWithPermissions;

        print(`  ${collectionName} ${countWithPermissions}/${count}`);
    });

    print();
    print(`Total collections: ${totalCollections}`);
    print(`Total documents: ${totalDocuments}`);
    print(`Total documents with permissions: ${totalDocumentsWithPermissions}`);
}
initialize();
