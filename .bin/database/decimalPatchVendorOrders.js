/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchVendorOrders.js')
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
    print('Converting to decimal fields on vendorOrders');
    db.vendorOrders.find({})
        .forEach((document) => {
            (document.lineItems || []).forEach((lineItem) => {
                const {
                    cost,
                    qtyOrdered,
                    qtyBackordered,
                    qtyReceived,
                    total,
                } = lineItem;

                if (!isNumberDecimal(cost)) {
                    lineItem.costOld = cost;
                    lineItem.cost = NumberDecimal(toString(cost));
                }
                if (!isNumberDecimal(qtyOrdered)) {
                    lineItem.qtyOrderedOld = qtyOrdered;
                    lineItem.qtyOrdered = NumberDecimal(toString(qtyOrdered));
                }
                if (!isNumberDecimal(qtyBackordered)) {
                    lineItem.qtyBackorderedOld = qtyBackordered;
                    lineItem.qtyBackordered = NumberDecimal(toString(qtyBackordered));
                }
                if (!isNumberDecimal(qtyReceived)) {
                    lineItem.qtyReceivedOld = qtyReceived;
                    lineItem.qtyReceived = NumberDecimal(toString(qtyReceived));
                }
                if (!isNumberDecimal(total)) {
                    lineItem.totalOld = total;
                    lineItem.total = NumberDecimal(toString(total));
                }
            });

            db.vendorOrders.save(document);
        });
}

convertFieldsToDecimal();
