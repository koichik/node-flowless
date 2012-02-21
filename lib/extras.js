'use strict';

var assert = require('assert');
var flowless = require('./flowless');
var first = flowless.first;
var second = flowless.second;
var third = flowless.third;

exports.generate = generate;
exports.makeAsync = makeAsync;
exports.array = setup(Array.prototype);
exports.string = setup(String.prototype);


function generate() {
  var args = Array.prototype.slice.call(arguments);
  return function(cb) {
    var params = args.slice();
    params.unshift(null); // err
    cb.apply(null, params);
  };
}

function makeAsync(fn) {
  assert(typeof fn === 'function', 'fn must be a function');

  return function async() {
    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();
    try {
      cb(null, fn.apply(null, args));
    } catch (err) {
      cb(err);
    }
  };
}

function setup(proto) {
  var wrapperFunctions = Object.create(null);
  var names = Object.getOwnPropertyNames(proto);
  for (var i = 0, len = names.length; i < len; ++i) {
    var name = names[i];
    var method = proto[name];
    if (typeof method === 'function') {
      wrapperFunctions[name] = makeWrapper(method);
    }
  }
  return wrapperFunctions;
}

function makeWrapper(method) {
  return function methodWrapper() {
    var args = Array.prototype.slice.call(arguments);
    var needReplace = args.some(function(e) {
      return e === first || e === second || e === third;
    });

    return function invokeMethod(self) {
      var params = needReplace ? flowless.convertPlaceholder(args, arguments) :
                                 args;
      var cb = arguments[arguments.length - 1];
      cb(null, method.apply(self, params));
    };
  };
}
