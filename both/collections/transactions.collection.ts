import { MongoObservable } from 'meteor-rxjs';

export const Transactions = new MongoObservable.Collection('transactions');