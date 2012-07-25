/*jslint node: true, indent: 2 */

var crypto = require('crypto');

function query_param(obj) {
  'use strict';
  return function (key) { return key + obj[key]; };
}

function hmac_join(obj) {
  'use strict';
  return Object.keys(obj).sort().map(query_param(obj)).join('');
}

function checksum(secret, params) {
  'use strict';
  return crypto.createHmac('sha1', secret)
            .update(hmac_join(params)).digest('base64');
}

module.exports.checksum = checksum;