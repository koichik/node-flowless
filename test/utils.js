'use strict';

var path = require('path');
var should = require('should');
var utils = require('../lib/utils');

describe('utils', function() {
  it('should resolve location', function(done) {
    // function
    function test() {
      var location = utils.getLocation();
      location.should.match(/^test\(.*/);
    }
    test();

    // method
    function Foo() {};
    Foo.prototype.bar = function() {
      var location = utils.getLocation();
      location.should.match(/^Foo\.bar\(.*/);
    };
    var foo = new Foo();
    foo.bar();

    done();
  });
});
