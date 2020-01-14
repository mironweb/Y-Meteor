import { Component, OnInit} from "@angular/core";
import {EventEmitterService} from "../../services";
import { MeteorObservable } from "meteor-rxjs";
import { Subscription } from 'rxjs/Subscription';
import * as funcs from '../../../../both/functions/common';
import { UserGroups } from '../../../../both/collections/userGroups.collection';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';

@Component({
  selector: 'account-profile',
  templateUrl: 'account-profile.page.html',
}) export class AccountProfilePage implements OnInit {
  subscriptions: Subscription[] = [];
  menus: any = [];
  selectedUrl: any = {};
  constructor() {}
  
  ngOnInit(){
    this.getMenus()
  }

  onSelect(){
    // let query = {
    //   _id: Meteor.userId()
    // };
    // let update = {
    //   $set: {
    //     "profile.landingUrl": this.selectedUrl.url
    //   }
    // };
    // MeteorObservable.call('update', 'users', query, update).subscribe(res => {});
  }

  getMenus() {

    let query = {
      name: 'sidenav',
      default: true
    };

    MeteorObservable.subscribe('userGroups', { parentTenantId: Session.get('parentTenantId') }, {}).subscribe();

    this.subscriptions[0] = MeteorObservable.subscribe('systemOptions', query, {}, '').subscribe(() => {
      this.subscriptions[1] = MeteorObservable.autorun().subscribe(async () => {
        // let options = SystemOptions.collection.find({}).fetch();
        let groups = UserGroups.collection.find().fetch();

        if (Meteor.userId()) {
          let parentTenantId = Session.get("parentTenantId");
          if (parentTenantId && parentTenantId != '') {
            this.menus = await funcs.callbackToPromise(MeteorObservable.call('getMenusTest', Session.get('parentTenantId')));
          }
        }
      });
    });
  }
}