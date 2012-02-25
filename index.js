'use strict';

module.exports = exports = require('./lib/flowless');

var extras = require('./lib/extras');
var keys = Object.keys(extras);
for (var i = 0, len = keys.length; i < len; ++i) {
  var key = keys[i];
  exports[key] = extras[key];
}

var utils = require('./lib/utils');
exports.first = utils.first;
exports.second = utils.second;
exports.third = utils.third;
