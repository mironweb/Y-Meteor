// For support email: support@rocketship.it

module.exports = {
  api_key: 'NWLXRImjWoaXNnVhik0rV7mlzgKddh633yr9nbu8',

  request: function(carrier, action, params, callback) {
    if (this.api_key != '') {
      return this.httpRequest(carrier, action, params, callback);
    }
    return this.binRequest(carrier, action, params, callback);
  },

  // do request to local binary via stdin/stdout
  binRequest: function(carrier, action, params, callback) {
    var req = {
      carrier: carrier,
      action: action,
      params: params
    }
    var data = '';
    var child_process = require('child_process');
    var general_error = { "meta": { "code": 500, "error_message": "Unable to communicate with RocketShipIt" } };

    // var proc = child_process.spawn(process.env.PWD + '/RocketShipIt');

    var proc = child_process.spawn('./RocketShipIt', [], { cwd: __dirname+'/../../' });

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', function(chunk) {
      data += chunk;
    });
    proc.stdout.on('end', function() {
      return callback(data);
    })
    proc.stderr.on('data', function(d) {
      return;
    });
    proc.on('error', function(data) {
      console.log('error', data);
      return general_error;
    });

    proc.stdin.write(JSON.stringify(req));
    proc.stdin.end();
  },

  // send request to the cloud service
  httpRequest: function(carrier, action, params, callback) {
    var http = require('https');

    var req = {
      carrier: carrier,
      action: action,
      params: params
    }

    var body = JSON.stringify(req);

    var request = new http.request({
      hostname: "api.rocketship.it",
      port: 443,
      path: "/v1/",
      method: "POST",
      json: true,
      headers: {
        "x-api-key": this.api_key,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    });
    request.end(body);

    var fullResp = ''
    request.on('response', function(response) {
      response.on('data', function(chunk) {
        fullResp += chunk
      });
      response.on('end', function() {
        return callback(JSON.parse(fullResp));
      });
    });

  }
};
