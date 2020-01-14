/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchLedgerAccountsLookups.js')
 */

function updateLookupInventoryVariance() {
    const collectionName = 'inventoryVariance';
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
                balance: { _$toDouble: "$balance" },
                productQtyCost: { _$toDouble: "$productQtyCost" },
                abs: { _$toDouble: "$abs" },
                difference: { _$toDouble: "$difference" },
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
                balance: { _$toDouble: "$balance" },
                productQtyCost: { _$toDouble: "$productQtyCost" },
                difference: { _$toDouble: "$difference" },
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

function updateLookupMonthlyIncomeStatement(collectionName) {
    const lookup = db.systemLookups.findOne({ name: collectionName });
    if (!lookup) {
        print(`  ERROR! Collection ${collectionName} not found`);
        return;
    }

    (function updateAggregate1() {
        const lastStage = lookup.methods[0].args[0].value.pop();
        const newStage = {
            _$addFields: {
                thisMonthToDate: { _$toDouble: "$thisMonthToDate" },
                lastMonthToDate: { _$toDouble: "$lastMonthToDate" },
                thisPercentOfRev: { _$toDouble: "$thisPercentOfRev" },
                lastPercentOfRev: { _$toDouble: "$lastPercentOfRev" },
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
                thisMonthToDate: { _$toDouble: "$thisMonthToDate" },
                lastMonthToDate: { _$toDouble: "$lastMonthToDate" },
                thisPercentOfRev: { _$toDouble: "$thisPercentOfRev" },
                lastPercentOfRev: { _$toDouble: "$lastPercentOfRev" },
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

function updateLookupMonthlyCreditMinusDebit() {
    const collectionName = 'monthlyCreditMinusDebit';
    print(`Updating systemLookups (name=${collectionName})`);
    updateLookupMonthlyIncomeStatement(collectionName);
}

function updateLookupMonthlyDebitMinusCredit() {
    const collectionName = 'monthlyDebitMinusCredit';
    print(`Updating systemLookups (name=${collectionName})`);
    updateLookupMonthlyIncomeStatement(collectionName);
}

function updateLookupYearlyIncomeStatement(collectionName) {
    const lookup = db.systemLookups.findOne({ name: collectionName });
    if (!lookup) {
        print(`  ERROR! Collection ${collectionName} not found`);
        return;
    }

    (function updateAggregate1() {
        const lastStage = lookup.methods[0].args[0].value.pop();
        const newStage = {
            _$addFields: {
                thisYearToDate: { _$toDouble: "$thisYearToDate" },
                lastYearToDate: { _$toDouble: "$lastYearToDate" },
                thisPercentOfRev: { _$toDouble: "$thisPercentOfRev" },
                lastPercentOfRev: { _$toDouble: "$lastPercentOfRev" },
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
                thisYearToDate: { _$toDouble: "$thisYearToDate" },
                lastYearToDate: { _$toDouble: "$lastYearToDate" },
                thisPercentOfRev: { _$toDouble: "$thisPercentOfRev" },
                lastPercentOfRev: { _$toDouble: "$lastPercentOfRev" },
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

function updateLookupYearlyCreditMinusDebit() {
    const collectionName = 'yearlyCreditMinusDebit';
    print(`Updating systemLookups (name=${collectionName})`);
    updateLookupYearlyIncomeStatement(collectionName);
}

function updateLookupYearlyDebitMinusCredit() {
    const collectionName = 'yearlyDebitMinusCredit';
    print(`Updating systemLookups (name=${collectionName})`);
    updateLookupYearlyIncomeStatement(collectionName);
}

function updateLookupMonthlyPPV() {
    const collectionName = 'monthlyPPV';
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
                thisMonthToDate: { _$toDouble: "$thisMonthToDate" },
                lastMonthToDate: { _$toDouble: "$lastMonthToDate" },
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
                thisMonthToDate: { _$toDouble: "$thisMonthToDate" },
                lastMonthToDate: { _$toDouble: "$lastMonthToDate" },
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

function updateLookupYearlyPPV() {
    const collectionName = 'yearlyPPV';
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
                thisYearToDate: { _$toDouble: "$thisYearToDate" },
                lastYearToDate: { _$toDouble: "$lastYearToDate" },
                lastYearFullYear: { _$toDouble: "$lastYearFullYear" },
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
                thisYearToDate: { _$toDouble: "$thisYearToDate" },
                lastYearToDate: { _$toDouble: "$lastYearToDate" },
                lastYearFullYear: { _$toDouble: "$lastYearFullYear" },
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

function updateLookupMonthlyExpenses() {
    const collectionName = 'monthlyExpenses';
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
                thisMonthToDate: { _$toDouble: "$thisMonthToDate" },
                lastMonthToDate: { _$toDouble: "$lastMonthToDate" },
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
                thisMonthToDate: { _$toDouble: "$thisMonthToDate" },
                lastMonthToDate: { _$toDouble: "$lastMonthToDate" },
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

function updateLookupYearlyExpenses() {
    const collectionName = 'yearlyExpenses';
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
                thisYearToDate: { _$toDouble: "$thisYearToDate" },
                lastYearToDate: { _$toDouble: "$lastYearToDate" },
                lastYearFullYear: { _$toDouble: "$lastYearFullYear" },
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
                thisYearToDate: { _$toDouble: "$thisYearToDate" },
                lastYearToDate: { _$toDouble: "$lastYearToDate" },
                lastYearFullYear: { _$toDouble: "$lastYearFullYear" },
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

function updateLookupInventory() {
    const collectionName = 'inventory';
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
                difference: { _$toDouble: "$difference" },
                priorYear: { _$toDouble: "$priorYear" },
                currentYear: { _$toDouble: "$currentYear" },
                total: { _$toDouble: "$total" },
                projectedFuture: { _$toDouble: "$projectedFuture" },
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

    (function updateAggregate2() {
        const lastStage = lookup.totalLogic[0].value.pop();
        const newStage = {
            _$addFields: {
                difference: { _$toDouble: "$difference" },
                priorYear: { _$toDouble: "$priorYear" },
                currentYear: { _$toDouble: "$currentYear" },
                total: { _$toDouble: "$total" },
                projectedFuture: { _$toDouble: "$projectedFuture" },
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

function updateLookupSelectedLedgerAccount() {
    const collectionName = 'selectedLedgerAccount';
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
                balance: { _$toDouble: "$balance" },
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

function updateLookupBudgetUpdate() {
    const collectionName = 'budgetUpdate';
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
                "1": { _$toDouble: "$1" },
                "2": { _$toDouble: "$2" },
                "3": { _$toDouble: "$3" },
                "4": { _$toDouble: "$4" },
                "5": { _$toDouble: "$5" },
                "6": { _$toDouble: "$6" },
                "7": { _$toDouble: "$7" },
                "8": { _$toDouble: "$8" },
                "9": { _$toDouble: "$9" },
                "10": { _$toDouble: "$10" },
                "11": { _$toDouble: "$11" },
                "12": { _$toDouble: "$12" },
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
                "1": { _$toDouble: "$1" },
                "2": { _$toDouble: "$2" },
                "3": { _$toDouble: "$3" },
                "4": { _$toDouble: "$4" },
                "5": { _$toDouble: "$5" },
                "6": { _$toDouble: "$6" },
                "7": { _$toDouble: "$7" },
                "8": { _$toDouble: "$8" },
                "9": { _$toDouble: "$9" },
                "10": { _$toDouble: "$10" },
                "11": { _$toDouble: "$11" },
                "12": { _$toDouble: "$12" },
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

function updateLookupBorrowingBase() {
    const collectionName = 'borrowingBase';
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

function updateLookupBudgetReport() {
    const collectionName = 'budgetReport';
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
                periodToDate: { _$toDouble: "$periodToDate" },
                originalBudget: { _$toDouble: "$originalBudget" },
                variance: { _$toDouble: "$variance" },
                yearToDate: { _$toDouble: "$yearToDate" },
                originalYTDBudget: { _$toDouble: "$originalYTDBudget" },
                varianceYTD: { _$toDouble: "$varianceYTD" },
                varPer: { _$toDouble: "$varPer" },
                varPerYTD: { _$toDouble: "$varPerYTD" },
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

updateLookupInventoryVariance();
updateLookupMonthlyCreditMinusDebit();
updateLookupMonthlyDebitMinusCredit();
updateLookupYearlyCreditMinusDebit();
updateLookupYearlyDebitMinusCredit();
updateLookupMonthlyPPV();
updateLookupYearlyPPV();
updateLookupMonthlyExpenses();
updateLookupYearlyExpenses();
updateLookupInventory();
updateLookupSelectedLedgerAccount();
updateLookupBudgetUpdate();
updateLookupBorrowingBase();
updateLookupBudgetReport();
