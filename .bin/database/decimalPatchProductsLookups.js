/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchProductsLookups.js')
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
                cost: { _$toDouble: "$cost" },
                lastCost: { _$toDouble: "$lastCost" },
                vendorCost: { _$toDouble: "$vendorCost" },
                YTDsales: { _$toDouble: "$YTDsales" },
                STDprice: { _$toDouble: "$STDprice" },
                price: { _$toDouble: "$price" },
                // contractProductPrice: { _$toDouble: "$contractProductPrice" },
                // previousPrice: { _$toDouble: "$previousPrice" },
                priceLevel5: { _$toDouble: "$priceLevel5" },
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

function updateLookupWorkOrderReleaseComponentsDetail() {
    const collectionName = 'workOrderReleaseComponentsDetail';
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
                cost: { _$toDouble: "$cost" },
                qtyOnHand: { _$toDouble: "$qtyOnHand" },
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
updateLookupWorkOrderReleaseComponentsDetail();
