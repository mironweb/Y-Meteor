// round.pipes.ts
import {Pipe, PipeTransform} from "@angular/core";
import moment = require("moment");

/**
 *
 */
@Pipe({name: 'toDate'})
export class ToDate implements PipeTransform {
  /**
   *
   * @param value
   * @returns {number}
   */
  transform(value: Date) {
    if (value != undefined) {
      return moment(new Date(value)).format('M/D/YYYY');
    } else {
      return;
    }
  }
}