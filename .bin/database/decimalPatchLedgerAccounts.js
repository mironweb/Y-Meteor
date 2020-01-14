/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchLedgerAccounts.js')
 */

function isNumberDecimal(value) {
    return value instanceof NumberDecimal;
}

function isNumber(value) {
    return typeof value === 'number';
}

function isUndefined(value) {
    return typeof value === 'undefined';
}

function toString(value) {
    if (!isNumber(value)) return '0';
    return value.toString();
}

function convertFieldsToDecimal() {
    print('Converting to decimal fields on ledgerAccounts');
    db.ledgerAccounts.find({})
        .forEach((document) => {
            (document.totals || []).forEach((total) => {
                const {
                    beginningBalance,
                    debitAmounts,
                    creditAmounts,
                    budgetDebitAmounts,
                    budgetCreditAmounts,
                } = total;

                if (!isNumberDecimal(beginningBalance)) {
                    total.beginningBalanceOld = beginningBalance;
                    total.beginningBalance = NumberDecimal(toString(beginningBalance));
                }
                if (!isUndefined(debitAmounts) && debitAmounts.length && !isNumberDecimal(debitAmounts[0])) {
                    total.debitAmountsOld = debitAmounts;
                    total.debitAmounts = debitAmounts.map(amount => NumberDecimal(toString(amount)));
                }
                if (!isUndefined(creditAmounts) && creditAmounts.length && !isNumberDecimal(creditAmounts[0])) {
                    total.creditAmountsOld = creditAmounts;
                    total.creditAmounts = creditAmounts.map(amount => NumberDecimal(toString(amount)));
                }
                if (!isUndefined(budgetDebitAmounts) && budgetDebitAmounts.length && !isNumberDecimal(budgetDebitAmounts[0])) {
                    total.budgetDebitAmountsOld = budgetDebitAmounts;
                    total.budgetDebitAmounts = budgetDebitAmounts.map(amount => NumberDecimal(toString(amount)));
                }
                if (!isUndefined(budgetCreditAmounts) && budgetCreditAmounts.length && !isNumberDecimal(budgetCreditAmounts[0])) {
                    total.budgetCreditAmountsOld = budgetCreditAmounts;
                    total.budgetCreditAmounts = budgetCreditAmounts.map(amount => NumberDecimal(toString(amount)));
                }
            });

            db.ledgerAccounts.save(document);
        });
}

convertFieldsToDecimal();
