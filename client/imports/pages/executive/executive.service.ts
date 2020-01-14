import { Injectable } from '@angular/core';
import ExecutivePages from './components';
import { ExecutiveItem } from './executive-item';

@Injectable()
export class ExecutiveService {
  getExecutiveItems() {
    let arr = [];
    Object.keys(ExecutivePages).forEach(key => {
      let item = new ExecutiveItem(key, ExecutivePages[key], {});
      arr.push(item);
    });
    return arr;
  }
}
