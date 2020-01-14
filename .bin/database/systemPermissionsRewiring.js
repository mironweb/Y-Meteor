/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/systemPermissionsRewiring.js')
 */

function initialize() {
    print('Rewiring userPermissions to systemPermissions on systemLookups');

    const systemLookupsWithReference = db.systemLookups.find({
        $where: function() {
            const json = JSON.stringify(this);
            return /permission/gi.test(json);
        },
    });

    const total = systemLookupsWithReference.count();
    print(`Total documents with permissions: ${total}`);

    systemLookupsWithReference.forEach((document) => {
        print(`  Processing ${document.name}`);
        let jsonDocument = JSON.stringify(document);
        jsonDocument = jsonDocument.replace(/userPermissions/g, 'systemPermissions');
        jsonDocument = jsonDocument.replace(/UserPermissions/g, 'SystemPermissions');
        jsonDocument = JSON.parse(jsonDocument);
        jsonDocument.createdAt = ISODate(jsonDocument.createdAt);
        db.systemLookups.save(jsonDocument);
    });
}
initialize();
