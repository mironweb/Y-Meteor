import {MongoObservable} from "meteor-rxjs";

export const LedgerAccounts = new MongoObservable.Collection<any>('ledgerAccounts');