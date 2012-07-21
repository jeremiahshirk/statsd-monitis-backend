var crypto = require('crypto');

function query_param(obj) {
  return function(key) { return key + obj[key]}
}

function hmac_join(obj) {
  return Object.keys(obj).sort().map(query_param(obj)).join('')
}

function checksum(secret, params) {
  return crypto.createHmac('sha1', secret)
            .update(hmac_join(params)).digest('base64')
}

module.exports.checksum = checksum;