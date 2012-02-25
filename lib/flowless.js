'use strict';

exports.seq = seq;
exports.par= par;
exports.map = map;

exports.runSeq = runSeq;
exports.runPar= runPar;
exports.runMap = runMap;

var assert = require('assert');
var utils = require('./utils');

var DEFAULT_CONCURRENCY = 10;


function runSeq(functions, cb) {
  seq(functions)(cb || defaultCallback);
}

function runPar(functions, cb) {
  par(functions)(cb || defaultCallback);
}

function runMap(concurrency, array, fn, cb) {
  if (typeof concurrency !== 'number') {
    cb = fn;
    fn = array;
    array = concurrency;
    concurrency = DEFAULT_CONCURRENCY;
  }
  map(concurrency, fn)(array, cb || defaultCallback);
}

function defaultCallback(err) {
  if (err) {
    throw err;
  }
}

function seq(functions) {
  assert(Array.isArray(functions), 'functions must be an array');

  return function doSeq() {
    var i = 0, n = functions.length;
    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();
    assert(typeof cb === 'function', 'last argument must be a function');
    doEachSeq.apply(null, args);

    function doEachSeq() {
      var fn = utils.makeFunc(functions[i++]);
      try {
        fn.apply(null, Array.prototype.slice.call(arguments).concat(next));
      } catch (err) {
        return cb(err);
      }

      function next(err) {
        if (err) {
          cb(err);
        } else if (i >= n) {
          cb.apply(null, Array.prototype.slice.call(arguments));
        } else {
          doEachSeq.apply(null, Array.prototype.slice.call(arguments, 1));
        }
      }
    }
  };
}

function par(functions) {
  assert(Array.isArray(functions), 'functions must be an array');
  return function doPar() {
    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();
    assert(typeof cb === 'function', 'last argument must be a function');

    invokeParFuncs(functions.length, functions, function invokeFunc(fn, next) {
      fn = utils.makeFunc(fn);
      fn.apply(null, args.slice().concat(next));
    }, cb);
  };
}

function map(concurrency, fn) {
  if (typeof concurrency !== 'number') {
    fn = concurrency;
    concurrency = DEFAULT_CONCURRENCY;
  }
  fn = utils.makeFunc(fn);
  return function doMap(array, cb) {
    assert(Array.isArray(array), 'first argument must be an array');
    assert(typeof cb === 'function', 'last argument must be a function');
    invokeParFuncs(concurrency, array, fn, cb);
  };
}

function invokeParFuncs(concurrency, array, invokeFunction, cb) {
  var i = 0, n = array.length;
  var finished = 0;
  var results = [];
  var done = false;

  while (i < n && i < concurrency) {
    if (!doEachParallel(i++)) {
      break;
    }
  }

  function doEachParallel(index) {
    try {
      invokeFunction(array[index], next);
    } catch (err) {
      return reportError(err);
    }
    return true;

    function next(err, result) {
      if (done) {
        return;
      } else if (err) {
        return reportError(err);
      }

      if (arguments.length > 2) {
        results[index] = Array.prototype.slice.call(arguments, 1);
      } else {
        results[index] = result;
      }

      if (++finished === n) {
        done = true;
        cb(null, results);
      } else if (i < n) {
        doEachParallel(i++)
      }
    }
  }

  function reportError(err) {
    if (!done) {
      done = true;
      cb(err);
    }
    return false;
  }
}
