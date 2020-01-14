import {Injectable, OnInit} from '@angular/core';
import {UserFilter} from "../../../../../both/models/userFilter.model";
import {switchMap, tap, map, take} from "rxjs/operators";
import {SystemLogsService} from "../../../services/SystemLogs.service";
import {Action} from "../../../../../both/models/systemLog.model";
import {Random} from "meteor/random";
import {MeteorObservable} from "meteor-rxjs";
import {of} from "rxjs/observable/of";
import {ActivatedRoute, Router} from "@angular/router";

@Injectable()
export class UserFilterService {

  state: any = {
    isDetailHidden: true,
    addedFilters: [],
    selectedFilter: {},
    savedFilters: {},
    columns: []
  };

  queryParams: any;
  currentFilter: UserFilter = new UserFilter();
  constructor(
    private logService: SystemLogsService,
    private route: ActivatedRoute,
    private router: Router
              ) {
  }

  navigate(queryParams) {
    this.route.queryParams
      .pipe(take(1))
      .subscribe(_queryParams => {
      if (_queryParams && 'view' in _queryParams) {
        queryParams.view = _queryParams.view;
      }
      this.router.navigate([], {queryParams});
    })

  }

  _delete$() {
    return this.currentFilter._delete$()
      .pipe(
        switchMap((res) => {
          if (res == 1) {
            let log: Action = {
              collectionName: "userFilters",
              createdAt: new Date,
              log: 'Delete filter',
              type: "remove",
              documentId: this.currentFilter._id,
              fieldPath: ""
            };
            return this.logService._log$(log);
          } else {
            return of(res);
          }
        })
      )
  }

  _save$() {
    let saveResult = 0;
    return this.currentFilter._save$()
      .pipe(
        switchMap((res:any) => {
          saveResult = res;
          if (res == 1) {
            let log: Action = {
              collectionName: "userFilters",
              createdAt: new Date,
              log: 'Update filter',
              type: "UPDATE",
              documentId: this.currentFilter._id,
              fieldPath: ""
            }
            return this.logService._log$(log);
          }
        }),
        map(() => {
          return saveResult;
        })
      )
  }

  _insert$() {
    let insertResult:any = {};
    return this.currentFilter._insert$()
      .pipe(
        switchMap((res) => {
          if (res && typeof res == 'string') {
            insertResult = res;
            let log: Action = {
              collectionName: "userFilters",
              createdAt: new Date,
              log: 'Add new filter',
              type: "INSERT",
              documentId: res,
              fieldPath: ""
            }
            return this.logService._log$(log);
          } else {
            return of(res)
          }
        }),
        map(res => {
          return insertResult;
        })

      )
  }
}
