import { Email } from 'meteor/email';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from "meteor-rxjs";
import { Random } from 'meteor/random';
let CronJob = Npm.require('cron').CronJob;
import { SystemAlerts } from '../../../both/collections/systemAlerts.collection';
import { SystemOptions } from '../../../both/collections/systemOptions.collection';
import { CustomerMeetings } from '../../../both/collections/customerMeetings.collection';
import { SystemLogs } from '../../../both/collections/systemLogs.collection';
import { Users } from '../../../both/collections/users.collection';
import { MeetingNote } from '../../../both/collections/meetingNotes.collection';
import * as moment from 'moment-timezone';
import * as _ from "underscore";
import { Promise } from "meteor/promise";
import {forkJoin} from "rxjs/internal/observable/forkJoin";
import {of} from "rxjs/index";
import {map, mergeMap, switchMap} from "rxjs/operators";
import {AllCollections} from "../../../both/collections";
import * as funcs from '../../../both/functions/common';

let result = SystemOptions.collection.findOne({name: "mailOptions"});

// if (result) {
if (result && !Meteor.settings.public.isTestWebsite) {
  console.log('is not a test website, run cronjobs');
  process.env.MAIL_URL = result.value.connectionString;

  "00 00 20 * * *"
  let systemAlerts:any = {};

  let jobs:any = [];
  jobs['weeklyCopperAlert'] = weeklyCopperAlert;
  jobs['summaryMeetingNotes'] = summaryMeetingNotes;

  let results = SystemAlerts.collection.find({isCronJob: true}).fetch();
  let oldTimes:string[] = [];
  results.forEach((alert, index) => {
    let newJob;
    oldTimes[index] = alert.schedule;
    newJob = jobs[alert.name](alert, index);
    systemAlerts[alert.name] = newJob;
  });


  Meteor.methods({
    startCron() {
      systemAlerts = {};
      let results = SystemAlerts.collection.find({isCronJob: true}).fetch();
      results.forEach((cronJob, index) => {
        systemAlerts[cronJob.name] = jobs[cronJob.name](cronJob, index);
      })
    },
    stopCron() {
      let results = SystemAlerts.collection.find({isCronJob: true}).fetch();
      results.forEach((cronJob) => {
        systemAlerts[cronJob.name].stop();
      })
    }
  });

  setInterval(Meteor.bindEnvironment(() => {
    let results = SystemAlerts.collection.find({isCronJob: true}).fetch();

    results.forEach((cronJob, index) => {

      if (oldTimes[index] === cronJob.schedule) {
      } else {
        oldTimes[index] = cronJob.schedule;
        systemAlerts[cronJob.name].stop();
        systemAlerts[cronJob.name] = jobs[cronJob.name](cronJob, index);
      }
    });
  }), 10000);
}


function weeklyCopperAlert(cronJob, index){
  let autoStart:boolean;
  autoStart = cronJob.start;
  console.log('autoStart', autoStart);
  console.log('schedule', cronJob.schedule);
  return new CronJob({

    cronTime: cronJob.schedule,
    // cronTime: "*/30 * * * * *",
    timeZone: Meteor.settings.public.timeZone,
    onTick: Meteor.bindEnvironment(() => {
      cronJob = SystemAlerts.collection.findOne({_id: cronJob._id});
      if (Meteor.isProduction && autoStart) {
        console.log('is production');
        let data = cronJob.data;
        let currentDate;
        if ('currentDate' in cronJob && cronJob.currentDate != '') {
          currentDate = new Date(cronJob.currentDate);
          currentDate = moment(currentDate).tz(Meteor.settings.public.timeZone).format();
        } else {
          currentDate = moment(new Date()).tz(Meteor.settings.public.timeZone).format();
          // currentDate  = toTimeZone(new Date(), 'America/Chicago');
        }

        let currentTime = moment(currentDate).tz(Meteor.settings.public.timeZone).format('YYYY-MM-DD');
        let lastUpdatedTime = moment(data.updatedAt).tz(Meteor.settings.public.timeZone).format("YYYY-MM-DD");
        let lastSentTime = moment(data.sentAt).tz(Meteor.settings.public.timeZone).format("YYYY-MM-DD");

        let formattedDate = moment(currentDate).tz(Meteor.settings.public.timeZone).format('YYYY-MM-DD');

        if (currentTime !== lastSentTime) {
          let request = Npm.require('request');
          let requestUrl = "https://www.quandl.com/api/v3/datasets/CHRIS/CME_HG1.json?start_date=" + formattedDate + "&end_date=" + formattedDate + "&api_key=Ub_eHVALYv4XxKzL_6x5";

          console.log('request url', requestUrl);
          request(requestUrl,
            Meteor.bindEnvironment(function (error, response, body) {
              if (!error && response.statusCode == 200) {
                const copperObj = JSON.parse(body);
                let emailData:any = cronJob.email;

                if (copperObj.dataset.data.length > 0) {
                  let copperPrice = copperObj.dataset.data[0][4];

                  let priceChange = Number(copperPrice) - Number(data.value);
                  let color ='black';
                  if (priceChange > 0) {
                    color = 'green';
                  } else if (priceChange < 0) {
                    color = 'red';
                  }
                  let percentage = (priceChange/Number(data.value)) * 100;
                  let html = `<body>The Copper Price closed at $ ` + copperPrice + ` this week <br><br>`;
                  html += `<h3>Here are the facts Jack:</h3>`;
                  html += `Last Updated Cost Date: ` + lastUpdatedTime + `<br>`;
                  html += `Last Updated Copper Price: $ ` + data.value + `<br>`;
                  html += `Percentage Changes: <span style="color: ` + color + `">`+ percentage.toFixed(1) + `%</span></body>`;

                  emailData.html = html;

                  let update = {
                    $set: {
                      "data.sentAt": currentDate
                    }
                  };

                  SystemAlerts.collection.update({_id: cronJob._id}, update);
                  Email.send(emailData);
                } else {
                  console.log('data not ready');
                }
              } else {
                console.log('not data');
              }
            }))
        } else {

        }
      } else {
        console.log('in development');
      }
    }),
    start: autoStart
  });
}

function summaryMeetingNotes(cronJob, index){
  const logId = Random.id();
  let logs = [];
  let autoStart: boolean;
  autoStart = cronJob.start;
  return new CronJob({

    cronTime: cronJob.schedule,
    timeZone: Meteor.settings.public.timeZone,
    onTick: Meteor.bindEnvironment(() => {
      cronJob = SystemAlerts.collection.findOne({ _id: cronJob._id });
      // if (autoStart) {
      if (Meteor.isProduction && autoStart) {
        let pipeline = [
          {
            "$match": {
              "parentTenantId": '4sdRt09goRP98e456'
            }
          },
          {
            "$project": {
              "_id": 1,
              "sessionId": 1,
              "createdAt": 1,
              "createdUserId": 1,
              "parentTenantId": 1,
              "actions": {
                "$filter": {
                  "input": "$actions",
                  "as": "action",
                  "cond": {
                    "$and": [
                      {
                        "$gte": [
                          "$$action.createdAt",
                          new Date(moment(getPreviousWorkday()).startOf('day').add(6, 'hours').format())
                        ]
                      },
                      {
                        "$lte": [
                          "$$action.createdAt",
                          new Date(moment().startOf('day').add(6, 'hours').format())
                        ]
                      }
                    ]
                  }
                }
              }
            }
          },
          {
            "$unwind": "$actions"
          },
          {
            "$project": {
              "documentType": "$actions.collectionName",
              "type": "$actions.type",
              "documentId": "$actions.documentId",
              "date": "$actions.createdAt"
            }
          },
          {
            "$match": {
              "documentType": "customerMeetings",
              "type": {
                "$in": [
                  "update.complete"
                ]
              }
            }
          },
          {
            "$group": {
              "_id": "$documentId",
              "date": {
                "$max": "$date"
              },
              "docs": {
                "$push": {
                  "date": "$date"
                }
              }
            }
          },
          {
            "$project": {
              "docs": {
                "$setDifference": [
                  {
                    "$map": {
                      "input": "$docs",
                      "as": "doc",
                      "in": {
                        "$cond": [
                          {
                            "$eq": [
                              "$date",
                              "$$doc.date"
                            ]
                          },
                          "$$doc",
                          false
                        ]
                      }
                    }
                  },
                  [
                    false
                  ]
                ]
              }
            }
          },
          {
            "$unwind": "$docs"
          },
          {
            "$project": {
              "_id": 1,
              "date": "$docs.date"
            }
          },
          {
            "$lookup": {
              "from": "customerMeetings",
              "localField": "_id",
              "foreignField": "_id",
              "as": "meeting"
            }
          },
          {
            "$unwind": "$meeting"
          },
          { '$sort': { 'meeting.dateTime': 1 } },
          {
            "$group": {
              "_id": "000",
              "meetings": {
                "$push": "$meeting"
              }
            }
          },
        ]
        let meetings;
        let rawCollection = SystemLogs.rawCollection();
        let aggregateQuery = Meteor.wrapAsync(rawCollection.aggregate, rawCollection);
        let results = {
          result: Promise.await(aggregateQuery(pipeline).toArray()),
        };
        if (results['result'].length > 0) {
          meetings = results['result'][0].meetings;
        }

        //missingEmailsToInclude
        let checkManualMeetings = [
          { $match: { _id: 'yZ9T5JY6EQQKUQyvf' } },
          { $unwind: '$value' },
          { $project: { _id: '$value' } },
          {
            "$lookup": {
              "from": "customerMeetings",
              "localField": "_id",
              "foreignField": "_id",
              "as": "meeting"
            }
          },
          { $unwind: '$meeting' },
          {
            "$group": {
              "_id": "000",
              "meetings": {
                "$push": "$meeting"
              }
            }
          },
        ]
        let rawCollectionManualMeetings = SystemOptions.rawCollection();
        let aggregateQueryManualMeetings = Meteor.wrapAsync(rawCollectionManualMeetings.aggregate, rawCollectionManualMeetings);
        let resultsManualMeetings = {
          result: Promise.await(aggregateQueryManualMeetings(checkManualMeetings).toArray()),
        };

        if (resultsManualMeetings['result'].length > 0 && meetings) {
          meetings = meetings.concat(resultsManualMeetings['result'][0].meetings)
        }

        // clear value from systemOptions
        let update = {
          $set: {
            "value": []
          }
        };
        SystemOptions.collection.update({ _id: 'yZ9T5JY6EQQKUQyvf' }, update);
        //

        meetings.sort(function (a, b) {
          return +new Date(a.dateTime) - +new Date(b.dateTime);
        });

        let noteQuery = { active: true };
        let notes = MeetingNote.collection.find(noteQuery).fetch();
        let x = MeteorObservable.call('checkSystemPermission', null, { name: 'receiveMeetingNotes' })
          .pipe(
            map(permission => {
              let userIds = permission['result'].map(x => x._id)
              return userIds;
            }),
            map((userIds) => {
              let summaryEmailUsers:[any] = Promise.await(funcs.callbackToPromise(MeteorObservable.call('instantEmailUsers', 'Summary', { "_id": { $in: userIds } })));
              return summaryEmailUsers;
            }),
            map((summaryEmailUsers) => {
              for (let i = 0; i < notes.length; i++) {
                let noteArray = [];
                let emailData = {};
                let variables = {};

                let noteSpecificUsers: any, filtered: any = [];
                if (notes[i].permissionId) {
                  noteSpecificUsers = Promise.await(funcs.callbackToPromise(MeteorObservable.call('checkSystemPermission', { $in: summaryEmailUsers.map(el => el._id) }, { permissionId: notes[i].permissionId })));
                  filtered = noteSpecificUsers.result.map(en => {
                    let x = summaryEmailUsers.filter(el => (el._id == en._id && en.status == 'enabled'))
                    return x[0] ? x[0].username : null;
                  }).filter(fil => fil);
                }

                for (let j = 0; j < meetings.length; j++) {
                  let meeting = meetings[j];
                  if (meeting[notes[i].identifier]) {
      
                    meeting[notes[i].identifier].forEach(element => {
                      element['keys'] = Object.keys(element)
                      let index = element['keys'].indexOf('_id');
                      if (index > -1) {
                        element['keys'].splice(index, 1);
                      }
                      element['data'] = objectToArray(element['keys'], element)
                      if (element['data'].length <= 0) {
                        meeting[notes[i].identifier].splice(index, 1);
                      }
                    });
      
                    if (meeting[notes[i].identifier].length > 0) {
                      noteArray.push({
                        _id: meeting._id,
                        dateTime: meeting['dateTime'],
                        branch: meeting['branch'],
                        contact: meeting['contact'],
                        note: meeting[notes[i].identifier],
                        customerName: meeting['customerName'],
                        userName: meeting['userName'],
                        userId: meeting['userId'],
                      })
                    }
                  }
                }
                // console.log(noteArray);
                if (noteArray.length > 0) {
                  //EXECUTIVE AND VENDOR EMAILS
                    let groupedNotes = groupAndMap(noteArray, 'dateTime','userName',
                      arr => groupAndMap(arr, 'userName', "meetings"));
      
                    variables = {
                      logo: 'https://globalthesource.yibas.com/img/Global-White.png',
                      notesArray: groupedNotes,
                      day: 'Meetings Completed '+ moment(getPreviousWorkday()).startOf('day').format('MMMM D, YYYY'),
                    };
      
                    emailData['from'] = 'noreply@globalthesource.com';
                    emailData['bcc'] = filtered.length > 0 ? filtered.join(', ') + ', ' + notes[i].email['to'] : notes[i].email['to'];
                    emailData['subject'] = notes[i].email['subject'] + ' Completed ' + moment(getPreviousWorkday()).startOf('day').format('M/D/YYYY') ;

                    if ('to' in emailData || 'bcc' in emailData) {
                      // console.log('!!!emailData', emailData, variables)
                      MeteorObservable.call('sendEmail', emailData, 'html-meetingNotesSummary.html', variables).subscribe(emailResponse => {
                        let data = `To: ${emailData['to']} Bcc: ${emailData['bcc']} From: ${emailData['from']}`;
                        let value = {
                          _id: Random.id(),
                          collectionName: '',
                          documentId: '',
                          document: 'meeting',
                          type: 'summary_email',
                          fieldPath: `${notes[i].identifier}`,
                          log: '',
                          createdAt: new Date(),
                          url: 'cronjob_server'
                        };
                        if (emailResponse) {
                          value['log'] = `Note Email Not Sent: ${data}`;
                        } else {
                          value['log'] = `Note Email Sent: ${data}`;
                        }
                        logs.push(value);
                      })
                    }
                  //END
                  
                  // //SALESPERSON SUMMARY EMAILS
                  let salesPersonFiltered:any = summaryEmailUsers.map(el => el.username).filter(fil => fil);
                    let userIdArray = _.uniq(noteArray.map(a => a.userId));
                    for (let k = 0; k < userIdArray.length; k++) {
                      let send = false;
                      let user = Users.collection.findOne({ _id: userIdArray[k] });
                      let userEmail = user.username;
                      let userMeetings = noteArray.filter(function (item) {
                        return item.userId == userIdArray[k];
                      });
                      let groupedUserMeetings = groupAndMap(userMeetings, 'dateTime', 'userName',
                      arr => groupAndMap(arr, 'userName', "meetings"));
                      let userEmailData = {
                        to: salesPersonFiltered.includes(userEmail) ? userEmail : 'Meeting Notes <noReply@globalthesource.com>',
                        from: userEmail,
                        subject: notes[i].email['subject'] + ' Completed ' + moment(getPreviousWorkday()).startOf('day').format('M/D/YYYY')
                      };

                      if (salesPersonFiltered.includes(userEmail)){
                        send = true;
                      }
      
                      let userVariables = {
                        logo: 'https://globalthesource.yibas.com/img/Global-White.png',
                        notesArray: groupedUserMeetings,
                        day: 'Meetings Completed '+ moment(getPreviousWorkday()).startOf('day').format('MMMM D, YYYY'),
                      };
                      let pipeline = [
                        {
                          $unwind: "$manages"
                        },
                        {
                          $match: {
                            "manages": userIdArray[k]
                          }
                        },
                        {
                          $project: {
                            username: 1
                          }
                        }
                      ];
                      let rawCollection = Users.rawCollection();
                      let aggregateQuery = Meteor.wrapAsync(rawCollection.aggregate, rawCollection);
                      let managers = {
                        result: Promise.await(aggregateQuery(pipeline).toArray()),
                      };
                      let managersString
                      if (managers['result'].length > 0) {
                        managersString = managers['result'].map(manager => {
                          return salesPersonFiltered.includes(manager.username) ? manager.username : null;
                        }).filter(el => el).join(', ');
                        if (managersString != ''){
                          userEmailData['bcc'] = managersString;
                          send = true;
                        }
                      }
                      if (send) {
                        // console.log('~~userEmailData', userEmailData, userVariables)
                        MeteorObservable.call('sendEmail', userEmailData, 'html-meetingNotesSummary.html', userVariables).subscribe(emailResponse => { 
                          let data = `To: ${userEmailData['to']} Bcc: ${userEmailData['bcc']} From: ${userEmailData['from']}`;
                          let value = {
                            _id: Random.id(),
                            collectionName: '',
                            documentId: '',
                            document: 'meeting',
                            type: 'summary_email',
                            fieldPath: `${notes[i].identifier}`,
                            log: '',
                            createdAt: new Date(),
                            url: 'cronjob_server'
                          };
                        if (emailResponse) {
                            value['log'] = `Note Email Not Sent: ${data}`;
                          } else {
                            value['log'] = `Note Email Sent: ${data}`;
                          }
                          logs.push(value);
                        })
                      }
                    }
                  //END
      
                }
              }
              let query = {
                _id: logId
              }
              let update = {
                $set: {
                  "_id": logId,
                  "sessionId": funcs.uuidv4(),
                  "createdAt": new Date(),
                  "createdUserId": "cronjob",
                  "parentTenantId": "4sdRt09goRP98e456",
                  "actions": logs
                }
              }
              SystemLogs.collection.update(query, update, { upsert: true });
            })
            )
            .subscribe();
      } else {
        console.log('in development');
      }
    }),
    start: autoStart
  });
}

function groupAndMap(items, itemKey, childKey, predic?) {
  let grouped = _.map(
    _.groupBy(items, itemKey), (obj, key) => ({
      [itemKey]: checkType(key),
      [childKey]: (predic && predic(obj)) || obj
    }),
  )
  return grouped;
}

function checkType(text) {
  return Date.parse(text) ? returnDate(text, 'MMM DD, YYYY h:mm A') : text;
}

function returnDate(dateString, format) {
  return moment(new Date(dateString)).tz(Meteor.settings.public.timeZone).format(format);
}

function objectToArray(arrOfKeys, object) {
  let arr = [];
  for (let i = 0; i < arrOfKeys.length; i++) {
    let key = arrOfKeys[i];
    object[key] = (typeof object[key] === 'string') ? object[key].trim() : object[key];
    if (object[key]) {
      arr.push({ key: toTitleCase(key), value: object[key]})
    }
  }
  return arr;
}

function toTitleCase(str) {
  let result = str.replace(/([A-Z])/g, " $1");
  let finalResult = result.charAt(0).toUpperCase() + result.slice(1);
  return finalResult;
}

function getPreviousWorkday() {
  let workday = moment();
  let day = workday.day();
  let diff = 1;  // returns yesterday
  if (day == 0 || day == 1) {  // is Sunday or Monday
    diff = day + 2;  // returns Friday
  }
  return workday.subtract(diff, 'days');
}

export function update5700ContractProducts() {
  MeteorObservable.call('find', "products", {categoryId: "3IZYPKMESzq0BGT4m"})
    .pipe(
      map((categoryProducts:any) => categoryProducts.map(_product => _product._id)),
      switchMap(ids => {
        let pipeline = [
          {
            $unwind: "$products"
          },
          {
            $addFields: {
              isInArray: {
                $in: ["$products._id", ids]
              }
            }
          },
          {
            $match: {
              isInArray: true
            }
          },
          {
            $lookup: {
              from: "products",
              localField: "products._id",
              foreignField: "_id",
              as: "product"
            }
          },
          {
            $unwind: "$product"
          },
          {
            $addFields: {
              products: {
                price: { $toDouble: "$products.price" },
                previousPrice: { $toDouble: "$products.previousPrice" },
              },
            },
          },
        ];
        return MeteorObservable.call('runAggregate', 'customerContracts', pipeline);
      }),
      mergeMap((updatedDocuments:any) => {
        return forkJoin(...updatedDocuments.map((doc) => {
          if (doc.product.price != doc.products.price) {
            let query = {
              _id: doc._id,
              "products._id": doc.product._id
            };
            const update = {
              $set: {
                "products.$.price": doc.product.price,
                "products.$.previousPrice": doc.products.price,
                "products.$.isSynced": false
              }
            };
            return MeteorObservable.call('update', 'customerContracts', query, update);
          } else {
            return of(null);
          }

        }))
      })
    ).subscribe();
}

function checkContractProductPrice() {
  AllCollections['customerContracts'].collection.find()
    .forEach(_contract => {

    })
  var contracts = AllCollections['customerContracts'].collection.find({})

  let arr = [];
  contracts.forEach(function(contract) {
    console.log('one ', contract._id);

    contract.products.forEach(function (product) {
      var price = product.price.toString().split('.');
      if (price[1]) {
        if (price[1].length > 2) {
          arr.push({
            contractId: contract._id,
            productId: product._id,
            price: Number(product.price.toFixed(2))
          })
        }
      }
    })
  })
  console.log('arr', arr);
}