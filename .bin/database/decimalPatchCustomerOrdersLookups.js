/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCustomerOrdersLookups.js')
 */

function updateLookupCustomerOrder() {
    const collectionName = 'customerOrder';
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
                qtyOrdered: { _$toDouble: "$qtyOrdered" },
                qtyShipped: { _$toDouble: "$qtyShipped" },
                qtyBackordered: { _$toDouble: "$qtyBackordered" },
                cost: { _$toDouble: "$cost" },
                price: { _$toDouble: "$price" },
                grossProfit: { _$toDouble: "$grossProfit" },
                total: { _$toDouble: "$total" },
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

function updateLookupCustomerOrders() {
    const collectionName = 'customerOrders';
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
                total: { _$toDouble: "$total" },
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

function updateLookupOpenOrders() {
    const collectionName = 'openOrders';
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
                openSales: { _$toDouble: "$openSales" },
                orderTotal: { _$toDouble: "$orderTotal" },
                cogs: { _$toDouble: "$cogs" },
                currentMonth: { _$toDouble: "$currentMonth" },
                backOrdered: { _$toDouble: "$backOrdered" },
                futureOrders: { _$toDouble: "$futureOrders" },
                grossProfit: { _$toDouble: "$grossProfit" },
                grossProfitPercentage: { _$toDouble: "$grossProfitPercentage" },
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

    (function updateAggregate2() {
        const lastStage = lookup.totalLogic[0].value.pop();
        const newStage = {
            _$addFields: {
                openSales: { _$toDouble: "$openSales" },
                backOrdered: { _$toDouble: "$backOrdered" },
                cogs: { _$toDouble: "$cogs" },
                currentMonth: { _$toDouble: "$currentMonth" },
                futureOrders: { _$toDouble: "$futureOrders" },
                grossProfit: { _$toDouble: "$grossProfit" },
                grossProfitPercentage: { _$toDouble: "$grossProfitPercentage" },
            },
        };
        if (JSON.stringify(lastStage) === JSON.stringify(newStage)) {
            print(`  Aggregate 2 already updated`);
            return;
        }

        const query = { name: collectionName };
        const update = { $push: { 'totalLogic.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 2 updated`);
    })();
}

function updateLookupWorkOrderRelease() {
    const collectionName = 'workOrderRelease';
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
                raw: { _$toDouble: "$raw" },
                qtyOnHand: { _$toDouble: "$qtyOnHand" },
                onSO: { _$toDouble: "$onSO" },
                onBack: { _$toDouble: "$onBack" },
                maximum: { _$toDouble: "$maximum" },
                receivingCaseQty: { _$toDouble: "$receivingCaseQty" },
                shippingCaseQty: { _$toDouble: "$shippingCaseQty" },
                forecast: { _$toDouble: "$forecast" },
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

function updateLookupCustomerOrdesSales() {
    const collectionName = 'customerOrderSales';
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
                qtyOrdered: { _$toDouble: "$qtyOrdered" },
                qtyShipped: { _$toDouble: "$qtyShipped" },
                qtyBackordered: { _$toDouble: "$qtyBackordered" },
                cost: { _$toDouble: "$cost" },
                price: { _$toDouble: "$price" },
                grossProfit: { _$toDouble: "$grossProfit" },
                total: { _$toDouble: "$total" },
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

updateLookupCustomerOrder();
updateLookupCustomerOrders();
updateLookupOpenOrders();
updateLookupWorkOrderRelease();
updateLookupCustomerOrdesSales();
