import {MeteorObservable} from "meteor-rxjs";
import {isNull} from "@angular/compiler/src/output/output_ast";

export interface CategoryModel {
  _id?: string;
  name: string;
  allowCustomerContract: boolean;
  allowCustomerQuote: boolean;
  priceLevel1Percent: number;
  priceLevel2Percent: number;
  priceLevel3Percent: number;
  priceLevel4Percent: number;
  multiplierLevel1: number;
  multiplierLevel2: number;
  multiplierLevel3: number;
  multiplierLevel4: number;
  priceLevelType: string;
  createdUserId: string;
  createdAt: Date;
  removed: boolean;
  tenantId: string;
}


export class Category {
  _id?: string;
  name: string;
  allowCustomerContract: boolean;
  allowCustomerQuote: boolean;
  priceLevel1Percent: number;
  priceLevel2Percent: number;
  priceLevel3Percent: number;
  priceLevel4Percent: number;
  multiplierLevel1: number;
  multiplierLevel2: number;
  multiplierLevel3: number;
  multiplierLevel4: number;
  priceLevelType: string;
  createdUserId: string;
  createdAt: Date;
  removed: boolean;
  tenantId: string;

  constructor(category) {
    Object.keys(category).forEach(property => {
      this[property] = category[property];
    });
  }

  _save$() {
    return MeteorObservable.call('update', )
  }

  _insert$() {

  }

  _update$(update) {
    return MeteorObservable.call('update', 'categories', {_id: this._id}, update);
  }

  _remove$() {

  }
}