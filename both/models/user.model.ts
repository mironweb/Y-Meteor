import {MeteorObservable} from "meteor-rxjs";
import {Observable} from "rxjs/Observable";


export interface Profile {
  firstName?: string;
  lastName?: string;
  picture?: string;
  status?: string;
}

const properties = [
  "_id",
  "profile",
  "groups",
  "tenants",
  "removed",
  "tenantId",
  "manages",
  "username",
  "createdUserId",
  "blockedCustomers",
  "referredUserId",
  "status"
];

export interface UserModel {
  _id: string;
  profile?: Profile;
  groups?: {}[];
  tenants?: Tenant[];
  removed?: boolean;
  tenantId?: string;
  createdAt?: Date;
  manages?: string[];
  username?: string;
  creaatedUserId?: string;
  status?: Status;
  blockedCustomers?: string[],
  referredUserId: string;
}

interface Tenant {
  lookups: any[];
  groups: string[];
}

interface Status {
  editable: boolean;
}

export class User implements UserModel {
  _id: string;
  profile: Profile;
  groups: {}[];
  tenants: Tenant[];
  removed: boolean;
  tenantId: string;
  manages: string[];
  username: string;
  creaatedUserId: string;
  blockedCustomers: string[];
  referredUserId: string;

  static _getUserById(userId): Observable<UserModel> {
    return MeteorObservable.call('findOne', 'users', {_id: userId})
  }

  static _insert$(doc) {
    return MeteorObservable.call('insert', 'users', doc);
  }

  constructor(user: UserModel) {
    if (user) {
      properties.forEach(property => {
        if (user[property]) {
          this[property] = user[property]
        }
      });
    }
  }

  async init() {
    const resultUser = await MeteorObservable.call('findOne', 'users', {
      _id: this._id
    }).toPromise().catch((error)=> console.log("caught it", error));
    properties.forEach(property => {
      if (resultUser[property]) {
        this[property] = resultUser[property]
      }
    });
  }

  _getReferredUser$() {
    return MeteorObservable.call('findOne', 'users', {_id: this.referredUserId} );
  }
            
   async _checkPermission(permissionName){
     const permission = await MeteorObservable.call('checkSystemPermission', this.referredUserId, { 
      name: permissionName 
    }).toPromise().catch((error) => console.log("caught it", error));
     let result = permission['result'];
     let enabled = false;
     if (result.length > 0) {
       enabled = result[0].status == 'enabled' ? true : false;
     }
     return enabled;
  }

  _update$(update) {
    return MeteorObservable.call('update', 'users', {_id: this._id}, update);
  }

  _getManagedUsers$() {
    let pipeline = [
      {
        $match: {
          _id: this._id
        }
      },
      {
        $unwind: "$tenants"
      },
      {
        $match: {
          "tenants._id": this.tenantId
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "tenants.referredUserId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        "$unwind": {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          userIds: {$cond: {
              if: "$user._id",
              then: ["$_id", "$user._id"],
              else: ["$_id"]
            }}
        }
      },
      {
        "$addFields": {
          "concatManages": {
            "$concatArrays": [
              "$manages",
              {$ifNull: ["$user.manages", []]},
              "$userIds"

            ]
          }
        }
      },      {
        $lookup: {
          from: "users",
          let: {
            userIds: "$concatManages"
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: [
                    "$_id",
                    "$$userIds"
                  ]
                }
              }
            }
          ],
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: "$user._id"
        }
      }
    ];

    return MeteorObservable.call('runAggregate', "users", pipeline);

  }
}