import {AllCollections} from "../collections/index";
import * as funcs from "../functions/common";
import {OnInit} from "@angular/core";
import {MeteorObservable} from "meteor-rxjs";

export interface SystemModule {
  _id: string;
  name: string;
  url: string;
}

export class SystemModuleClass implements OnInit{
  systemModule: SystemModule;
  constructor() {}

  static async LoadSystemModuleByUrl(url) {
    return await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemModules', {url}));
  }

  ngOnInit() {

  }
}
