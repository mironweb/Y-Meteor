import { WebApp } from 'meteor/webapp';

var AuthenticationContext = require('adal-node').AuthenticationContext;

var sampleParameters = {
    tenant: 'globalthesource1.onmicrosoft.com',
    authorityHostUrl: 'https://login.windows.net',
    clientId: 'c1ab69e7-11c7-4934-b025-2eea8c9b8d27',
    clientSecret: 'c11GWnS6BuOg4Keq7DWbE02',
    username: '',
    password: ''
};

var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;
var redirectUri = 'http://localhost:3000/';
var resource = 'https://graph.microsoft.com';

var templateAuthzUrl = 'https://login.windows.net/' + sampleParameters.tenant + '/oauth2/authorize?response_type=code&client_id=<client_id>&redirect_uri=<redirect_uri>&state=<state>&resource=<resource>';

function createAuthorizationUrl(state) {
    var authorizationUrl = templateAuthzUrl.replace('<client_id>', sampleParameters.clientId);
    authorizationUrl = authorizationUrl.replace('<redirect_uri>', redirectUri);
    authorizationUrl = authorizationUrl.replace('<state>', state);
    authorizationUrl = authorizationUrl.replace('<resource>', resource);
    return authorizationUrl;
}

export function setupAdalApi() {
    WebApp.connectHandlers.use('/auth', (req, res, next) => {
        var selfsReq = req;
        var selfsRes = res;
        //res.writeHead(200);
        //res.end(`Hello world from: ${Meteor.release}`);

        var context = new AuthenticationContext(authorityUrl);
        context.acquireTokenWithClientCredentials(resource, sampleParameters.clientId, sampleParameters.clientSecret, function (err, tokenResponse) {
            if (err) {
                selfsRes.writeHead(404);
                selfsRes.end('well that didn\'t work: ' + err.stack);
            } else {
                var token = tokenResponse.accessToken;
                selfsRes.writeHead(200);
                selfsRes.end(token);
            }
        });
    });
}
