import {Injectable} from '@angular/core';
import {Action, SystemLog} from "../../../both/models/systemLog.model";
import {MeteorObservable} from "meteor-rxjs";
import {defaultIfEmpty, filter, map, switchMap, tap} from "rxjs/operators";
import * as moment from 'moment';
import {of} from "rxjs/observable/of";
import {UserService} from "./UserService";
import * as funcs from "../../../both/functions/common";
import {Random} from 'meteor/random';

@Injectable()
export class SystemLogsService {
  userId: string = Meteor.userId();
  logId: string;
  systemLog: SystemLog;

  constructor(private userService: UserService) {
    // this.loadCurrentUserSystemLog();
  }

  _multiLogs(logs) {
    if (this.systemLog) {
      console.log('log"', this.systemLog);
      return this.systemLog._multiLog$(logs)
        // .pipe(
        //   switchMap(res => {
        //     if (res) {
        //       if ('fieldPath' in action) {
        //         let syncDoc = {
        //           actionId: action._id,
        //           collectionName: action.collectionName,
        //           fieldPath: action.fieldPath,
        //           type: action.type.toUpperCase(),
        //           documentId: action.documentId,
        //         };
        //         return MeteorObservable.call('insert', 'systemSyncs', syncDoc);
        //       } else {
        //         return of('no fieldpath log', res);
        //       }
        //     } else {
        //       return of('failed', res);
        //     }
        //   })
        // );
    }
  }

  _log$(action: Action) {
    if (!('_id' in action)) {
      action._id = Random.id();
    }
    if (this.systemLog) {
      return this.systemLog._log$(action)
        .pipe(
          switchMap(res => {
            if (res) {
              if ('fieldPath' in action) {
                let syncDoc = {
                  actionId: action._id,
                  collectionName: action.collectionName,
                  fieldPath: action.fieldPath,
                  type: action.type.toUpperCase(),
                  documentId: action.documentId,
                  createdAt: new Date,
                  createdUserId: Meteor.userId()
                };
                return MeteorObservable.call('insert', 'systemSyncs', syncDoc);
              } else {
                return of('no fieldpath log', res);
              }
            } else {
              return of('failed', res);
            }
          })
        );
    }
  }

  loadCurrentUserSystemLog() {
    let findSystemLog:any;
    return of("")
      .pipe(
        switchMap(() => {
          // let sessionId = localStorage.getItem('sessionId');
          let query = {
            createdUserId: Meteor.userId(),
            sessionId: localStorage.getItem('sessionId') ? localStorage.getItem('sessionId'): null
          };
          return MeteorObservable.call('findOne', 'systemLogs', query)
        }),
        filter(log => {
          findSystemLog = log;
          return !!log
        }),
        defaultIfEmpty(undefined),
        map(systemLog => checkIsSameDay(systemLog)),
        switchMap((isSameDay) => {

          if (isSameDay) {
            // is same day, use old one
            return of(findSystemLog);
          } else {
            // it not the same day log, create a new one
            // let sessionId = localStorage.getItem('sessionId');
            // if (sessionId  == '' || sessionId == undefined) {
            //   sessionId = funcs.uuidv4();
            //   localStorage.setItem('sessionId', sessionId);
            // }

            let sessionId = funcs.uuidv4();
            let systemLog = {
              _id: Random.id(),
              sessionId: sessionId,
              createdAt: new Date(),
              createdUserId: Meteor.userId(),
              parentTenantId: Session.get('parentTenantId'),
              actions: []
            };

            console.log('log', systemLog);
            return SystemLog._Insert$()
              .pipe(
                switchMap((result:any) => {
                  return MeteorObservable.call('findOne', 'systemLogs', {_id: result});
                }),
                map((res:any) => {
                  localStorage.setItem('sessionId', res.sessionId);
                  return res;
                })
              )
          }
        }),
        tap(systemLog => {
          // console.log('load log', systemLog);

          if (systemLog !== undefined) {
            this.systemLog = new SystemLog(systemLog);
          } else {
            console.log('it is null');
          }
        })
      )
  }
}

function checkIsSameDay(systemLog) {
  if (systemLog) {
    let result =  moment(systemLog.createdAt).isSame(new Date(), 'day');
    return result;
  } else {
    return false;
  }

}
