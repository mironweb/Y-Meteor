/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCustomerInvoicesLookups.js')
 */

function updateLookupCustomerInvoice() {
    const collectionName = 'customerInvoice';
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
                qtyShipped: { _$toDouble: "$qtyShipped" },
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

function updateLookupCustomerInvoices() {
    const collectionName = 'customerInvoices';
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

function updateLookupFreightReport() {
    const collectionName = 'freightReport';
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
                cogs: { _$toDouble: "$cogs" },
                freightCost: { _$toDouble: "$freightCost" },
                freightCostPercentage: { _$toDouble: "$freightCostPercentage" },
                grossProfit: { _$toDouble: "$grossProfit" },
                grossProfitPercentage: { _$toDouble: "$grossProfitPercentage" },
                invoiceTotal: { _$toDouble: "$invoiceTotal" },
                netProfit: { _$toDouble: "$netProfit" },
                netProfitPercentage: { _$toDouble: "$netProfitPercentage" },
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
                cogs: { _$toDouble: "$cogs" },
                freightCost: { _$toDouble: "$freightCost" },
                freightCostPercentage: { _$toDouble: "$freightCostPercentage" },
                grossProfit: { _$toDouble: "$grossProfit" },
                grossProfitPercentage: { _$toDouble: "$grossProfitPercentage" },
                invoiceTotal: { _$toDouble: "$invoiceTotal" },
                netProfit: { _$toDouble: "$netProfit" },
                netProfitPercentage: { _$toDouble: "$netProfitPercentage" },
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

function updateLookupCustomerQuoteReview() {
    const collectionName = 'customerQuoteReview';
    print(`Updating systemLookups (name=${collectionName})`);

    const lookup = db.systemLookups.findOne({ name: collectionName });
    if (!lookup) {
        print(`  ERROR! Collection ${collectionName} not found`);
        return;
    }

    (function updateAggregate1() {
        const lastStage = lookup.methods[3].args[0].value.pop();
        const newStage = {
            _$addFields: {
                qtyShipped: {
                    _$map: {
                        input: "$qtyShipped",
                        as: "row",
                        in: {
                            productId: "$$row.productId",
                            qtySold: { _$toDouble: "$$row.qtySold" },
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
        const update = { $push: { 'methods.3.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 1 updated`);
    })();

    (function updateAggregate2() {
        const lastStage = lookup.methods[4].args[0].value.pop();
        const newStage = {
            _$addFields: {
                lowestInvoicePrice: {
                    _$map: {
                        input: "$lowestInvoicePrice",
                        as: "row",
                        in: {
                            _id: "$$row._id",
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
        const update = { $push: { 'methods.4.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 2 updated`);
    })();
}

function updateLookupCustomerInquiry(collectionName) {
    const lookup = db.systemLookups.findOne({ name: collectionName });
    if (!lookup) {
        print(`  ERROR! Collection ${collectionName} not found`);
        return;
    }

    (function updateAggregate1() {
        const lastStage = lookup.methods[0].args[0].value.pop();
        const newStage = {
            _$addFields: {
                previousYear: {
                    _$map: {
                        input: "$previousYear",
                        as: "row",
                        in: {
                            _id: "$$row._id",
                            total: { _$toDouble: "$$row.total" },
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

    (function updateAggregate2() {
        const lastStage = lookup.methods[1].args[0].value.pop();
        const newStage = {
            _$addFields: {
                current: { _$toDouble: "$current" },
                past: { _$toDouble: "$past" },
                percent: { _$toDouble: "$percent" },
            },
        };
        if (JSON.stringify(lastStage) === JSON.stringify(newStage)) {
            print(`  Aggregate 2 already updated`);
            return;
        }

        const query = { name: collectionName };
        const update = { $push: { 'methods.1.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 2 updated`);
    })();
}

function updateLookupCategoryDetails() {
    const collectionName = 'categoryDetails';
    print(`Updating systemLookups (name=${collectionName})`);
    updateLookupCustomerInquiry(collectionName);
}

function updateLookupCategoryDetailsSalesPerson() {
    const collectionName = 'categoryDetailsSalesPerson';
    print(`Updating systemLookups (name=${collectionName})`);
    updateLookupCustomerInquiry(collectionName);
}

function updateLookupProductDetails() {
    const collectionName = 'productDetails';
    print(`Updating systemLookups (name=${collectionName})`);
    updateLookupCustomerInquiry(collectionName);
}

function updateLookupProductDetailsSalesPerson() {
    const collectionName = 'productDetailsSalesPerson';
    print(`Updating systemLookups (name=${collectionName})`);
    updateLookupCustomerInquiry(collectionName);
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

function updateLookupContractPricing() {
    const collectionName = 'contractPricing';
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
                invoiceProducts: {
                    _$map: {
                        input: "$invoiceProducts",
                        as: "row",
                        in: {
                            productId: "$$row.productId",
                            unitsSold: { _$toDouble: "$$row.unitsSold" },
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

function updateLookupManageCategoryProducts() {
    const collectionName = 'manageCategoryProducts';
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
                product : {
                    YTDsales : { _$toDouble: "$qtyShipped" },
                },
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

function updateLookupUserDefinedBudget() {
    const collectionName = 'userDefinedBudget';
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
                budgetMonth: { _$toDouble: "$budgetMonth" },
                actualMonth: { _$toDouble: "$actualMonth" },
                previousMonth: { _$toDouble: "$previousMonth" },
                budgetYTD: { _$toDouble: "$budgetYTD" },
                actualYTD: { _$toDouble: "$actualYTD" },
                previousYTD: { _$toDouble: "$previousYTD" },
                AMTDVSPMTD: { _$toDouble: "$AMTDVSPMTD" },
                AMTDVSBMTD: { _$toDouble: "$AMTDVSBMTD" },
                AYTDVSPYTD: { _$toDouble: "$AYTDVSPYTD" },
                AYTDVSBYTD: { _$toDouble: "$AYTDVSBYTD" },
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
                budgetMonth: { _$toDouble: "$budgetMonth" },
                actualMonth: { _$toDouble: "$actualMonth" },
                previousMonth: { _$toDouble: "$previousMonth" },
                budgetYTD: { _$toDouble: "$budgetYTD" },
                actualYTD: { _$toDouble: "$actualYTD" },
                previousYTD: { _$toDouble: "$previousYTD" },
                AMTDVSPMTD: { _$toDouble: "$AMTDVSPMTD" },
                AMTDVSBMTD: { _$toDouble: "$AMTDVSBMTD" },
                AYTDVSPYTD: { _$toDouble: "$AYTDVSPYTD" },
                AYTDVSBYTD: { _$toDouble: "$AYTDVSBYTD" },
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

function updateLookupAgedInvoices() {
    const collectionName = 'agedInvoices';
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
                sumTotal: { _$toDouble: "$sumTotal" },
                invoices: {
                    _$map: {
                        input: "$invoices",
                        as: "row",
                        in: {
                            _id: "$$row._id",
                            dueDate: "$$row.dueDate",
                            total: { _$toDouble: "$$row.total" },
                            number: "$$row.number",
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

function updateLookupCustomerInvoiceSales() {
    const collectionName = 'customerInvoiceSales';
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
                qtyShipped: { _$toDouble: "$qtyShipped" },
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

function updateLookupCustomerQuoteReviewSales() {
    const collectionName = 'customerQuoteReviewSales';
    print(`Updating systemLookups (name=${collectionName})`);

    const lookup = db.systemLookups.findOne({ name: collectionName });
    if (!lookup) {
        print(`  ERROR! Collection ${collectionName} not found`);
        return;
    }

    (function updateAggregate1() {
        const lastStage = lookup.methods[3].args[0].value.pop();
        const newStage = {
            _$addFields: {
                qtyShipped: {
                    _$map: {
                        input: "$qtyShipped",
                        as: "row",
                        in: {
                            productId: "$$row.productId",
                            qtySold: { _$toDouble: "$$row.qtySold" },
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
        const update = { $push: { 'methods.3.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 1 updated`);
    })();

    (function updateAggregate2() {
        const lastStage = lookup.methods[4].args[0].value.pop();
        const newStage = {
            _$addFields: {
                lowestInvoicePrice: {
                    _$map: {
                        input: "$lowestInvoicePrice",
                        as: "row",
                        in: {
                            _id: "$$row._id",
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
        const update = { $push: { 'methods.4.args.0.value': newStage } };
        db.systemLookups.update(query, update);
        print(`  Aggregate 2 updated`);
    })();
}

updateLookupCustomerInvoice();
updateLookupCustomerInvoices();
updateLookupFreightReport();
updateLookupCustomerQuoteReview();
updateLookupCategoryDetails();
updateLookupCategoryDetailsSalesPerson();
updateLookupProductDetails();
updateLookupProductDetailsSalesPerson();
updateLookupWorkOrderRelease();
updateLookupContractPricing();
updateLookupManageCategoryProducts();
updateLookupUserDefinedBudget();
updateLookupInventory();
updateLookupAgedInvoices();
updateLookupCustomerInvoiceSales();
updateLookupCustomerQuoteReviewSales();
