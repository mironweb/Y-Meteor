/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCustomerOrders.js')
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
    print('Converting to decimal fields on customerOrders');
    db.customerOrders.find({})
        .forEach((document) => {
            (document.salespeople || []).forEach((salesperson) => {
                const {
                    commissionPercent,
                } = salesperson;

                if (!isNumberDecimal(commissionPercent)) {
                    salesperson.commissionPercentOld = commissionPercent;
                    salesperson.commissionPercent = NumberDecimal(toString(commissionPercent));
                }
            });

            (document.lineItems || []).forEach((lineItem) => {
                const {
                    price,
                    cost,
                    qtyOrdered,
                    qtyBackordered,
                    qtyShipped,
                    total,
                } = lineItem;

                if (!isNumberDecimal(price)) {
                    lineItem.priceOld = price;
                    lineItem.price = NumberDecimal(toString(price));
                }
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
                if (!isNumberDecimal(qtyShipped)) {
                    lineItem.qtyShippedOld = qtyShipped;
                    lineItem.qtyShipped = NumberDecimal(toString(qtyShipped));
                }
                if (!isNumberDecimal(total)) {
                    lineItem.totalOld = total;
                    lineItem.total = NumberDecimal(toString(total));
                }
            });

            db.customerOrders.save(document);
        });
}

convertFieldsToDecimal();
