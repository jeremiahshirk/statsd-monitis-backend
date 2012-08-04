/*jslint node: true, indent: 2 */

function debug() {
  'use strict';
  if (global.monitis.debug === true) {
    console.log(arguments);
  }
}

module.exports.debug = debug;
