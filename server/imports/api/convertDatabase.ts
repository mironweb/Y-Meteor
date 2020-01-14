// copy collection from live app to dev app

// converting meetings
/*
// rename fields
db.meetings.update({}, {$rename: {"userID": "userId"}}, false, true);
db.meetings.update({}, {$rename: {"createdDateTime": "createdAt"}}, false, true);
db.meetings.update({}, {$rename: {"customerID": "customerId"}}, false, true);
db.meetings.update({}, {$set: {tenantId: "4sdRt09goRP98e456"}}, {multi: true})


// convert date string to ISO date
db.meetings.find().forEach(function(meeting) {
  meeting.dateTime = new Date(meeting.dateTime);
  db.meetings.save(meeting);
});

*/
