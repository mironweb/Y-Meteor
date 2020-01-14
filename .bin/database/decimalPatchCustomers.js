/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCustomers.js')
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
    print('Converting to decimal fields on customers');
    db.customers.find({})
        .forEach((document) => {
            const {
                currentDue,
                pastDue1,
                pastDue2,
                pastDue3,
                pastDue4,
                latitude,
                longitude,
            } = document;

            if (!isNumberDecimal(currentDue)) {
                document.currentDueOld = currentDue;
                document.currentDue = NumberDecimal(toString(currentDue));
            }
            if (!isNumberDecimal(pastDue1)) {
                document.pastDue1Old = pastDue1;
                document.pastDue1 = NumberDecimal(toString(pastDue1));
            }
            if (!isNumberDecimal(pastDue2)) {
                document.pastDue2Old = pastDue2;
                document.pastDue2 = NumberDecimal(toString(pastDue2));
            }
            if (!isNumberDecimal(pastDue3)) {
                document.pastDue3Old = pastDue3;
                document.pastDue3 = NumberDecimal(toString(pastDue3));
            }
            if (!isNumberDecimal(pastDue4)) {
                document.pastDue4Old = pastDue4;
                document.pastDue4 = NumberDecimal(toString(pastDue4));
            }
            if (!isNumberDecimal(latitude)) {
                document.latitudeOld = latitude;
                document.latitude = NumberDecimal(toString(latitude));
            }
            if (!isNumberDecimal(longitude)) {
                document.longitudeOld = longitude;
                document.longitude = NumberDecimal(toString(longitude));
            }

            (document.branches || []).forEach((branch) => {
                const {
                    latitude,
                    longitude,
                } = branch;

                if (!isNumberDecimal(latitude)) {
                    branch.latitudeOld = latitude;
                    branch.latitude = NumberDecimal(toString(latitude));
                }
                if (!isNumberDecimal(longitude)) {
                    branch.longitudeOld = longitude;
                    branch.longitude = NumberDecimal(toString(longitude));
                }

                (branch.salespeople || []).forEach((salesperson) => {
                    const {
                        commissionPercent
                    } = salesperson;

                    if (!isNumberDecimal(commissionPercent)) {
                        salesperson.commissionPercentOld = commissionPercent;
                        salesperson.commissionPercent = NumberDecimal(toString(commissionPercent));
                    }
                });
            });

            db.customers.save(document);
        });
}

convertFieldsToDecimal();
