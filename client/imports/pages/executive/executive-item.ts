import { Type } from '@angular/core';

export class ExecutiveItem {
  constructor(public name: string, public component: Type<any>, public data: any) {}
}
