'use strict';

exports.makeFunc = makeFunc;
exports.containsPlaceholder = containsPlaceholder;
exports.convertPlaceholder = convertPlaceholder;

var first = exports.first = {};
var second = exports.second = {};
var third = exports.third = {};

var assert = require('assert');


function makeFunc(args) {
  if (typeof args === 'function') {
    return args;
  }
  assert(Array.isArray(args), 'args must be an array');
  var needReplace = containsPlaceholder(args);

  return function invokeFunc() {
    var params = needReplace ? convertPlaceholder(args, arguments) :
                               args.slice();
    var context = (typeof params[0] === 'function') ? null : params.shift();
    var fn = params.shift();
    assert(typeof fn === 'function',
         'first or second element must be a function');
    var cb = arguments[arguments.length - 1];
    params.push(cb);
    fn.apply(context, params);
  };
}

function containsPlaceholder(args) {
  return args.some(function(e) {
    return e === first || e === second || e === third;
  });
}

function convertPlaceholder(args, argument) {
  args = args.slice();
  for (var i = 0, len = args.length; i < len; ++i) {
    if (args[i] === first) {
      args[i] = argument[0];
    } else if (args[i] === second) {
      args[i] = argument[1];
    } else if (args[i] === third) {
      args[i] = argument[2];
    }
  }
  return args;
}
