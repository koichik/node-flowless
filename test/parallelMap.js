'use strict';

var should = require('should');
var flowless = require('../index');

describe('parallelMap', function() {
  it('should finish without error', function(done) {
    flowless.parallelMap([
      ['aaa', 'bbb'],
      ['xxx', 'yyy', 'zzz']
    ], flowless.makeAsync(function(array) {
      return array.join(', ');
    }), function(err, results) {
      var t2 = Date.now();
      should.not.exist(err);
      results.should.have.lengthOf(2);
      results[0].should.equal('aaa, bbb');
      results[1].should.equal('xxx, yyy, zzz');
      done();
    });
  });
});
