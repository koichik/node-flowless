'use strict';

var path = require('path');
var should = require('should');
var utils = require('../lib/utils');

describe('utils', function() {
  it('should resolve location', function(done) {
    // annonymous function
    var location = utils.getLocation(true);
    location.should.match(/^\(.*/);

    // named function
    (function test() {
      location = utils.getLocation(true);
      location.should.match(/^test\(.*/);
    })();

    // method
    function Foo() {};
    Foo.prototype.bar = function() {
      location = utils.getLocation(true);
      location.should.match(/^Foo\.bar\(.*/);
    };
    var foo = new Foo();
    foo.bar();

    done();
  });
});
