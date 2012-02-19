'use strict';

var should = require('should');
var flowless = require('../index');

describe('parallel', function() {
  it('should finish without error', function(done) {
    var t1 = Date.now();
    flowless.parallel([
      function(cb) {
        setTimeout(function() {
          cb(null, 1);
        }, 100);
      },
      function(cb) {
        setTimeout(function() {
          cb(null, 2);
        }, 200);
      },
      function(cb) {
        setTimeout(function() {
          cb(null, 3);
        }, 300);
      }
    ], function(err, results) {
      var t2 = Date.now();
      should.not.exist(err);
      results.should.have.lengthOf(3);
      results[0].should.equal(1);
      results[1].should.equal(2);
      results[2].should.equal(3);
      (t2 - t1).should.be.below(400);
      done();
    });
  }),
  it('should finish with error if error is passed to callback', function(done) {
    flowless.parallel([
      function(cb) {
        setTimeout(function() {
          cb(null, 1);
        }, 100);
      },
      function(cb) {
        setTimeout(function() {
          cb(new Error('oops'));
        }, 200);
      },
      function(cb) {
        setTimeout(function() {
          cb(null, 3);
        }, 300);
      }
    ], function(err) {
      should.exist(err);
      err.message.should.equal('oops');
      done();
    });
  }),
  it('should finish with error if exception is occurred', function(done) {
    flowless.parallel([
      function(cb) {
        setTimeout(function() {
          cb(null, 1);
        }, 100);
      },
      function(cb) {
        throw new Error('oops');
      },
      function(cb) {
        should.fail();
      }
    ], function(err) {
      should.exist(err);
      err.message.should.equal('oops');
      done();
    });
  });
});
