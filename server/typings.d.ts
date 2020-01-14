/// <reference types="zone.js" />
/// <reference types="@types/meteor" />
/// <reference types="@types/underscore" />
/// <reference types="@types/chai" />
/// <reference types="@types/mocha" />
/// <reference types="@types/node" />

declare module "*.html" {
  const template: string;
  export default template;
}

declare module "*.scss" {
  const style: string;
  export default style;
}

declare module "*.less" {
  const style: string;
  export default style;
}

declare module "*.css" {
  const style: string;
  export default style;
}

declare module "*.sass" {
  const style: string;
  export default style;
}

declare module "meteor/hwillson:stub-collections" {
  import { Mongo } from "meteor/mongo";

  interface IStubCollections {
    stub(collection: Mongo.Collection<any>);
    restore();
  }

  const StubCollections: IStubCollections;

  export default StubCollections;
}

declare module "chai-spies" {
  const chaiSpies: (chai: any, utils: any) => void;

  export = chaiSpies;
}

declare module 'meteor/tmeasday:publish-counts' {
  import { Mongo } from 'meteor/mongo';

  interface CountsObject {
    get(publicationName: string): number;
    publish(context: any, publicationName: string, cursor: Mongo.Cursor<any>, options: any): number;
  }

  export const Counts: CountsObject;
}

interface SpyCalledWith extends Chai.Assertion {
  (...args: any[]): void;
  exactly(...args: any[]): void;
}

interface SpyCalledAlways extends Chai.Assertion {
  with: SpyCalledWith;
}

interface SpyCalledAt {
  most(n: number): void;
  least(n: number): void;
}

interface SpyCalled {
  (n?: number): void;
  /**
   * Assert that a spy has been called exactly once
   *
   * @api public
   */
  once: any;
  /**
   * Assert that a spy has been called exactly twice.
   *
   * @api public
   */
  twice: any;
  /**
   * Assert that a spy has been called exactly `n` times.
   *
   * @param {Number} n times
   * @api public
   */
  exactly(n: number): void;
  with: SpyCalledWith;
  /**
   * Assert that a spy has been called `n` or more times.
   *
   * @param {Number} n times
   * @api public
   */
  min(n: number): void;
  /**
   * Assert that a spy has been called `n` or fewer times.
   *
   * @param {Number} n times
   * @api public
   */
  max(n: number): void;
  at: SpyCalledAt;
  above(n: number): void;
  /**
   * Assert that a spy has been called more than `n` times.
   *
   * @param {Number} n times
   * @api public
   */
  gt(n: number): void;
  below(n: number): void;
  /**
   * Assert that a spy has been called less than `n` times.
   *
   * @param {Number} n times
   * @api public
   */
  lt(n: number): void;
}

declare namespace Chai {
  interface ChaiStatic {
    spy(): any;
  }

  interface Assertion {
    called: SpyCalled;
    always: SpyCalledAlways;
  }
}

// added by Guofu Sep 13, 2017
declare module "*.json" {
  const value: any;
  export default value;
}


// added by Guofu Sep 21, 2017
declare const ReactiveDict: ReactiveDictStatic;
interface ReactiveDictStatic {
  new <T>(equalsFunc?: Function): ReactiveDict<T>;
}

interface ReactiveDict<T> {
  equals(key: string, value: string | number | boolean | any): boolean;
  get(key: string): any;
  set(key: string, value: EJSONable | any): void;
}

declare module "meteor/promise";
declare module "meteor/reactive-dict" {
  const ReactiveDict: ReactiveDictStatic;
  interface ReactiveDictStatic {
    new <T>(equalsFunc?: Function): ReactiveDict<T>;
  }

  interface ReactiveDict<T> {
    equals(key: string, value: string | number | boolean | any): boolean;
    get(key: string): any;
    set(key: string, value: EJSONable | any): void;
  }
}
// end: Sep 21, 2017


// start: Oct 26, 2017
declare const SSR;
declare const MarkerClusterer;
// end: Oct 26, 2017

declare const TimeSync;
declare const UserStatus;

// May 22, 2018
declare const MongoInternals;
