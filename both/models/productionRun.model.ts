import {MeteorObservable} from "meteor-rxjs";
import {Random} from "meteor/random";
import {ProductionOrder} from "./productionOrder.model";
import {map, switchMap, tap} from "rxjs/operators";
import {of} from "rxjs";

export interface ProductionRunModel {
  _id?: string;
  createdAt?: Date;
  createdUserId: string;
  productionOrderId: string;
  status: string;
  tenantId?: string;
  productionQty: number;
  workers?: Worker[];
  notes?: Note[];
}

export interface Note {
  _id: string;
  createdUserId: string;
  createdAt: Date;
  message: string;
  updatedAt?: Date;
  isEdit?: boolean;
}

export interface Worker {
  _id: string;
  createdUserId: string;
  createdAt: Date;
  cost: number;
  days?: Days[];
}

export interface Days {
  _id: string;
  createdUserId: string;
  createdAt: Date;
  date: Date;
  productionQty: number;
  times: {
    _id: string;
    createdUserId: string;
    createdAt: Date;
    loggedOut: Date;
    loggedIn: Date;
  }[];
}

export class ProductionRun {

  static _Insert$(productionRun) {
    // productionRuns.status = 'open';
    productionRun._id = Random.id();
    productionRun.workers = (productionRun.workers || []).map((worker) => ({
      ...worker,
      cost: new Decimal(worker.cost),
    }));
    return MeteorObservable.call('insert', 'productionRuns', productionRun);
  }

  _id?: string;
  productionOrderId: string;
  status?: string;
  tenantId?: string;
  createdAt?: Date;
  createdUserId: string;
  productionQty: number;
  workers?: Worker[];
  notes?: Note[];

  constructor(productionRun: ProductionRunModel) {
    Object.keys(productionRun).forEach(_key => {
      this[_key] = productionRun[_key];
    });
  }

  _save$() {
    let query = {
      _id: this._id
    }

    let update = {
      $set: {
        status: this.status,
        workers: (this.workers || []).map((worker) => ({
          ...worker,
          cost: new Decimal(worker.cost),
        })),
        notes: this.notes
      }
    };
    return MeteorObservable.call('update', 'productionRuns', query, update);
  }

  _remove$() {
    return MeteorObservable.call('remove', 'productionRuns', {_id: this._id});
  }

  _completeRun$(log, completeOrder) {
    return MeteorObservable.call('completeRun', this, log, completeOrder);
  }

  _saveStatus$() {
    let productionOrder:ProductionOrder;
    return this._save$()
      .pipe(
        switchMap((res:any) => {
          if (res && this.productionOrderId) {
            return ProductionOrder._FindOne$({_id: this.productionOrderId});
          } else {
            return of(null);
          }
        }),
        switchMap(res => {
          if (res) {
            productionOrder = new ProductionOrder(res);
            switch(this.status) {
              case 'Staged':
                productionOrder.status = 'In Progress';
                return productionOrder._save$();
              case 'Canceled':
                let query = {
                  productionOrderId: this.productionOrderId,
                  status: "Complete"
                };

                return MeteorObservable.call('findOne', 'productionRuns', query)
                  .pipe(
                    switchMap(res => {
                      if (res) {
                        // if the order has any productionRuns with a status of complete
                        productionOrder.status = 'Open';
                      } else {
                        // if the order doesn't have any productionRuns with a status of complete
                        productionOrder.status = 'New';
                      }
                      return productionOrder._save$();
                    })
                  );
              case 'Complete':
                return this._calculateRemaining$()
                  .pipe(
                    switchMap(res => {
                      if (res > 0) {
                        productionOrder.status = 'Open';
                      } else if(res == 0) {
                        productionOrder.status = 'Complete';
                      }
                      return productionOrder._save$()
                    })
                  )

            }

          } else {

          }
        }),
      )
  }

  _calculateRemaining$() {
    let productionOrder: ProductionOrder;
    return ProductionOrder._FindOne$({_id: this.productionOrderId})
      .pipe(
        switchMap((res:any) => {
          if (res) {
            productionOrder = new ProductionOrder(res);
            return MeteorObservable.call('find', "productionRuns", {productionOrderId: this.productionOrderId, status: 'Complete'})
              .pipe(
                map((res:any) => {
                  let allRunQty = 0;
                  let findRow = res.find(_row => _row._id == this._id);
                  if (findRow) {
                  } else {
                    res.push(this);
                  }

                  res.forEach(_run => {
                    if ('workers' in _run) {
                      _run.workers.forEach(_worker => {
                        if ('days' in _worker) {
                          _worker.days.forEach(_day => {
                            if ('productionQty' in _day)
                              allRunQty+= _day.productionQty;
                          })
                        }
                      })
                    }
                  });

                  return productionOrder.productionQty - allRunQty;
                })
              );
          } else {
            return of(null);
          }
        })
      )
  }

  _addNote$(note) {
    // this.notes.push(note);
    let query = {
      _id: this._id
    };

    let update = {
      $push: {
        notes: note
      }
    };

    return MeteorObservable.call('update', 'productionRuns', query, update);
  }

  _loadNotes$() {
    return MeteorObservable.call('')
  }

}