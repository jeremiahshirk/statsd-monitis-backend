var monitis = require("./api/api.js");

function print_body(body) {
  console.log(body);
}

function missing_monitor_cb (name, type, body) {
  // if recording a metric finds a monitor doesn't exist, add it
  // note that we lose one datapoint, since we don't retry the post
  return function(body) {
    if(body.status == 'no such monitor') {
      console.log("Adding missing custom monitor: ", name, ":", type);
      monitis.add_statsd_monitor(name, type, print_body);
    }
  }
}

var flush_stats = function monitis_flush(ts, metrics) {
  console.log("Called flush_stats");
  console.log(metrics);
  for (key in metrics.counters) {
    monitis.add_result_by_name(
      key, {count: metrics.counters[key]}, missing_monitor_cb(key,'counter'));
  }
  for (key in metrics.gauges) {
    monitis.add_result_by_name(
      key, {gauge: metrics.counters[key]}, missing_monitor_cb(key,'gauge'));
  }
  for (key in metrics.raws) {
    var name = metrics.raws[key][0];
    var value = metrics.raws[key][1];
    monitis.add_result_by_name(
      name, {raw: value}, missing_monitor_cb(name,'raw'));
  }
  for (key in metrics.timers) {
    var sum = 0;
    var avg = 0;
    times = metrics.timers[key];
    for(var i=0;i<times.length; i++) {
      sum += times[i];
    }
    if (times.length > 0) {
      avg = sum / times.length;
    }
    monitis.add_result_by_name(
      key, {sum: sum, avg: avg}, missing_monitor_cb(key,'timer'));
    console.log(metrics.timers)
  }
  
}

var backend_status = function monitis_status(writeCb) {
  console.log("Called backend_status");
  
}

exports.init = function monitis_init(startup_time, config, events) {
  debug = config.debug;
  flushInterval = config.flushInterval;

  // read monitis config
  apikey = config.apikey;
  secretkey = config.secretkey;
  host = typeof config.host != 'undefined'? config.host : 'monitis.com';
  path = typeof config.path != 'undefined'? config.path : '/customMonitorApi';
  

  events.on('flush', flush_stats);
  events.on('status', backend_status);

  return true;
};
