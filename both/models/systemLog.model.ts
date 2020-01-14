// has default, belongs to tenantId
import {UserService} from "../../client/imports/services/UserService";
import {MeteorObservable} from "meteor-rxjs";
import * as funcs from "../functions/common";
import {Random} from "meteor/random";
import {map, tap} from "rxjs/operators";

export interface SystemLogModel {
  _id?: string;
  sessionId: string;
  actions: Array<Action>;
  parentTenantId: string;
  tenantId: string;
  createdUserId: string;
  createdAt?: Date;
}
/*

 */
export interface Action {
  _id?: string;
  url?: string;
  type?: string;
  createdAt: Date;
  log: string;
  documentId?: string;
  collectionName?: string;
  fieldPath?: string; // path: {fieldname_(_id or data type)}
  value?: any;
  previousValue?: any;
}

const properties = [
  "_id",
  "sessionId",
  "actions",
  "parentTenantId",
  "createdUserId",
  "createdAt"
];

export class SystemLog implements SystemLogModel {

  static _InsertOne$(systemLog) {
    return MeteorObservable.call('insert', 'systemLogs', systemLog)
  }

  static _Insert$() {
    let sessionId = funcs.uuidv4();
    let systemLog = {
      _id: Random.id(),
      sessionId: sessionId,
      createdAt: new Date(),
      createdUserId: Meteor.userId(),
      parentTenantId: Session.get('parentTenantId'),
      tenantId: Session.get('tenantId'),
      actions: []
    };
    return MeteorObservable.call('insert', 'systemLogs', systemLog);
  }
  _id?: string;
  sessionId: string;
  actions: Array<Action>;
  parentTenantId: string;
  createdUserId: string;
  createdAt?: Date;
  tenantId: string;

  constructor(systemLog: SystemLogModel) {
    if (systemLog) {
      properties.forEach(property => {
        if (systemLog[property]) {
          this[property] = systemLog[property];
        }
      });
    }
  }

  _multiLog$(logs) {
    const query = {
      _id: this._id
    };

    let actions = [...this.actions, ...logs];
    console.log('actions', this.actions, actions.toString());
    const update = {
      $set: {
        actions: actions
      }
    };

    return MeteorObservable.call('rawUpdate', 'systemLogs', query, update);
  }

  _log$(action: Action) {
    const query = {
      _id: this._id
    };

    const update = {
      $push: {
        actions: action
      }
    };

    return MeteorObservable.call('update', 'systemLogs', query, update);
  }

  // this method is used to return data for transactions
  _getLogData(method) {
    let action = {
      _id: Random.id(),
      log: method.log,
      value: method.value,
      previousValue: method.previousValue,
      createdAt: new Date()
    }
     return {
      _id: this._id,
      createdUserId: Meteor.userId(),
      tenantId: this.tenantId,
      sessionId: "",
      parentTenantId: this.tenantId,
    }
  }
}