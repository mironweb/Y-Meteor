import {callbackToPromise} from "./common";
import {MeteorObservable} from "meteor-rxjs";

export function updateContractCategoryPriceLevel() {
  const update = {

  }
  let doc = callbackToPromise(MeteorObservable.call('update', {}))
  return Meteor.call('update', 'customerContracts', );
}