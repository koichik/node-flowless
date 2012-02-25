'use strict';

var assert = require('assert');
var flowless = require('../index');

flowless.runSeq([
  function one(cb) {
    cb(null);
  },
  function two(cb) {
    cb(new Error('two failed'));
  },
  function three(cb) {
    assert.fail('unreachable');
  }
], function(err, result) {
  console.log(err);
});

flowless.runSeq([
  function one(cb) {
    cb(null);
  },
  function two(cb) {
    throw new Error('two failed');
  },
  function three(cb) {
    assert.fail('unreachable');
  }
], function(err, result) {
  console.log(err);
});
