'use strict';

exports.toArray = toArray;
exports.makeFunc = makeFunc;
exports.containsPlaceholder = containsPlaceholder;
exports.convertPlaceholder = convertPlaceholder;

var first = exports.first = {};
var second = exports.second = {};
var third = exports.third = {};

var debugMode = process.env.NODE_DEBUG &&
                /\bflowless\b/.test(process.env.NODE_DEBUG);
exports.debug = debugMode ? debug : function() {};
exports.getLocation = getLocation;

var assert = require('assert');
var util = require('util');


function toArray(args, start, end) {
  return Array.prototype.slice.call(args, start, end);
}

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

function getLocation(referencePoint) {
  var original = Error.prepareStackTrace;
  Error.prepareStackTrace = customPrepareStackTrace;
  var error = {};
  Error.captureStackTrace(error, referencePoint || getLocation);
  var location = error.stack;
  Error.prepareStackTrace = original;
  return util.format('%s(%s:%d)',
                     location.getFunctionName(),
                     location.getFileName(),
                     location.getLineNumber());

  function customPrepareStackTrace(error, structuredStackTrace) {
    return structuredStackTrace[0];
  }
}

function debug() {
  var args = Array.prototype.slice.call(arguments);
  if (typeof args[0] === 'string') {
    args[0] = 'FLOWLESS: ' + args[0];
  } else {
    args.unshift('FLOWLESS:');
  }
  console.error.apply(console, args);
}
