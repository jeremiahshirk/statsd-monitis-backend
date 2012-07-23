var monitis = require("./api/api.js");

// function print_body(response){
//   var body = '';
//   var append_chunk = function(chunk) {
//     body += chunk;
//   }
//   var print_body = function() {
//     process.stdout.write(body + "\n");
//   }
//   console.log("statusCode: ", response.statusCode);
//   console.log("headers: ", response.headers);
//   response.on('data', append_chunk);
//   response.on('end', print_body);
// }

function print_body(body) {
  console.log(body);
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
//monitis.get_monitor_info(1723, console.log);
monitis.add_result(123456, {size: 123}, print_body);
// monitis.get({action: 'getMonitors'},print_body);
//monitis.get_monitors(print_body);
//monitis.add_result_by_name('blah dir', {size: 123}, print_body);

//monitis.post({action: 'deleteMonitor', monitorId: '31488'}, print_body);

// create monitors for use with statsd
// addMonitor(resultParams, name, tag)
// monitis.post({
//   action: 'addMonitor',
//   resultParams: encode_result_params([{
//     name: 'foo',
//     displayName: 'The Foo',
//     uom: 's',
//     dataType: 2
//   }]),
//   name: 'a.b.count',
//   tag: 'statsd'
// }, print_body);
