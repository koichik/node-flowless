'use strict';

var assert = require('assert');
var flowless = require('../index');

flowless.runSeq([
  function one(cb) {
    cb(null);
  },
  function two(cb) {
    flowless.runSeq([
      function inner(cb) {
        cb(new Error('two-inner failed'));
      }
    ], cb);
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
    flowless.runSeq([
      function inner(cb) {
        throw new Error('two-inner failed');
      }
    ], cb);
  },
  function three(cb) {
    assert.fail('unreachable');
  }
], function(err, result) {
  console.log(err);
});
