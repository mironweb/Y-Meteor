import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http'
import { WebApp } from 'meteor/webapp';
const moment = require('moment');
// const createEventUri = 'https://graph.microsoft.com/v1.0/users/newuser@globalthesource1.onmicrosoft.com/calendar/events';

const sampleEvent = {
    subject: "NEW EDIT EVENT",
    start: {
        // "dateTime": moment(new Date()).add('day', 1).toDate(),
        "dateTime": "08 Sep, 2017, 2:30 PM",
        "timeZone": "UTC"
    },
    end: {
        // "dateTime": moment(new Date()).add('day', 2).toDate(),
        "dateTime": "08 Sep, 2017, 4:30 PM",
        "timeZone": "UTC"
    },
}

export function setupMsGraphApi() {
    WebApp.connectHandlers.use('/addMeeting', (req, res, next) => {
        //res.writeHead(200);
        //res.end(`Meeting Created`);

        var body = "";
        req.on('data', Meteor.bindEnvironment(function (data) {
            body += data;
            var token = JSON.parse(body).token;
            var email = JSON.parse(body).email;
            var eventData = JSON.parse(body).eventData;
            HTTP.call('POST', 'https://graph.microsoft.com/v1.0/users/'+ email + '/calendar/events', {
                content: 'string',
                'data': eventData,
                'headers': {
                    'Authorization': 'Bearer ' + token,
                    'content-type':'application/json'
                }
            }, (err, tokenResult) => {
                if (!err) {
                    res.writeHead(200);
                    res.end(tokenResult.content);
                } else {
                    res.writeHead(500);
                    res.end(err);
                }
            });
        }));
    });

    WebApp.connectHandlers.use('/getMeetings', (req, res, next) => {
        var body = "";
        req.on('data', Meteor.bindEnvironment(function (data) {
            body += data;
            var token = JSON.parse(body).token;
            // HTTP.call('GET', 'https://graph.microsoft.com/v1.0/users/'+ 'joep@globalthesource.com' + '/calendar/events', {
            HTTP.call('GET', 'https://graph.microsoft.com/v1.0/me/calendar/events', {
                content: 'string',
                // 'data': eventData,
                'headers': {
                    'Authorization': 'Bearer ' + token,
                    'content-type':'application/json'
                }
            }, (err, tokenResult) => {
                if (!err) {
                    res.writeHead(200);
                    res.end(tokenResult.content);
                } else {
                    res.writeHead(500);
                    res.end(err)
                }
            });
        }));
    });

    WebApp.connectHandlers.use('/editMeeting', (req, res, next) => {
        var body = "";
        req.on('data', Meteor.bindEnvironment(function (data) {
            body += data;
            var token = JSON.parse(body).token;
            var email = JSON.parse(body).email;
            var eventData = JSON.parse(body).eventData;
            var microsoftId = JSON.parse(body).microsoftId;
            HTTP.call('PATCH', 'https://graph.microsoft.com/v1.0/users/'+ email + '/calendar/events/' + microsoftId, {
                content: 'string',
                'data': eventData,
                'headers': {
                    'Authorization': 'Bearer ' + token,
                    'content-type':'application/json'
                }
            }, (err, tokenResult) => {
                if (!err) {
                    res.writeHead(200);
                    res.end(tokenResult.content);
                } else {
                    res.writeHead(500);
                    res.end(JSON.stringify(err));
                }
            });
        }));
    });

    WebApp.connectHandlers.use('/deleteMeeting', (req, res, next) => {
        var body = "";
        req.on('data', Meteor.bindEnvironment(function (data) {
            body += data;
            var token = JSON.parse(body).token;
            var email = JSON.parse(body).email;
            var microsoftId = JSON.parse(body).microsoftId;
            HTTP.call('DELETE', 'https://graph.microsoft.com/v1.0/users/'+ email + '/calendar/events/' + microsoftId, {
                content: 'string',
                'headers': {
                    'Authorization': 'Bearer ' + token,
                    'content-type':'application/json'
                }
            }, (err, tokenResult) => {
                if (!err) {
                    res.writeHead(200);
                    res.end(tokenResult.content);
                } else {
                    res.writeHead(500);
                    res.end(err);
                }
            });
        }));
    });
}
