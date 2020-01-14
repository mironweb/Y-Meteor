import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'groupBy'})
export class GroupByPipe implements PipeTransform {
  transform(value: Array<any>, field: string): Array<any> {
    const groupedObj = value.reduce((prev, cur)=> {
      if(!prev[cur[field]]) {
        prev[cur[field]] = [cur];
      } else {
        prev[cur[field]].push(cur);
      }
      return prev;
    }, {});
    let arr = Object.keys(groupedObj).map(key => ({ key, userId: groupedObj[key][0].userId, value: groupedObj[key] })).sort(function (a, b) {
      return a.key < b.key ? -1 : 1
    })
    return arr;
  }
}
