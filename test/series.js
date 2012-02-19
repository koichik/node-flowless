'use strict';

var should = require('should');
var flowless = require('../index');

describe('series', function() {
  it('should finish without error', function(done) {
    flowless.series([
      function(cb) {
        cb(null, 1);
      },
      function(val, cb) {
        val.should.equal(1);
        cb(null, 2, 3);
      },
      function(val1, val2, cb) {
        val1.should.equal(2);
        val2.should.equal(3);
        cb(null, 4, 5, 6);
      }
    ], function(err, val1, val2, val3) {
      should.not.exist(err);
      val1.should.equal(4);
      val2.should.equal(5);
      val3.should.equal(6);
      done();
    });
  }),
  it('should finish with error if error is passed to callback', function(done) {
    flowless.series([
      function(cb) {
        cb(null, 1);
      },
      function(val, cb) {
        val.should.equal(1);
        cb(new Error('oops'));
      },
      function(val1, val2, cb) {
        should.fail();
      }
    ], function(err) {
      should.exist(err);
      err.message.should.equal('oops');
      done();
    });
  }),
  it('should finish with error if exception is occurred', function(done) {
    flowless.series([
      function(cb) {
        cb(null, 1);
      },
      function(val, cb) {
        val.should.equal(1);
        throw new Error('oops');
      },
      function(val1, val2, cb) {
        should.fail();
      }
    ], function(err) {
      should.exist(err);
      err.message.should.equal('oops');
      done();
    });
  });
});
