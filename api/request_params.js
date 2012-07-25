var request_params = function (params) {
  var base_params = {
    apikey: global.monitis.apikey
    // Omit defaults, to make smaller requests
    // output: 'JSON',
    // version: '2',
    // validation: 'HMACSHA1'
  };
  
  merged_params = {};
  for (var key in base_params) {
    merged_params[key] = base_params[key];
  }  
  for (var key in params) {
    merged_params[key] = params[key];
  }
  return merged_params;
}

module.exports.request_params = request_params;