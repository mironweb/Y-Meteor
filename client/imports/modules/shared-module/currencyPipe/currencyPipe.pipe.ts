import { Pipe, PipeTransform } from '@angular/core';
import * as funcs from '../../../../../both/functions/common';

@Pipe({name: 'customCurrency'})
export class CurrencyPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value == 'string'){
      value = parseFloat(value.replace(/,/g, ''));
    }
    return funcs.formatMoney(value);
  }
}