/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/decimalPatchCategories.js')
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
    print('Converting to decimal fields on categories');
    db.categories.find({})
        .forEach((document) => {
            const {
                priceLevel1Percent,
                priceLevel2Percent,
                priceLevel3Percent,
                priceLevel4Percent,
                multiplierLevel1,
                multiplierLevel2,
                multiplierLevel3,
                multiplierLevel4,
            } = document;

            if (!isNumberDecimal(priceLevel1Percent)) {
                document.priceLevel1PercentOld = priceLevel1Percent;
                document.priceLevel1Percent = NumberDecimal(toString(priceLevel1Percent));
            }
            if (!isNumberDecimal(priceLevel2Percent)) {
                document.priceLevel2PercentOld = priceLevel2Percent;
                document.priceLevel2Percent = NumberDecimal(toString(priceLevel2Percent));
            }
            if (!isNumberDecimal(priceLevel3Percent)) {
                document.priceLevel3PercentOld = priceLevel3Percent;
                document.priceLevel3Percent = NumberDecimal(toString(priceLevel3Percent));
            }
            if (!isNumberDecimal(priceLevel4Percent)) {
                document.priceLevel4PercentOld = priceLevel4Percent;
                document.priceLevel4Percent = NumberDecimal(toString(priceLevel4Percent));
            }
            if (!isNumberDecimal(multiplierLevel1)) {
                document.multiplierLevel1Old = multiplierLevel1;
                document.multiplierLevel1 = NumberDecimal(toString(multiplierLevel1));
            }
            if (!isNumberDecimal(multiplierLevel2)) {
                document.multiplierLevel2Old = multiplierLevel2;
                document.multiplierLevel2 = NumberDecimal(toString(multiplierLevel2));
            }
            if (!isNumberDecimal(multiplierLevel3)) {
                document.multiplierLevel3Old = multiplierLevel3;
                document.multiplierLevel3 = NumberDecimal(toString(multiplierLevel3));
            }
            if (!isNumberDecimal(multiplierLevel4)) {
                document.multiplierLevel4Old = multiplierLevel4;
                document.multiplierLevel4 = NumberDecimal(toString(multiplierLevel4));
            }

            db.categories.save(document);
        });
}

convertFieldsToDecimal();
