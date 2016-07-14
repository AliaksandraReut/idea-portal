var async = require('async'),
    btoa = require('btoa'),
    request = require('request'),
    fs = require('fs'),
    config = JSON.parse(fs.readFileSync(__dirname + '/upsa-config.json', 'utf8'));

var authentication = function(username, password, callback) {
  var pmcId, token;

  async.waterfall([
    function(callback) {
      request({
        url: config.url + config.path.oauth,
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(username + ':' + password),
          'Credentials-Type': 'domain'
        },
        form: {
          'grant_type': 'client_credentials'
        }
      }, callback);
    },
    function(response, data, callback) {
      var userBean;

      try {
        data = JSON.parse(data);
      }
      catch(e) {
        console.log(e);
        callback(e);
      }

      console.log('Authentication response code: ' + '%s'.green, response.statusCode);

      if (response.statusCode == 200 &&
          (userBean = data.additionalInformation && data.additionalInformation.userBean)) {

        callback(null, {
          token: data.value,
          tokenType: data.tokenType,
          expiresIn: data.expiresIn,
          userData: userBean
        });
      }
      else {
        callback(response.statusCode, data.message);
      }
    },
    function(data, callback) {
      pmcId = data.userData.pmcId;
      token = data.token;

      request({
        url: config.url + config.path.employee + pmcId,
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + token
        },
        json: {}
      }, callback);
    },
    function(response, data, callback) {
      console.log('Employee data response code: ' + '%s'.green, response.statusCode);
      callback(null, data.employeeSimpleView);
    }
  ], callback);
};

module.exports.authentication = authentication;