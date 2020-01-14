/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCustomerQuotesLookups.js')
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
        const lastStage = lookup.methods[6].args[0].value.pop();
        const newStage = {
            _$addFields: {
                price: { _$toDouble: "$price" },
                quotePrice: { _$toDouble: "$quotePrice" },
                grossProfit: { _$toDouble: "$grossProfit" },
                stdCost: { _$toDouble: "$stdCost" },
                lowestPrice: { _$toDouble: "$lowestPrice" },
                lowestContractPrice: { _$toDouble: "$lowestContractPrice" },
                lowestInvoicePrice: { _$toDouble: "$lowestInvoicePrice" },
                qtySold: { _$toDouble: "$qtySold" },
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
        const update = { $push: { 'methods.6.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 1 updated`);
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
        const lastStage = lookup.methods[6].args[0].value.pop();
        const newStage = {
            _$addFields: {
                price: { _$toDouble: "$price" },
                quotePrice: { _$toDouble: "$quotePrice" },
                grossProfit: { _$toDouble: "$grossProfit" },
                stdCost: { _$toDouble: "$stdCost" },
                lowestPrice: { _$toDouble: "$lowestPrice" },
                lowestContractPrice: { _$toDouble: "$lowestContractPrice" },
                lowestInvoicePrice: { _$toDouble: "$lowestInvoicePrice" },
                qtySold: { _$toDouble: "$qtySold" },
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
        const update = { $push: { 'methods.6.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 1 updated`);
    })();
}

function updateLookupConvertedQuotesReport() {
    const collectionName = 'convertedQuotesReport';
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
                quotePrice: { _$toDouble: "$quotePrice" },
                productCost: { _$toDouble: "$productCost" },
                grossProfit: { _$toDouble: "$grossProfit" },
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
updateLookupConvertedQuotesReport();
