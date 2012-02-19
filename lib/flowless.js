'use strict';

var assert = require('assert');

exports.series = series;
exports.parallel = parallel;
exports.makeSeries = makeSeries;
exports.makeParallel = makeParallel;
exports.makeFunc = makeFunc;
exports.makeAsync = makeAsync;

var first = exports.first = {};
var second = exports.second = {};
var third = exports.third = {};


function series(functions, cb) {
  makeSeries(functions)(cb);
}

function parallel(functions, cb) {
  makeParallel(functions)(cb);
}

function makeSeries(functions) {
  assert(Array.isArray(functions), 'functions must be an array');

  return function doSeries() {
    var i = 0;
    var n = functions.length;
    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();
    assert(typeof cb === 'function', 'last argument must be a function');
    args.unshift(null); // err
    next.apply(null, args);

    function next(err) {
      if (err) {
        return cb(err);
      }
      var args = Array.prototype.slice.call(arguments);
      if (i >= n) {
        return cb.apply(null, args);
      }
      var fn = functions[i++];
      if (Array.isArray(fn)) {
        fn = makeFunc(fn);
      }
      assert(typeof fn === 'function',
             'an element of functions  must be a function');
      args = args.slice(1).concat(next);
      try {
        fn.apply(null, args);
      } catch (err) {
        return cb(err);
      }
    }
  };
}

function makeParallel(functions) {
  return function doParallel() {
    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();
    var n = functions.length;
    var finished = 0;
    var results = [];
    var errReported;

    functions.every(function doEachParallel(fn, i) {
      if (Array.isArray(fn)) {
        fn = makeFunc(fn);
      }
      assert(typeof fn === 'function',
             'an element of functions  must be a function');
      var params = args.slice().concat(next);
      try {
        fn.apply(null, params);
      } catch (err) {
        return reportError(err);
      }
      return true;

      function next(err, result) {
        if (err) {
          return reportError(err);
        }
        if (arguments.length > 2) {
          results[i] = Array.prototype.slice.call(arguments, 1);
        } else {
          results[i] = result;
        }
        ++finished;
        if (finished === n && !errReported) {
          cb(null, results);
        }
      }
    });

    function reportError(err) {
      if (!errReported) {
        errReported = true;
        cb(err);
      }
      return false;
    }
  };
}

function makeFunc(array) {
  assert(Array.isArray(array), 'array must be an array');
  assert(typeof array[0] === 'function', 'first element must be a function');

  return function invokeFunc() {
    var args = array.slice();
    var fn = args.shift();
    for (var i = 0, len = args.length; i < len; ++i) {
      if (args[i] === first) {
        args[i] = arguments[0];
      } else if (args[i] === second) {
        args[i] = arguments[1];
      } else if (args[i] === third) {
        args[i] = arguments[2];
      }
    }
    args.push(arguments[arguments.length - 1]); // cb
    fn.apply(null, args);
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
