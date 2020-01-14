/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCustomerQuotes.js')
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
    print('Converting to decimal fields on customerQuotes');
    db.customerQuotes.find({})
        .forEach((document) => {
            (document.products || []).forEach((product) => {
                const {
                    price,
                    previousPrice,
                } = product;

                if (!isNumberDecimal(price)) {
                    product.priceOld = price;
                    product.price = NumberDecimal(toString(price));
                }
                if (!isNumberDecimal(previousPrice)) {
                    product.previousPriceOld = previousPrice;
                    product.previousPrice = NumberDecimal(toString(previousPrice));
                }
            });

            db.customerQuotes.save(document);
        });
}

convertFieldsToDecimal();
