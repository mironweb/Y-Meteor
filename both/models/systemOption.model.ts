import * as funcs from "../functions/common";
import {SystemModule} from "./systemModule";
import {OnInit} from "@angular/core";
import {MeteorObservable} from "meteor-rxjs";

export interface SystemOptionModel {
    _id?: string;
    name: string;
    value: any;
    createdUserId: string;
    createdAt: Date;
    removed: boolean;
    tenantId: string;
}

export class SystemOption {
  _id?: string;
  name: string;
  value: any;
  createdUserId: string;
  createdAt: Date;
  tenantId: string;
  parentTenantId: string;

  constructor(private optionModel: SystemOptionModel) {
    Object.keys(optionModel).forEach(_key => {
      this[_key] = optionModel[_key];
    });
  }

  static async LoadSystemOptions(query) {
    return await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemOptions', query));
  }

  _save$() {
    let query = {
      _id: this._id
    };
    let update = {
      $set: {
        name: this.name,
        value: this.value,
      }
    };
    return MeteorObservable.call('update', 'systemOptions', query, update);
  }

  _insert$(model) {
    return MeteorObservable.call('insert', 'systemOptions', model);
  }
}
