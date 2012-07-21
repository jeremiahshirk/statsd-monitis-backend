var api_config = require('./api_config.js').api_config()

var RequestParams = function(params) {
  var base_params = {
    apikey: api_config['monitis_apikey'],
    // Omit defaults, to make smaller requests
    // output: 'JSON',
    // version: '2',
    // validation: 'HMACSHA1'
  };
  
  request_params = new Object();
  for (var key in base_params) {
    request_params[key] = base_params[key];
  }  
  for (var key in params) {
    request_params[key] = params[key];
  }
  return request_params;
}

module.exports.RequestParams = RequestParams;