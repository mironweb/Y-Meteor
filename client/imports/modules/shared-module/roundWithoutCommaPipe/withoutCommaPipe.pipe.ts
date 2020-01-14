import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'withoutCommaPipe' })
export class WithoutCommaPipe implements PipeTransform {
  transform(value): any {

    if (!value) {
      value = 0;
    }
    if (typeof value === 'string') {
      return value;
    } else {
      return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }
}
