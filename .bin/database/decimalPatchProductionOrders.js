/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchProductionOrders.js')
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
    print('Converting to decimal fields on productionOrders');
    db.productionOrders.find({})
        .forEach((document) => {
            (document.lineItems || []).forEach((lineItem) => {
                const {
                    cost,
                } = lineItem;

                if (!isNumberDecimal(cost)) {
                    lineItem.costOld = cost;
                    lineItem.cost = NumberDecimal(toString(cost));
                }
            });

            db.productionOrders.save(document);
        });
}

convertFieldsToDecimal();
