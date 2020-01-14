/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchProductionRuns.js')
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
    print('Converting to decimal fields on productionRuns');
    db.productionRuns.find({})
        .forEach((document) => {
            (document.workers || []).forEach((worker) => {
                const {
                    cost,
                } = worker;

                if (!isNumberDecimal(cost)) {
                    worker.costOld = cost;
                    worker.cost = NumberDecimal(toString(cost));
                }
            });

            db.productionRuns.save(document);
        });
}

convertFieldsToDecimal();
