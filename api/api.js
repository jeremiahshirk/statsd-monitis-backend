/*jslint node: true, indent: 2, plusplus: true, white: true */

var https = require('https');
var querystring = require('querystring');

var checksum = require('./auth.js').checksum;
var request_params = require('./request_params.js').request_params;
var util = require('./util.js');

var config, monitor_name_cache;

// cache object used by get_monitors
monitor_name_cache = {};

function format_query_params(params) {
  'use strict';
  return querystring.stringify(params);
}

function get(host, path, call_params, res_cb) {
  'use strict';
  var api_params, call_checksum, query;
  api_params = request_params(call_params);
  // debugging 
  util.debug('GET: \n', api_params);
  // call_checksum = checksum(api_config.monitis_secretkey, api_params);
  api_params.checksum = checksum(global.monitis.secretkey, api_params);
  query = format_query_params(api_params);
  https.get({host: host, path: path + "?" + query}, res_cb)
    .on('error', function (e) {
      console.error(e);
    });
}

function post(host, path, call_params, res_cb) {
  'use strict';
  var api_params, post_data, post_options, post_req;
  api_params = request_params(call_params);
  // debugging 
  util.debug('POST: \n', api_params);
  // call_checksum = checksum(api_config['monitis_secretkey'],api_params);
  api_params.checksum = checksum(global.monitis.secretkey, api_params);
  post_data = format_query_params(api_params);
  post_options = {
    host: host,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
    }
  };

  post_req = https.request(post_options, res_cb)
    .on('error', function (e) {
      console.error(e);
    });
  post_req.write(post_data);
  post_req.end();
}

function res_parser(callback) {
  'use strict';
  var parser, result;
  // return a function that can be used as an HTTPS response callback
  // which in turn calls the arg callback with the parsed JSON body
  parser = function parser(response) {
    var body = '', append_chunk, parse_body;
    append_chunk = function (chunk) {
      body += chunk;
    };
    parse_body = function parse_body() {
      try {
        result = JSON.parse(body);
      }
      catch(err) {
        result = err;
      }
      if (result instanceof Error) {
        console.log("Error parsing JSON: ", result, "\n", body , "\n");
        return;
      }
      callback(result);
    };
    response.on('data', append_chunk);
    response.on('end', parse_body);
  };
  return parser;
}

function monitis_get(params, res_cb) {
  'use strict';
  get(global.monitis.host, global.monitis.path, params, res_parser(res_cb));
}

function monitis_post_timestamp() {
  'use strict';
  var d, pad;
  d = new Date();
  pad = function (num) { return (num < 10 ? '0' : '') + num; };

  // current datetime in GMT with yyyy-MM-dd HH:mm:ss format
  return d.getUTCFullYear()
    + "-" + pad((parseInt(d.getUTCMonth(), 10) + 1))
    + "-" + pad(d.getUTCDate())
    + " " + pad(d.getUTCHours())
    + ":" + pad(d.getUTCMinutes())
    + ":" + pad(d.getUTCSeconds());
}

function monitis_post(call_params, res_cb) {
  'use strict';
  var api_params = request_params(call_params);
  api_params.timestamp = monitis_post_timestamp();
  post(global.monitis.host, global.monitis.path,
    api_params, res_parser(res_cb));
}

function checktime() {
  'use strict';
  // number of milliseconds since January 1, 1970, 00:00:00 GMT
  return new Date().getTime();
}

function encode_results(params) {
  'use strict';
  return querystring.stringify(params, ';', ':');
}

function get_monitor_info(monitorId, res_cb) {
  'use strict';
  monitis_get({action: 'getMonitorInfo', monitorId: monitorId}, res_cb);
}

function get_monitors(res_cb) {
  'use strict';
  var params, update_name_cache, i; // i for iteration in update_name_cache
  // params = {action: 'getMonitors', tag: tag};
  // test with no tag
  params = {action: 'getMonitors'};
  update_name_cache = function (monitors) {
    for (i = 0; i < monitors.length; i++) {
      monitor_name_cache[monitors[i].name] = monitors[i].id;
    }
    res_cb(monitors);
  };
  monitis_get(params, update_name_cache);
}

function add_result(monitorId, results, res_cb) {
  'use strict';
  // POST: action, monitorId, checktime, results
  monitis_post(
    {
      action: 'addResult',
      monitorId: monitorId,
      checktime: checktime(),
      results: encode_results(results)
    },
    res_cb
  );
}

function encode_result_params(params_ary) {
  'use strict';
  var encoded, i, params;
  // in: array of objects
  // objects have attributes with keys in (name,displayName,uom,dataType)
  // i.e. {name: 'foo',displayName: 'The Foo', uom: 'ms', dataType: 2}
  encoded = [];
  for (i = 0; i < params_ary.length; i++) {
    params = params_ary[i];
    encoded.push(
      encodeURI(params.name) + ':' + encodeURI(params.displayName) + ':'
        + encodeURI(params.uom) + ':' + encodeURI(params.dataType)
    );
  }
  return encoded.join(';');
}

function add_statsd_monitor(name, type, res_cb) {
  'use strict';
  var add_params, result_params_stage;
  // Specialized add_monitor for statsd
  // given only a name and type in (timer, counter, gauge, raw)
  // infer all of the other parameters in the Monitis API

  add_params = {
    action: 'addMonitor',
    name: name,
    tag: 'statsd',
  };
  result_params_stage = [];
  if (type === 'counter') {
    result_params_stage.push({name: 'count', displayName: 'count',
      uom: '', dataType: 2
    });
  }
  else if (type === 'gauge') {
    result_params_stage.push({name: 'gauge', displayName: 'gauge',
      uom: '', dataType: 4
    });
  }
  else if (type === 'raw') {
    result_params_stage.push({
      name: 'raw',
      displayName: 'Value',
      uom: '',
      dataType: 4
    });
  }
  else if (type === 'timer') {
    result_params_stage.push({
      name: 'sum',
      displayName: 'sum',
      uom: 'ms',
      dataType: 2
    });
    result_params_stage.push({
      name: 'mean',
      displayName: 'mean',
      uom: 'ms',
      dataType: 4
    });
    result_params_stage.push({
      name: 'upper',
      displayName: 'upper',
      uom: 'ms',
      dataType: 2
    });
    result_params_stage.push({
      name: 'lower',
      displayName: 'lower',
      uom: 'ms',
      dataType: 2
    });
    result_params_stage.push({
      name: 'upper_90',
      displayName: 'upper_90',
      uom: 'ms',
      dataType: 2
    });
    result_params_stage.push({
      name: 'count',
      displayName: 'count',
      uom: '',
      dataType: 2
    });
  }
  else {
    console.log("Invalid type: " + type);
  }
  add_params.resultParams = encode_result_params(result_params_stage);
  util.debug(add_params);
  monitis_post(add_params, res_cb);
}

function add_result_by_name(name, results, res_cb) {
  'use strict';
  var id, add_result_callback;
  id = monitor_name_cache[name];
  if (!id) {
    add_result_callback = function (res) {
      id = monitor_name_cache[name];
      if (id) {
        add_result(id, results,res_cb);
      }
      else {
        console.log("Monitor " + name + " doesn't exist");
        res_cb({status: 'no such monitor', name: name});
      }
    };
    get_monitors(add_result_callback);
  }
  else {
    add_result(id, results,res_cb);
  }
}

module.exports.post = monitis_post;
module.exports.get = monitis_get;
module.exports.get_monitors = get_monitors;
module.exports.add_result = add_result;
module.exports.add_statsd_monitor = add_statsd_monitor;
module.exports.get_monitor_info = get_monitor_info;
module.exports.add_result_by_name = add_result_by_name;
module.exports.config = config;

// Testing only if this file is run directly
if (!module.parent) {
  process.stdout.write(checksum('notReallyASecret',
                                {key2: 'foo', key1: 'bar'}) + "\n");
  process.stdout.write(
    "checktime() -> " + checktime() + "\n"
  );
  process.stdout.write(
    "encode_results: " + encode_results({"foo 2": 1.1, bar: "baz"}) + "\n"
  );
}
