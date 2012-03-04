'use strict';

exports.seq = seq;
exports.runSeq = runSeq;
exports.par= par;
exports.runPar= runPar;
exports.map = map;
exports.runMap = runMap;

var assert = require('assert');
var util = require('util');
var utils = require('./utils');

var DEFAULT_CONCURRENCY = 10;

function seq(functions) {
  return setupSeq(seq, functions);
}

function runSeq(functions, cb) {
  setupSeq(runSeq, functions)(cb || noop);
}

function par(functions) {
  return setupPar(par, functions);
}

function runPar(functions, cb) {
  setupPar(runPar, functions)(cb || noop);
}

function map(concurrency, fn) {
  if (typeof concurrency !== 'number') {
    fn = concurrency;
    concurrency = DEFAULT_CONCURRENCY;
  }
  return setupMap(map, concurrency, fn);
}

function runMap(concurrency, array, fn, cb) {
  if (typeof concurrency !== 'number') {
    cb = fn;
    fn = array;
    array = concurrency;
    concurrency = DEFAULT_CONCURRENCY;
  }
  setupMap(runMap, concurrency, fn)(array, cb || noop);
}

function noop() {
}

function setupSeq(ref, functions) {
  assert(Array.isArray(functions), 'functions must be an array');

  var operator = ref.name;
  var location = utils.getLocation(ref);

  return function doSeq() {
    var args = utils.toArray(arguments);
    var cb = args.pop();
    assert(typeof cb === 'function', 'last argument must be a function');

    invokeFunctions(operator, location, 1, functions,
                   function invokeFunc(fn, index, results, next) {
      fn = utils.makeFunc(fn);
      var params = index === 0 ? args : results[index - 1];
      if (!Array.isArray(params)) {
        params = [params];
      }
      params = params.concat(next);
      utils.debug('begin %s[%d] at %s with:',
                  operator, index, location, params);
      fn.apply(null, params);
    }, function invokeCallback(err, results) {
      if (err) {
        cb(err);
      } else {
        var args = results.length === 0 ? [] : results[results.length - 1];
        if (!Array.isArray(args)) {
          args = [args];
        }
        args.unshift(null); // err
        utils.debug('END %s at %s with:', operator, location, args);
        cb.apply(null, args);
      }
    });
  };
}

function setupPar(ref, functions) {
  assert(Array.isArray(functions), 'functions must be an array');

  var operator = ref.name;
  var location = utils.getLocation(ref);

  return function doPar() {
    var args = utils.toArray(arguments);
    var cb = args.pop();
    assert(typeof cb === 'function', 'last argument must be a function');

    invokeFunctions(operator, location, DEFAULT_CONCURRENCY, functions,
                   function invokeFunc(fn, index, results, next) {
      var params = args.slice().concat(next);
      utils.debug('begin %s[%d] at %s with:',
                  operator, index, location, params);
      fn = utils.makeFunc(fn);
      fn.apply(null, params);
    }, function invokeCallback(err, results) {
      if (err) {
        cb(err);
      } else {
        utils.debug('END %s at %s with:', operator, location, [err, results]);
        cb(null, results);
      }
    });
  };
}

function setupMap(ref, concurrency, fn) {
  fn = utils.makeFunc(fn);
  assert(typeof fn === 'function', 'last argument must be a function');

  var operator = ref.name;
  var location = utils.getLocation(ref);

  return function doMap(array, cb) {
    assert(Array.isArray(array), 'first argument must be an array');
    assert(typeof cb === 'function', 'last argument must be a function');

    invokeFunctions(operator, location, concurrency, array,
                   function invokeFunc(value, index, results, next) {
      if (fn.length === 2) {
        utils.debug('begin %s[%d] at %s with:',
                    operator, index, location, [value, next]);
        fn(value, next);
      } else if (fn.length === 3) {
        utils.debug('begin %s[%d] at %s with:',
                    operator, index, location, [value, index, next]);
        fn(value, index, next);
      } else {
        utils.debug('begin %s[%d] at %s with:',
                    operator, index, location, [value, index, array, next]);
        fn(value, index, array, next);
      }
    }, function invokeCallback(err, results) {
      if (err) {
        cb(err);
      } else {
        utils.debug('END %s at %s with:', operator, location, [err, results]);
        cb(null, results);
      }
    });
  };
}

function invokeFunctions(operator, location, concurrency, array,
                        invokeFunction, cb) {
  utils.debug('BEGIN %s at %s', operator, location);
  if (array.length === 0) {
    utils.debug('END %s at %s with:', location, []);
    deferCall(false, cb, [null, []]);
    return;
  }

  var i = 0, n = array.length;
  var finished = 0;
  var results = [];
  var done = false;

  var returned = false;
  while (i < n && i < concurrency) {
    if (!doEach(i++)) {
      break;
    }
  }
  returned = true;

  function doEach(index) {
    var returnedInner = false;
    try {
      invokeFunction(array[index], index, results, next);
    } catch (err) {
      utils.debug('failed %s[%d] at %s thrown:', operator, index, location,
                  util.isError(err) ? err.message : err);
      err = makeError(operator, index, location, 'thrown', err);
      return reportError(returnedInner, err);
    }
    returnedInner = true;
    return true;

    function next(err, result) {
      if (done) {
        return;
      } else if (err) {
        utils.debug('failed %s[%d] at %s with:', operator, index, location,
                    util.isError(err) ? err.message : err);
        err = makeError(operator, index, location, 'failed', err);
        return reportError(returnedInner, err);
      }

      var args = utils.toArray(arguments);
      utils.debug('end %s[%d] at %s with:',
                  operator, index, location, args);
      if (arguments.length === 2 && !Array.isArray(result)) {
        results[index] = result;
      } else {
        results[index] = args.slice(1); // err
      }

      if (++finished === n) {
        done = true;
        deferCall(returned & returnedInner, cb, [null, results]);
      } else if (i < n) {
        deferCall(returned & returnedInner, doEach, [i++]);
      }
    }
  }

  function reportError(returnedInner, err) {
    if (!done) {
      done = true;
      deferCall(returned & returnedInner, cb, [err]);
    }
    return false;
  }
}

function deferCall(returned, cb, args) {
  if (returned) {
    cb.apply(null, args);
  } else {
    process.nextTick(function() {
      cb.apply(null, args);
    });
  }
}

function makeError(operator, index, location, reason, cause) {
  var err = cause;
  if (!util.isError(cause) || !Array.isArray(err.history)) {
    var message = util.format('%s[%d] at %s %s:',
                              operator, index, location, reason, cause);
    err = new Error(message)
    err.cause = cause;
    err.history = [];
  }
  err.history.push({
    operator: operator,
    index: index,
    location: location,
    reason: reason
  });
  return err;
}
