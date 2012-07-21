var monitis = require("./api/api.js");

function res_cb(response){
  var body = '';
  var append_chunk = function(chunk) {
    body += chunk;
  }
  var print_body = function() {
    process.stdout.write(body + "\n");
  }
  console.log("statusCode: ", response.statusCode);
  console.log("headers: ", response.headers);
  response.on('data', append_chunk);
  response.on('end', print_body);
}

monitis.get_monitor_info(868, res_cb);
// monitis.get({action: 'getMonitors'},res_cb);
// monitis.post({action: 'deleteMonitor', monitorId: '4607'}, res_cb);
