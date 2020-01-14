/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCustomerPayments.js')
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
    print('Converting to decimal fields on customerPayments');
    db.customerPayments.find({})
        .forEach((document) => {
            (document.remittance || []).forEach((remittance) => {
                const {
                    amount,
                } = remittance;

                if (!isNumberDecimal(amount)) {
                    remittance.amountOld = amount;
                    remittance.amount = NumberDecimal(toString(amount));
                }

                (remittance.invoices || []).forEach((invoice) => {
                    const {
                        amountApplied,
                        discountApplied,
                    } = invoice;

                    if (!isNumberDecimal(amountApplied)) {
                        invoice.amountAppliedOld = amountApplied;
                        invoice.amountApplied = NumberDecimal(toString(amountApplied));
                    }
                    if (!isNumberDecimal(discountApplied)) {
                        invoice.discountAppliedOld = discountApplied;
                        invoice.discountApplied = NumberDecimal(toString(discountApplied));
                    }
                });
            });

            db.customerPayments.save(document);
        });
}

convertFieldsToDecimal();
