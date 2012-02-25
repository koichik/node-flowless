'use strict';

var assert = require('assert');
var utils = require('./utils');

exports.generate = generate;
exports.bindFirst = bindFirst;
exports.bindSecond = bindSecond;
exports.bindThird = bindThird;
exports.makeAsync = makeAsync;
exports.array = makeWrappers(Array.prototype);
exports.string = makeWrappers(String.prototype);


function generate() {
  var args = Array.prototype.slice.call(arguments);
  return function(cb) {
    var params = args.slice();
    params.unshift(null); // err
    cb.apply(null, params);
  };
}

function bindFirst(target, name) {
  return bindArgument(target, name, 0);
}

function bindSecond(target, name) {
  return bindArgument(target, name, 1);
}

function bindThird(target, name) {
  return bindArgument(target, name, 2);
}

function bindArgument(target, name, n) {
  return function doBindArgument() {
    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();
    target[name] = args[n];
    args.unshift(null); // err
    cb.apply(null, args);
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

function makeWrappers(proto) {
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
    var needReplace = utils.containsPlaceholder(args);

    return function invokeMethod(self) {
      var params = needReplace ? utils.convertPlaceholder(args, arguments) :
                                 args.slice();
      var cb = arguments[arguments.length - 1];
      cb(null, method.apply(self, params));
    };
  };
}