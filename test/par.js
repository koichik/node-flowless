'use strict';

var should = require('should');
var flowless = require('../index');

describe('par', function() {
  it('should finish without error', function(done) {
    var t1 = Date.now();
    flowless.runPar([
      function(cb) {
        setTimeout(function() {
          cb(null, 1);
        }, 10);
      },
      function(cb) {
        setTimeout(function() {
          cb(null, 2);
        }, 20);
      },
      function(cb) {
        setTimeout(function() {
          cb(null, 3);
        }, 30);
      }
    ], function(err, results) {
      var t2 = Date.now();
      should.not.exist(err);
      results.should.have.lengthOf(3);
      results[0].should.equal(1);
      results[1].should.equal(2);
      results[2].should.equal(3);
      (t2 - t1).should.be.below(50);
      done();
    });
  });

  it('should finish with error if error is passed to callback', function(done) {
    flowless.runPar([
      function(cb) {
        process.nextTick(function() {
          cb(null, 1);
        });
      },
      function(cb) {
        process.nextTick(function() {
          cb(new Error('oops'));
        });
      },
      function(cb) {
        process.nextTick(function() {
          cb(null, 3);
        });
      }
    ], function(err) {
      should.exist(err);
      err.message.should.equal('oops');
      done();
    });
  });

  it('should finish with error if exception is occurred', function(done) {
    flowless.runPar([
      function(cb) {
        process.nextTick(function() {
          cb(null, 1);
        });
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

  it('should invoke callback asynchronously', function(done) {
    var returned = false;
    flowless.runPar([
      function(cb) {
        cb(null); // synchronously
      }
    ], function(err) {
      should.not.exist(err);
      returned.should.be.true;
      done();
    });
    returned = true;
  });

  it('should finish without error if no functions', function(done) {
    var returned = false;
    flowless.runPar([
    ], function(err, results) {
      should.not.exist(err);
      results.should.be.empty;
      returned.should.be.true;
      done();
    });
    returned = true;
  });
});
