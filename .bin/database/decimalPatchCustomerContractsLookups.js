/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCustomerContractsLookups.js')
 */

function updateLookupCustomerQuoteReview() {
    const collectionName = 'customerQuoteReview';
    print(`Updating systemLookups (name=${collectionName})`);

    const lookup = db.systemLookups.findOne({ name: collectionName });
    if (!lookup) {
        print(`  ERROR! Collection ${collectionName} not found`);
        return;
    }

    (function updateAggregate1() {
        const lastStage = lookup.methods[2].args[0].value.pop();
        const newStage = {
            _$addFields: {
                lowestPrice: {
                    _$map: {
                        input: "$lowestPrice",
                        as: "row",
                        in: {
                            productId: "$$row.productId",
                            price: { _$toDouble: "$$row.price" },
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
        const update = { $push: { 'methods.2.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 1 updated`);
    })();

    (function updateAggregate2() {
        const lastStage = lookup.methods[5].args[0].value.pop();
        const newStage = {
            _$addFields: {
                contract: {
                    _$map: {
                        input: "$contract",
                        as: "row",
                        in: {
                            productId: "$$row.productId",
                            price: { _$toDouble: "$$row.price" },
                        },
                    },
                },
            },
        };
        if (JSON.stringify(lastStage) === JSON.stringify(newStage)) {
            print(`  Aggregate 2 already updated`);
            return;
        }

        const query = { name: collectionName };
        const update = { $push: { 'methods.5.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 2 updated`);
    })();
}

function updateLookupCustomerQuoteReviewSales() {
    const collectionName = 'customerQuoteReviewSales';
    print(`Updating systemLookups (name=${collectionName})`);

    const lookup = db.systemLookups.findOne({ name: collectionName });
    if (!lookup) {
        print(`  ERROR! Collection ${collectionName} not found`);
        return;
    }

    (function updateAggregate1() {
        const lastStage = lookup.methods[2].args[0].value.pop();
        const newStage = {
            _$addFields: {
                lowestPrice: {
                    _$map: {
                        input: "$lowestPrice",
                        as: "row",
                        in: {
                            productId: "$$row.productId",
                            price: { _$toDouble: "$$row.price" },
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
        const update = { $push: { 'methods.2.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 1 updated`);
    })();

    (function updateAggregate2() {
        const lastStage = lookup.methods[5].args[0].value.pop();
        const newStage = {
            _$addFields: {
                contract: {
                    _$map: {
                        input: "$contract",
                        as: "row",
                        in: {
                            productId: "$$row.productId",
                            price: { _$toDouble: "$$row.price" },
                        },
                    },
                },
            },
        };
        if (JSON.stringify(lastStage) === JSON.stringify(newStage)) {
            print(`  Aggregate 2 already updated`);
            return;
        }

        const query = { name: collectionName };
        const update = { $push: { 'methods.5.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 2 updated`);
    })();
}

function updateLookupCreateQuote() {
    const collectionName = 'createQuote';
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
                price: { _$toDouble: "$price" },
                product: {
                    STDprice: { _$toDouble: "$product.price" },
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

function updateLookupContractPricing() {
    const collectionName = 'contractPricing';
    print(`Updating systemLookups (name=${collectionName})`);

    const lookup = db.systemLookups.findOne({ name: collectionName });
    if (!lookup) {
        print(`  ERROR! Collection ${collectionName} not found`);
        return;
    }

    (function updateAggregate1() {
        const lastStage = lookup.methods[1].args[0].value.pop();
        const newStage = {
            _$addFields: {
                contractProducts: {
                    _$map: {
                        input: "$contractProducts",
                        as: "row",
                        in: {
                            _id: "$$row._id",
                            price: { _$toDouble: "$$row.price" },
                            previousPrice: { _$toDouble: "$$row.previousPrice" },
                        },
                    },
                },
                categoryPriceLevel5: { _$toDouble: "$categoryPriceLevel5" },
            },
        };
        if (JSON.stringify(lastStage) === JSON.stringify(newStage)) {
            print(`  Aggregate 1 already updated`);
            return;
        }

        const query = { name: collectionName };
        const update = { $push: { 'methods.1.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 1 updated`);
    })();
}

function updateLookupContractPricingSales() {
    const collectionName = 'contractPricing_sales';
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
                contractPrice: { _$toDouble: "$contractPrice" },
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

updateLookupCustomerQuoteReview();
updateLookupCustomerQuoteReviewSales();
updateLookupCreateQuote();
updateLookupContractPricing();
updateLookupContractPricingSales();
