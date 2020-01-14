// round.pipes.ts
import {Pipe, PipeTransform} from "@angular/core";

/**
 *
 */
@Pipe({name: 'roundup'})
export class RoundPipe implements PipeTransform {
  /**
   *
   * @param value
   * @returns {number}
   */
  transform(value: number): number {
    if (value != undefined) {
      return Math.ceil(value);
    } else {
      return;
    }
  }
}