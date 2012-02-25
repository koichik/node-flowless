'use strict';

var should = require('should');
var flowless = require('../index');

describe('map', function() {
  it('should finish without error', function(done) {
    flowless.runMap([
      ['aaa', 'bbb'],
      ['xxx', 'yyy', 'zzz']
    ], flowless.makeAsync(function(array) {
      return array.join(', ');
    }), function(err, results) {
      should.not.exist(err);
      results.should.have.lengthOf(2);
      results[0].should.equal('aaa, bbb');
      results[1].should.equal('xxx, yyy, zzz');
      done();
    });
  });

  it('should run in parallel at most to concurrency', function(done) {
    var par = 0;
    flowless.runMap(3, [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    ], function(n, cb) {
      ++par;
      par.should.be.below(4);
      process.nextTick(function() {
        par.should.be.below(4);
        --par;
        cb(null, n);
      });
    }, function(err, results) {
      should.not.exist(err);
      results.should.have.lengthOf(10);
      done();
    });
  });

  it('should run in sequential', function(done) {
    var par = 0;
    flowless.runMap(1, [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    ], function(n, cb) {
      ++par;
      par.should.equal(1);
      process.nextTick(function() {
        par.should.equal(1);
        --par;
        cb(null, n);
      });
    }, function(err, results) {
      should.not.exist(err);
      results.should.have.lengthOf(10);
      done();
    });
  });
});
