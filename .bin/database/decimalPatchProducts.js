/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchProducts.js')
 */

function isNumberDecimal(value) {
    return value instanceof NumberDecimal;
}

function isNumber(value) {
    return typeof value === 'number';
}

function toString(value) {
    if (!isNumber(value)) return '0';
    return value.toString();
}

function convertFieldsToDecimal() {
    print('Converting to decimal fields on products');
    db.products.find({})
        .forEach((document) => {
            const {
                price,
                priceLevel1,
                priceLevel2,
                priceLevel3,
                priceLevel4,
                cost,
                lastCost,
                standardCost,
                lastReceivedCost,
                lastProducedCost,
                shippingCaseQty,
                receivingCaseQty,
            } = document;

            if (!isNumberDecimal(price)) {
                document.priceOld = price;
                document.price = NumberDecimal(toString(price));
            }
            if (!isNumberDecimal(priceLevel1)) {
                document.priceLevel1Old = priceLevel1;
                document.priceLevel1 = NumberDecimal(toString(priceLevel1));
            }
            if (!isNumberDecimal(priceLevel2)) {
                document.priceLevel2Old = priceLevel2;
                document.priceLevel2 = NumberDecimal(toString(priceLevel2));
            }
            if (!isNumberDecimal(priceLevel3)) {
                document.priceLevel3Old = priceLevel3;
                document.priceLevel3 = NumberDecimal(toString(priceLevel3));
            }
            if (!isNumberDecimal(priceLevel4)) {
                document.priceLevel4Old = priceLevel4;
                document.priceLevel4 = NumberDecimal(toString(priceLevel4));
            }

            if (!isNumberDecimal(cost)) {
                document.costOld = cost;
                document.cost = NumberDecimal(toString(cost));
            }
            if (!isNumberDecimal(lastCost)) {
                document.lastCostOld = lastCost;
                document.lastCost = NumberDecimal(toString(lastCost));
            }
            if (!isNumberDecimal(standardCost)) {
                document.standardCostOld = standardCost;
                document.standardCost = NumberDecimal(toString(standardCost));
            }
            if (!isNumberDecimal(lastReceivedCost)) {
                document.lastReceivedCostOld = lastReceivedCost;
                document.lastReceivedCost = NumberDecimal(toString(lastReceivedCost));
            }
            if (!isNumberDecimal(lastProducedCost)) {
                document.lastProducedCostOld = lastProducedCost;
                document.lastProducedCost = NumberDecimal(toString(lastProducedCost));
            }

            if (!isNumberDecimal(shippingCaseQty)) {
                document.shippingCaseQtyOld = shippingCaseQty;
                document.shippingCaseQty = NumberDecimal(toString(shippingCaseQty));
            }
            if (!isNumberDecimal(receivingCaseQty)) {
                document.receivingCaseQtyOld = receivingCaseQty;
                document.receivingCaseQty = NumberDecimal(toString(receivingCaseQty));
            }

            (document.warehouses || []).forEach((warehouse) => {
                (warehouse.bins || []).forEach((bin) => {
                    const {
                        qtyOnHand
                    } = bin;

                    if (!isNumberDecimal(qtyOnHand)) {
                        bin.qtyOnHandOld = qtyOnHand;
                        bin.qtyOnHand = NumberDecimal(toString(qtyOnHand));
                    }
                });
            });

            (document.vendors || []).forEach((vendor) => {
                const {
                    cost,
                } = vendor;

                if (!isNumberDecimal(cost)) {
                    vendor.costOld = cost;
                    vendor.cost = NumberDecimal(toString(cost));
                }
            });

            db.products.save(document);
        });
}

convertFieldsToDecimal();
