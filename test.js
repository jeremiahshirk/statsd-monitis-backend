var monitis = require("./api/api.js");

function res_cb(response){
  console.log("statusCode: ", response.statusCode);
  console.log("headers: ", response.headers);
  response.on('data', print_chunk)
}

function print_chunk(chunk) {
  process.stdout.write(chunk + "\n");
}

// invalid checksum when both are run!!
monitis.get({action: 'getMonitors'},res_cb);
monitis.post({action: 'deleteMonitor', monitorId: '4607'}, res_cb);
