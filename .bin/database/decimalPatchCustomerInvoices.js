/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCustomerInvoices.js')
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
    print('Converting to decimal fields on customerInvoices');
    db.customerInvoices.find({})
        .forEach((document) => {
            const {
                freight,
                freightCredit,
                discount,
                balance,
            } = document;

            if (!isNumberDecimal(freight)) {
                document.freightOld = freight;
                document.freight = NumberDecimal(toString(freight));
            }
            if (!isNumberDecimal(freightCredit)) {
                document.freightCreditOld = freightCredit;
                document.freightCredit = NumberDecimal(toString(freightCredit));
            }
            if (!isNumberDecimal(discount)) {
                document.discountOld = discount;
                document.discount = NumberDecimal(toString(discount));
            }
            if (!isNumberDecimal(balance)) {
                document.balanceOld = balance;
                document.balance = NumberDecimal(toString(balance));
            }

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
                if (!isNumberDecimal(qtyShipped)) {
                    lineItem.qtyShippedOld = qtyShipped;
                    lineItem.qtyShipped = NumberDecimal(toString(qtyShipped));
                }
                if (!isNumberDecimal(total)) {
                    lineItem.totalOld = total;
                    lineItem.total = NumberDecimal(toString(total));
                }
            });

            db.customerInvoices.save(document);
        });
}

convertFieldsToDecimal();
