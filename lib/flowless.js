'use strict';

exports.seq = seq;
exports.runSeq = runSeq;
exports.par= par;
exports.runPar= runPar;
exports.map = map;
exports.runMap = runMap;

var assert = require('assert');
var utils = require('./utils');

var DEFAULT_CONCURRENCY = 10;

function seq(functions) {
  return setupSeq(utils.getLocation(seq), functions);
}

function runSeq(functions, cb) {
  setupSeq(utils.getLocation(runSeq), functions)(cb || noop);
}

function par(functions) {
  return setupPar(utils.getLocation(par), functions);
}

function runPar(functions, cb) {
  setupPar(utils.getLocation(runPar), functions)(cb || noop);
}

function map(concurrency, array, fn) {
  if (typeof concurrency !== 'number') {
    fn = array;
    array = concurrency;
    concurrency = DEFAULT_CONCURRENCY;
  }
  return setupMap(utils.getLocation(map), concurrency, functions, fn);
}

function runMap(concurrency, array, fn, cb) {
  if (typeof concurrency !== 'number') {
    cb = fn;
    fn = array;
    array = concurrency;
    concurrency = DEFAULT_CONCURRENCY;
  }
  setupMap(utils.getLocation(runMap), concurrency, fn)(array, cb || noop);
}

function noop() {
}

function setupSeq(location, functions) {
  assert(Array.isArray(functions), 'functions must be an array');

  return function doSeq() {
    utils.debug('BEGIN seq at %s', location);

    var i = 0, n = functions.length;
    var args = toArray(arguments);
    var cb = args.pop();
    assert(typeof cb === 'function', 'last argument must be a function');
    doEachSeq.apply(null, args);

    function doEachSeq() {
      var fn = utils.makeFunc(functions[i]);
      var params = toArray(arguments).concat(next);
      utils.debug('begin seq[%d] at %s with:', i, location, params);
      try {
        fn.apply(null, params);
      } catch (err) {
        utils.debug('failed seq[%d] at %s with:', i, location, err);
        cb(err);
        return;
      }

      function next(err) {
        if (err) {
          utils.debug('failed seq[%d] at %s with :', i, location, err);
          return cb(err);
        }
        var args = toArray(arguments);
        utils.debug('end seq[%d] at %s with :', i, location, args);
        if (++i >= n) {
          utils.debug('END seq at %s', location);
          cb.apply(null, args);
        } else {
          doEachSeq.apply(null, args.slice(1));
        }
      }
    }
  };
}

function setupPar(location, functions) {
  assert(Array.isArray(functions), 'functions must be an array');

  return function doPar() {
    var args = toArray(arguments);
    var cb = args.pop();
    assert(typeof cb === 'function', 'last argument must be a function');

    invokeParFuncs('par', location, functions.length, functions,
                   function invokeFunc(fn, next) {
      fn = utils.makeFunc(fn);
      fn.apply(null, args.slice().concat(next));
    }, cb);
  };
}

function setupMap(location, concurrency, fn) {
  fn = utils.makeFunc(fn);
  assert(typeof fn === 'function', 'last argument must be a function');

  return function doMap(array, cb) {
    assert(Array.isArray(array), 'first argument must be an array');
    assert(typeof cb === 'function', 'last argument must be a function');
    invokeParFuncs('map', location, concurrency, array, fn, cb);
  };
}

function invokeParFuncs(operator, location, concurrency, array,
                        invokeFunction, cb) {
  utils.debug('BEGIN %s at %s', operator, location);

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
    utils.debug('begin %s[%d] at %s with:',
                operator, index, location, array[index]);
    try {
      invokeFunction(array[index], next);
    } catch (err) {
      utils.debug('failed %s[%d] at %s with:',
                  operator, index, location, err);
      return reportError(err);
    }
    return true;

    function next(err, result) {
      if (done) {
        return;
      } else if (err) {
        utils.debug('failed %s[%d] at %s with:',
                    operator, index, location, err);
        return reportError(err);
      }

      var args = toArray(arguments);
      utils.debug('end %s[%d] at %s with:',
                  operator, index, location, args);
      if (arguments.length > 2) {
        results[index] = args.slice(1);
      } else {
        results[index] = result;
      }

      if (++finished === n) {
        done = true;
        utils.debug('END %s at %s with:', operator, location, results);
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

function toArray(args, start, end) {
  return Array.prototype.slice.call(args, start, end);
}
