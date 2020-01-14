/*
When use raw functions, need to use promise.await to have synchronize function
 */


import { AllCollections } from '../../../both/collections';


export function update(collectionName, query, update?, options?) {
  return AllCollections[collectionName].rawCollection().update(query, update, options);
}
export function insert() {

}

export function find() {

}

export function findOne(collectionName, query, update?, options?) {
  return AllCollections[collectionName].rawCollection().findOne(query, update, options);
}

export function remove() {

}

