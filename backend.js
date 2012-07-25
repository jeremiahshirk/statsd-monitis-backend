/*jslint node: true, indent: 2, plusplus: true */

var monitis = require("./api/api.js");

function print_body(body) {
  'use strict';
  console.log(body);
}

function missing_monitor_cb(name, type, body) {
  'use strict';
  // When recording a metric encounters a monitor that doesn't exist, add it.
  // Note that we lose one datapoint, since we don't retry the post.
  return function (body) {
    if (body.status === 'no such monitor') {
      console.log("Adding missing custom monitor: ", name, ":", type);
      monitis.add_statsd_monitor(name, type, print_body);
    }
  };
}

// flush_stats
function monitis_flush(ts, metrics) {
  'use strict';
  var key,    // iteration over members of metrics
    name,     // iteration over metrics.raws
    value,
    sum,      // iteration over metrics.timers
    avg,
    times,
    i;        // iteration in for loop

  console.log("Called flush_stats");
  console.log(metrics);
  for (key in metrics.counters) {
    if (metrics.counters.hasOwnProperty(key)) {
      monitis.add_result_by_name(key,
        {count: metrics.counters[key]}, missing_monitor_cb(key, 'counter'));
    }
  }
  for (key in metrics.gauges) {
    if (metrics.gauges.hasOwnProperty(key)) {
      monitis.add_result_by_name(key,
        {gauge: metrics.counters[key]}, missing_monitor_cb(key, 'gauge'));
    }
  }
  for (key in metrics.raws) {
    if (metrics.raws.hasOwnProperty(key)) {
      name = metrics.raws[key][0];
      value = metrics.raws[key][1];
      monitis.add_result_by_name(name,
        {raw: value}, missing_monitor_cb(name, 'raw'));
    }
  }
  for (key in metrics.timers) {
    if (metrics.timers.hasOwnProperty(key)) {
      sum = 0;
      avg = 0;
      times = metrics.timers[key];
      for (i = 0; i < times.length; i++) {
        sum += times[i];
      }
      if (times.length > 0) {
        avg = sum / times.length;
      }
      monitis.add_result_by_name(key,
        {sum: sum, avg: avg}, missing_monitor_cb(key, 'timer'));
      console.log(metrics.timers);
    }
  }
}

// backend_status
function monitis_status(writeCb) {
  'use strict';
  console.log("Called backend_status");
}

exports.init = function monitis_init(startup_time, config, events) {
  'use strict';
  var debug, flushInterval;
  debug = config.debug;
  flushInterval = config.flushInterval;

  // read monitis config
  global.monitis = config.monitis;
  if (!config.monitis.host) {
    global.monitis.host = 'monitis.com';
  }
  if (!config.monitis.path) {
    global.monitis.path = '/customMonitorApi';
  }

  events.on('flush', monitis_flush);
  events.on('status', monitis_status);

  return true;
};
