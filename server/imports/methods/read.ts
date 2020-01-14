import { AllCollections } from '../../../both/collections';
import { Meteor } from 'meteor/meteor';

// var database = new MongoInternals.RemoteCollectionDriver('mongodb://user:password@localhost:27017/meteor');
// var numberOfDocs = database.open('boxes').find().count();

Meteor.methods({
  // users who manage this current user
  getManagerUsers() {
    const pipeline = [
      {
        $unwind: "$manages"
      },
      {
        $match: {
          "manages": this.userId
        }
      },
      {
        $project: {
          username: 1
        }
      }
    ];

    return Meteor.call('runAggregate', 'users', pipeline);
  },

  instantEmailUsers(type, match?) {
    const pipeline = [
      ...(match ? [{ $match: match }] : []),
      {
        $match: {
          'profile.meetingEmails': { $eq: type }
        }
      },
      {
        $project: {
          _id: 1, username: 1, profile:1
        }
      }
    ]
    return Meteor.call('runAggregate', 'users', pipeline);
  },

  getModuleByPermissionId(permissionId) {
    const pipeline = [
      {
        $match: {
          _id: permissionId
        }
      },
      {
        $lookup: {
          from: "systemModules",
          localField: "moduleId",
          foreignField: "_id",
          as: "module"
        }
      },
      {
        $unwind: "$module"
      },
      {
        $project: {
          moduleId: "$module._id",
          moduleName: "$module.name"
        }
      },
      {
        $lookup: {
          from: "systemPermissions",
          localField: "moduleId",
          foreignField: "moduleId",
          as: "modulePermission"
        }
      },
      {
        $unwind: "$modulePermission"
      },
      {
        $match: {
          "modulePermission.isModulePermission": true
        }
      },
      {
        $project: {
          moduleId: 1,
          moduleName: 1,
          modulePermissionId: "$modulePermission._id"
        }
      }
    ];
    return Meteor.call('runAggregate', 'systemPermissions', pipeline);

  },

  getAllContractIds(tenantId) {
    const pipeline = [
      {
        $project: {
          _id: 1
        }
      },
      {
        $group: {
          _id: 'null',
          ids: {
            $push: "$_id"
          }
        }
      }
    ];
    return Meteor.call('runAggregate', 'customerContracts', pipeline)[0].ids;

  },

  getContractIdsByCustomerIds(customerIds) {
    const pipeline = [
      {
        $match: {
          _id: {
            $in: customerIds
          }
        }
      },
      {
        $lookup: {
          from: "customerContracts",
          localField: "contractId",
          foreignField: "_id",
          as: "contract"
        }
      },
      {
        $unwind: "$contract"
      },
      {
        $project: {
          _id: "$contract._id"
        }
      },
      {
        $group: {
          _id: 'null',
          ids: {
            $addToSet: "$_id"
          }
        }
      }
    ];
    return Meteor.call('runAggregate', 'customers', pipeline)[0].ids;

  },
  getAllCustomerIds(tenantId) {
    const pipeline = [
      {
        $match: {
          tenantId
        }
      },
      {
        $project: {
          _id: 1
        }
      },
      {
        $group: {
          _id: 'null',
          ids: {
            $push: "$_id"
          }
        }
      }
    ];
    return Meteor.call('runAggregate', 'customers', pipeline)[0].ids;
  },
  testPromise() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('it is resolved');
      }, 5000);
    })
  }
});


