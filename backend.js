var monitis = require("./api/api.js");

var flush_stats = function monitis_flush(ts, metrics) {
  console.log("Called flush_stats");
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
