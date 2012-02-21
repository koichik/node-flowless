'use strict';

var should = require('should');
var flowless = require('../index');

describe('extras', function() {
  it('should call method of Array', function(done) {
    var fn = flowless.array.join(':');
    fn(['foo', 'bar'], function(err, result) {
      should.not.exist(err);
      result.should.equal('foo:bar');
      done();
    });
  }),

  it('should call method of String', function(done) {
    var fn = flowless.string.split(':');
    fn('foo:bar', function(err, result) {
      should.not.exist(err);
      result.should.have.lengthOf(2);
      result[0].should.equal('foo');
      result[1].should.equal('bar');
      done();
    });
  }),

  it('should convert placeholder to actual argument', function(done) {
    var fn = flowless.string.concat(flowless.second);
    fn('foo', 'bar', function(err, result) {
      should.not.exist(err);
      result.should.equal('foobar');

      // again
      fn('hoge', 'fuga', function(err, result) {
        should.not.exist(err);
        result.should.equal('hogefuga');
        done();
      });
    });
  })
});
