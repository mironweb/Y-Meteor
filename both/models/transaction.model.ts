import {Note} from "./productionRun.model";
import {MeteorObservable} from "meteor-rxjs";
import {Random} from 'meteor/random';

export interface TransactionModel {
  _id?: string;
  collectionName: string;
  type: string; // InventoryTransfer, ProductionRun,
  documentId: string;
  createdAt: Date;
  createdUserId: string;
  tenantId: string;
  number: string;
  date: Date;
  status: string; // Conmplete
  notes: Note[],
  lineItems: TransactionLineItem[];
}

export interface TransactionLineItem {
  _id: string;
  productId?: string; // option for type "InventoryTransfer"
  binId?: string; // option for type "InventoryTransfer"
  legerAccount?: number;
  qty: number;
  cost?: Decimal;
  price?: number;
}


export class Transaction {
  _id: string;
  collectionName: string;
  lineItems: string[];
  type: string;
  documentId: string;
  createdAt: Date;
  createdUserId: string;

  static _UPDATE$(transactions) {

    transactions = [
      {

      }
    ]

    return MeteorObservable.call('test', transactions);
  }

  static _Insert$(transaction: TransactionModel) {
    let p = {
      _id: Random.id(),
      createdAt: new Date(),
      lineItems: [],
      documentId: '',
      createdUserId: Meteor.userId()
    }
    return MeteorObservable.call('insert', 'transactions', transaction);
  }

  constructor(transaction: TransactionModel) {

  }
}