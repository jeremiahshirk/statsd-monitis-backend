/*jslint node: true, indent: 2, plusplus: true */

var monitis = require("./api/api.js");
var util = require('./api/util.js');


function print_body(body) {
  'use strict';
  util.debug(body);
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
    i;        // iteration in for loop

  console.log("Called flush_stats");
  util.debug(metrics);
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
    if (metrics.timer_data.hasOwnProperty(key)) {
      var data = metrics.timer_data[key]
      monitis.add_result_by_name(key,
        {sum: data.sum, mean: data.mean, upper: data.upper,
          lower: data.lower, upper_90: data.upper_90, count: data.count},
        missing_monitor_cb(key, 'timer'));
      util.debug(metrics.timers);
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
    global.monitis.host = 'api.monitis.com';
  }
  if (!config.monitis.path) {
    global.monitis.path = '/customMonitorApi';
  }

  util.debug("global.monitis.debug is ", global.monitis.debug);
  events.on('flush', monitis_flush);
  events.on('status', monitis_status);

  return true;
};
