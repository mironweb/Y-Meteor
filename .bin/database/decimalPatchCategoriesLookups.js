/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCategoriesLookups.js')
 */

function updateLookupSharedPriceLookupStages() {
    const collectionName = 'sharedPriceLookupStages';
    print(`Updating systemLookups (name=${collectionName})`);

    const lookup = db.systemLookups.findOne({ name: collectionName });
    if (!lookup) {
        print(`  ERROR! Collection ${collectionName} not found`);
        return;
    }

    (function updateAggregate1() {
        const lastStage = lookup.methods[0].args[0].value.pop();
        const newStage = {
            _$addFields: {
                priceLevel1: { _$toDouble: "$priceLevel1" },
                priceLevel2: { _$toDouble: "$priceLevel2" },
                priceLevel3: { _$toDouble: "$priceLevel3" },
                priceLevel4: { _$toDouble: "$priceLevel4" },
            },
        };
        if (JSON.stringify(lastStage) === JSON.stringify(newStage)) {
            print(`  Aggregate 1 already updated`);
            return;
        }

        const query = { name: collectionName };
        const update = { $push: { 'methods.0.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 1 updated`);
    })();
}

updateLookupSharedPriceLookupStages();
