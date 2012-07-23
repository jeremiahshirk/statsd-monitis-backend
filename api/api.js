// testing constructs for simple/dumb monitis custom monitor implementation in JS

var https = require('https');
var querystring = require('querystring');

var api_config = require('./api_config.js').api_config();
var checksum = require('./auth.js').checksum;
var RequestParams = require('./request_params.js').RequestParams;


function format_query_params(params) {
  return querystring.stringify(params);
}

function get(host, path, call_params, res_cb) {
  var api_params = RequestParams(call_params);
  call_checksum = checksum(api_config['monitis_secretkey'],api_params);
  api_params['checksum'] = call_checksum;
  query = format_query_params(api_params);
  https.get({host: host, path: path + "?" + query}, res_cb)
    .on('error', function(e) {
      console.error(e);
    });
}

function post(host, path, call_params, res_cb) {
  var api_params = RequestParams(call_params);
  call_checksum = checksum(api_config['monitis_secretkey'],api_params);
  api_params['checksum'] = call_checksum;
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
  
  var post_req = https.request(post_options, res_cb)
    .on('error', function(e) {
      console.error(e);
    });
  post_req.write(post_data);
  post_req.end();
}

function monitis_get(params, res_cb) {
  get(api_config['host'], api_config['path'], params, res_parser(res_cb));
}

function monitis_post_timestamp() {
  var d = new Date();
  var pad = function(num) { return (num < 10 ? '0' : '') + num }
  
  // current datetime in GMT with yyyy-MM-dd HH:mm:ss format
  return d.getUTCFullYear() 
    + "-" + pad((parseInt(d.getUTCMonth()) + 1))
    + "-" + pad(d.getUTCDate())
    + " " + pad(d.getUTCHours())
    + ":" + pad(d.getUTCMinutes())
    + ":" + pad(d.getUTCSeconds())
}

function monitis_post(call_params, res_cb) {
  var api_params = RequestParams(call_params);
  api_params['timestamp'] = monitis_post_timestamp();
  post(api_config['host'], api_config['path'], api_params, res_parser(res_cb));
}

function checktime() {
  // number of milliseconds since January 1, 1970, 00:00:00 GMT
  // aka epoch time
  return new Date().getTime();
}

function encode_results(params) {
  return querystring.stringify(params,';', ':');
}

function res_parser(callback){
  // return a function that can be used as an HTTPS response callback
  // which in turn calls the arg callback with the parsed JSON body
  var parser = function(response) {
    var body = '';
    var append_chunk = function(chunk) {
      body += chunk;
    }
    var parse_body = function() {
      callback(JSON.parse(body));
    }
    response.on('data', append_chunk);
    response.on('end', parse_body);
  }
  return parser;
}

// TODO determine best option for exporting names between files
module.exports.get_monitor_info = function(monitorId, res_cb) {
  monitis_get({action: 'getMonitorInfo', monitorId: monitorId},res_cb);
}

var monitor_name_cache = new Object();
function get_monitors(res_cb) {
  // params = {action: 'getMonitors', tag: tag};
  // test with no tag
  params = {action: 'getMonitors'};
  var update_name_cache = function(monitors) {
    for(var i=0; i<monitors.length; i++) {
      monitor_name_cache[monitors[i]['name']] = monitors[i]['id']
    }
    res_cb(monitors);
  }
  monitis_get(params,update_name_cache);
}

function add_result(monitorId,results,res_cb) {
  // POST: action, monitorId, checktime, results
  monitis_post({
    action: 'addResult',
    monitorId: monitorId,
    checktime: checktime(),
    results: encode_results(results)
  },
  res_cb);
}

function encode_result_params(params_ary) {
  // in: array of objects
  // objects have attributes with keys in (name,displayName,uom,dataType)
  // i.e. {name: 'foo',displayName: 'The Foo', uom: 'ms', dataType: 2}
  var encoded = [];
  for (var i=0; i<params_ary.length; i++) {
    var params = params_ary[i];
    encoded.push(
      encodeURI(params['name']) + ':' +
      encodeURI(params['displayName']) + ':' +
      encodeURI(params['uom']) + ':' +
      encodeURI(params['dataType']));
  }
  return encoded.join(';');
}

function add_statsd_monitor(name, type, res_cb) {
  // Specialized add_monitor for statsd
  // given only a name and type in (timer, counter, gauge)
  // infer all of the other parameters in the Monitis API
  //    timer: multiple result params (just avg  and sum for now)
  //    counter: single result param, name count, type int
  //    gauge: single result param, name gauge, type int
    
  // construct the call to add
  var add_params = {
    action: 'addMonitor',
    name: name,
    tag: 'statsd',
  };
  result_params_stage = [];
  if (type == 'counter') {
    result_params_stage.push({
      name: 'count',
      displayName: 'count',
      uom: '',
      dataType: 2
    });
  }
  else if (type == 'gauge') {
    result_params_stage.push({
      name: 'gauge',
      displayName: 'gauge',
      uom: '',
      dataType: 2
    });
  }
  else if (type == 'timer') {
    result_params_stage.push({
      name: 'sum',
      displayName: 'sum',
      uom: '',
      dataType: 2
    });
    result_params_stage.push({
      name: 'avg',
      displayName: 'avg',
      uom: '',
      dataType: 4 // use float
    });
  }
  else {
    console.log("Invalid type: " + type)
  }
  add_params['resultParams'] = encode_result_params(result_params_stage);
  console.log(add_params);
  monitis_post(add_params, res_cb);
}

module.exports.add_result_by_name = function(name, results, res_cb) {
  var id = monitor_name_cache[name];
  if (!id) {
    var add_result_callback = function(res) {
      id = monitor_name_cache[name];
      if (id)
        add_result(id, results,res_cb);
      else console.log("Monitor " + name + " doesn't exist");
    }
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

// module.exports.get_monitor_info = get_monitor_info

// Testing only if this files is run directly
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
