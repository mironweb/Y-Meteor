/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchProductionRunsLookups.js')
 */

function updateLookupProductionRunsOfProductionOrder() {
    const collectionName = 'productionRunsOfProductionOrder';
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
                workers: {
                    _$map: {
                        input: "$workers",
                        as: "row",
                        in: {
                            _$mergeObjects: [
                                "$$row",
                                { cost: { _$toDouble: "$$row.cost" } },
                            ],
                        },
                    },
                },
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

updateLookupProductionRunsOfProductionOrder();
