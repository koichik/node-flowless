'use strict';

var path = require('path');
var should = require('should');
var flowless = require('../index');
var first = flowless.first;
var second = flowless.second;

function minus(a, b, cb) {
  process.nextTick(function() {
    cb(null, a - b);
  });
}

var obj = {};
obj.plus = function(a, b, cb) {
  process.nextTick(function() {
    cb(null, a + b);
  });
};

describe('makeFunc', function() {
  it('should invoke first element as a function', function(done) {
    var func = flowless.makeFunc([minus, 1, 2]);
    func.should.be.a('function');
    func(function(err, result) {
      should.not.exist(err);
      result.should.equal(-1);
      // again
      func(function(err, result) {
        should.not.exist(err);
        result.should.equal(-1);
        done();
      });
    });
  }),

  it('should invoke second element as a function', function(done) {
    var func = flowless.makeFunc([obj, obj.plus, 1, 2]);
    func.should.be.a('function');
    func(function(err, result) {
      should.not.exist(err);
      result.should.equal(3);
      // again
      func(function(err, result) {
        should.not.exist(err);
        result.should.equal(3);
        done();
      });
    });
  }),

  it('should convert placeholder to actual argument', function(done) {
    var func = flowless.makeFunc([minus, second, first]);
    func.should.be.a('function');
    func(1, 2, function(err, result) {
      should.not.exist(err);
      result.should.equal(1);
      // again
      func(1, 2, function(err, result) {
        should.not.exist(err);
        result.should.equal(1);
        done();
      });
    });
  })
});
