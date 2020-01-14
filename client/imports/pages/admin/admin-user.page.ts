import {Component, OnInit, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import { Users } from '../../../../both/collections/users.collection';
import { UserGroups } from '../../../../both/collections/userGroups.collection';
import { SystemTenants } from '../../../../both/collections/systemTenants.collection';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NotificationsService } from 'angular2-notifications';
import { MatDialog } from '@angular/material';

import 'rxjs/add/operator/map';
import {MeteorObservable} from "meteor-rxjs";
import { DialogSelect } from '../../modules/shared-module/system-lookup/system-lookup.component';
import { DialogComponent } from '../../modules/shared-module/dialog/dialog.component';
import {User, UserModel} from "../../../../both/models/user.model";
import {Observable} from "rxjs/Observable";
import {FormControl} from "@angular/forms";
import {EventEmitterService} from "../../services";


export class State {
  constructor(public name: string, public population: string, public flag: string) { }
}

@Component({
  selector: 'admin-user',
  templateUrl: 'admin-user.page.html',
  styleUrls: [ 'admin.scss' ]
})

export class AdminUserPage implements OnInit{

  @ViewChild("manageUserTenantsLookup") manageUserTenantsLookup;
  @Input() data: any;
  @Output() onSelected = new EventEmitter<string>();
  referredUser: UserModel;

  selections = [
    {
      username: 'Arkansas',
      name: "arkansas",
      population: '2.978M',
      // https://commons.wikimedia.org/wiki/File:Flag_of_Arkansas.svg
      flag: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Flag_of_Arkansas.svg'
    },  ];

  allUsers: UserModel[] = [{
    _id: "",
    username: 'guofu',
    referredUserId: ''
  }];
  filteredUsers: Observable<User[]>;

  changePassword = '';
  documentId: string;
  firstName: string;
  lastName: string;
  username: string;
  emailAddress: string;
  fullName: string;
  user: any = {};
  ctrl = new FormControl()

  fromCollection: any;
  updateCollection: any;
  lookupName: string;

  fromCollectionGroups: any;
  updateCollectionGroups: any;
  updatedDocumentIdGroups: string;

  fromCollectionTenants: any;
  updateCollectionTenants: any;
  updatedDocumentIdTenants: string;
  lookupNameTenants: string;

  userCtrl = new FormControl();

  public options = {
    timeOut: 5000,
    lastOnBottom: true,
    clickToClose: true,
    maxLength: 0,
    maxStack: 7,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    preventLastDuplicates: 'visible',
    rtl: false,
    animate: 'scale',
    position: ['right', 'bottom']
  };

  constructor(private route: ActivatedRoute, private router: Router, private dialog: MatDialog,  private _service: NotificationsService) {

  }

  filterUsers(searchUser) {
    return this.allUsers.filter(user => {
      return user.username.toLowerCase().indexOf(searchUser.username.toLowerCase()) === 0
    });
  }

  async ngOnInit() {
    MeteorObservable.call('find', 'users', {}).subscribe((res: User[]) => {
      this.allUsers = res;

      let selectedUser = this.allUsers.find(user => this.documentId == user._id);

      const tenant:any = selectedUser.tenants.find((tenant:any) => tenant._id == Session.get('tenantId'))
      let referredUserId = '';
      if (tenant && 'referredUserId' in tenant) {
        referredUserId = tenant.referredUserId;
      }
      this.referredUser = this.allUsers.find(user => referredUserId == user._id);

        // if (user._id == UserService.user.referredUserId) {
        //   this.referredUser = user;
        //   return true;
        // }
      // this.filteredUsers = this.userCtrl.valueChanges
      //   .pipes(
      //     startWith(''),
      //     map((user:any) => {
      //       if (typeof user == 'string') {
      //         return user ? this.filterUsers({username: user}) : this.allUsers.slice()
      //       } else {
      //         return user ? this.filterUsers(user) : this.allUsers.slice()
      //       }
      //     })
      //   )
    });

    this.route.params.subscribe((params: Params) => {
      this.documentId = params['documentId'];
    });

    this.fromCollection = Users;
    this.updateCollection = Users;
    this.documentId = this.documentId;

    this.fromCollectionGroups = UserGroups;
    this.updateCollectionGroups = Users;
    this.updatedDocumentIdGroups = this.documentId;
    // this.lookupNameGroups = "manageUserTenantGroups";


    this.fromCollectionTenants = SystemTenants;
    this.updateCollectionTenants = Users;
    this.updatedDocumentIdTenants = this.documentId;
    this.lookupNameTenants = "updateSystemTenants";


    MeteorObservable.call('returnUser', this.documentId).subscribe(userInfo => {

      if (userInfo !== undefined) {
        this.firstName = userInfo["profile"].firstName;
        this.lastName = userInfo["profile"].lastName;
        this.username = userInfo["username"];
        this.emailAddress = userInfo["emails"][0].address;

        this.fullName = this.firstName + " " + this.lastName
      }
    });

    // const newUser = new User("tquDCsurDQSjnp3rt");
    // await newUser.init();
    // console.log('new user', newUser);

    // const newUser1:UserModel = await User._getUserById("tquDCsurDQSjnp3rt").toPromise();

  }

  removeUser() {
    let dialogRef = this.dialog.open(DialogSelect);
    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        let query = {
          _id: this.documentId
        };
        let update = {
          $set: {
            removed: true
          }
        };
        MeteorObservable.call('update', 'users', query, update).subscribe(res => {
          this._service.success(
            'Success',
            'Removed Successfully'
          );
          this.router.navigate(['/admin/users']);
        });

      }
    });
  }

  savePassword() {
    MeteorObservable.call('setPassword', this.documentId, this.user.newPassword).subscribe(res => {
      if (res) {
        EventEmitterService.Events.emit({
          componentName: "dashboard",
          name: "success",
          title: "Update Successfully"
        })
      } else {
        EventEmitterService.Events.emit({
          componentName: "dashboard",
          name: "error",
          title: "Failed"
        })
      }
    });
  }

  onEvent(event) {
    if (event.name == 'completeUpdate') {
      this.manageUserTenantsLookup.reloadData('reload');
    }
  }

  addTenant() {
    let dialogRef = this.dialog.open(DialogComponent);
    dialogRef.componentInstance['lookupName'] = 'addTenant';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let query = {
          _id: this.documentId
        }
        MeteorObservable.call('findOne', 'users', query, {}).subscribe((res:any) => {
          let tenants = res.tenants;
          let exist = false;
          tenants.some(tenant => {
            if (tenant._id === result._id) {
              exist = true;
              return true;
            }
          });
          if (exist) {
            this._service.error('Failed', 'already exist');
          } else {
            let update = {
              $addToSet: {
                tenants: {
                  _id: result._id,
                  enabled: true,
                  groups: [""]
                }
              }
            }

            MeteorObservable.call('update', 'users', query, update).subscribe(res => {
              this._service.success('Success', 'Update Successfully');
            })
          }
        })
      }
    });
  }

  onUserSelected(selectedUser) {
    const query = {
      _id: this.documentId,
      "tenants._id": Session.get('tenantId')
    }
    const update = {
      $set: {
        "tenants.$.referredUserId": selectedUser.option.value._id
      }
    }

    MeteorObservable.call('update', 'users', query, update).subscribe();
  }

  displayFn(user: User): string | undefined {
    return user ? user.username : undefined;
  }

  onUserChange(selectedUser) {
    const query = {
      _id: this.documentId,
      "tenants._id": Session.get('tenantId')
    };
    const update = {
      $set: {
        "tenants.$.referredUserId": selectedUser.value._id
      }
    };
    MeteorObservable.call('update', 'users', query, update).subscribe(res => {
    });
  }

  onBlurMethod(target){
    let field = target.name;
    let value = target.value;
    let query = {
      _id: this.documentId
    }
    let update = {
      $set: {
        [field]: value
      }
    };
    MeteorObservable.call('update', 'users', query, update).subscribe(res => {})
  }
}