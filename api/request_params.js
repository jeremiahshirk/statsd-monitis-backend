/*jslint node: true, indent: 2, forin: true */

function request_params(params) {
  'use strict';
  var base_params, merged_params, key;

  // Omit defaults, to make smaller requests
  // output: 'JSON',
  // version: '2',
  // validation: 'HMACSHA1'  
  base_params = { apikey: global.monitis.apikey };
  merged_params = {};

  for (key in base_params) {
    merged_params[key] = base_params[key];
  }
  for (key in params) {
    merged_params[key] = params[key];
  }
  return merged_params;
}

module.exports.request_params = request_params;