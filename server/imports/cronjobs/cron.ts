// import { Email } from 'meteor/email';
// let CronJob = Npm.require('cron').CronJob;
// import { SystemOptions } from '../../../both/collections/systemOptions.collection';
//
//
// let result = SystemOptions.collection.findOne({name: "mailOptions"});
//
// process.env.MAIL_URL = result.value.connectionString;
//
// // let email = {
// //   to: 'guofuh@globalthesource.com',
// //   from: 'guofuh@globalthesource.com',
// //   subject: 'test subject',
// //   text: 'test text'
// // }
// //
// // Email.send(email);
// //
//
//
// import { CronJobs } from '../../../both/collections/cronJobs.collection';
// var dateFormat = Npm.require('dateformat');
// let jobs:any = [];
// jobs['weeklyCopperAlert'] = weeklyCopperAlert;
// // let results = CronJobs.collection.find().fetch();
// // let oldTimes = [];
// // let cronJobs = [];
// // results.forEach((cronJob, index) => {
// //   // weeklyCopperAlert(cronJob, index);
// //   oldTimes[index] = cronJob.cronTime;
// //
// //   let newJob = jobs[cronJob.name](cronJob, index);
// //   cronJobs[cronJob.name] = newJob;
// //
// // });
//
//
// function weeklyCopperAlert(cronJob, index){
//
//   let job = new CronJob({
//     cronTime: cronJob.cronTime,
//     // cronTime: '*/30 * * * * *',
//     // onTick: function() {
//     // },
//     onTick: Meteor.bindEnvironment(() => {
//       console.log('ticktik');
//       cronJob = CronJobs.collection.findOne({_id: cronJob._id});
//       let data = cronJob.data;
//       let currentDate = new Date('04-26-2017');
//
//       let currentTime = dateFormat(currentDate, "mm/dd/yyyy");
//       let lastUpdatedTime = dateFormat(new Date(data.updatedAt), "mm/dd/yyyy");
//       let lastSentTime = dateFormat(new Date(data.sentAt), "mm/dd/yyyy");
//
//       let currentDay =  ("0" + currentDate.getDate()).slice(-2);
//       let currentMonth = ("0" + (currentDate.getMonth() + 1)).slice(-2);
//       let currentYear =  currentDate.getFullYear();
//       let formattedDate = currentYear + "-" + currentMonth + "-" + currentDay;
//
//       if (currentTime !== lastSentTime) {
//         let request = Npm.require('request');
//
//         request("https://www.quandl.com/api/v3/datasets/CHRIS/CME_HG1.json?start_date=" + formattedDate + "&end_date=" + formattedDate + "&api_key=Ub_eHVALYv4XxKzL_6x5",
//           Meteor.bindEnvironment(function (error, response, body) {
//             if (!error && response.statusCode == 200) {
//               const copperObj = JSON.parse(body);
//               let emailData:any = cronJob.email;
//
//               if (copperObj.dataset.data.length > 0) {
//                 let copperPrice = copperObj.dataset.data[0][4];
//
//                 let priceChange = Number(copperPrice) - Number(data.value);
//                 let color ='black';
//                 if (priceChange > 0) {
//                   color = 'green';
//                 } else if (priceChange < 0) {
//                   color = 'red';
//                 }
//                 let percentage = (priceChange/Number(data.value)) * 100;
//                 let html = `<body>The Copper Price closed at $ ` + copperPrice + ` this week <br><br>`;
//                 html += `<h3>Here are the facts Jack:</h3>`;
//                 html += `Last Updated Cost Date: ` + lastUpdatedTime + `<br>`;
//                 html += `Last Updated Copper Price: $ ` + data.value + `<br>`;
//                 html += `Percentage Changes: <span style="color: ` + color + `">`+ percentage.toFixed(1) + `%</span></body>`;
//
//                 emailData.html = html;
//
//                 let update = {
//                   $set: {
//                     "data.sentAt": currentDate
//                   }
//                 };
//
//                 // CronJobs.collection.update({_id: cronJob._id}, update);
//               } else {
//                 emailData.html = "Nothing to Report"
//               }
//
//               Email.send(emailData);
//             }
//           }))
//       } else {
//       }
//     }),
//     start: true
//   });
//   return job;
// }
//
// Meteor.methods({
//   runEmail() {
//     let results = CronJobs.collection.find().fetch();
//     let oldTimes = [];
//     let cronJobs = [];
//     results.forEach((cronJob, index) => {
//       // weeklyCopperAlert(cronJob, index);
//       oldTimes[index] = cronJob.cronTime;
//
//       let newJob = jobs[cronJob.name](cronJob, index);
//       cronJobs[cronJob.name] = newJob;
//
//     });
//
//
//     let job = new CronJob({
//       cronTime: '*/10 * * * * *',
//       onTick: Meteor.bindEnvironment(function() {
//         let result = CronJobs.collection.find().fetch();
//
//       }),
//       start: true
//     })
//
//
//     // setInterval(Meteor.bindEnvironment(() => {
//     //   let results = CronJobs.collection.find().fetch();
//     //
//     //   results.forEach((cronJob, index) => {
//     //
//     //     if (oldTimes[index] === cronJob.cronTime) {
//     //     } else {
//     //       console.log('not the same');
//     //       oldTimes[index] = cronJob.cronTime;
//     //       cronJobs[cronJob.name].stop();
//     //       let newJob = jobs[cronJob.name](cronJob, index);
//     //       cronJobs[cronJob.name] = newJob;
//     //     }
//     //   });
//     //
//     // }), 10000);
//
//   }
//
//
// })
//
// Meteor.call('runEmail');