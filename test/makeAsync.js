'use strict';

var path = require('path');
var should = require('should');
var flowless = require('../index');

function minus(a, b) {
  return a - b;
}

describe('makeAsync', function() {
  it('should finish without error', function(done) {
    var func = flowless.makeAsync(minus);
    func.should.be.a('function');
    func(1, 2, function(err, result) {
      should.not.exist(err);
      result.should.equal(-1);
      done();
    });
  })
});
