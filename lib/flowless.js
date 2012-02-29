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
var toArray = utils.toArray;
var getLocation = utils.getLocation

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
  var location = getLocation(ref);

  return function doSeq() {
    utils.debug('BEGIN %s at %s', operator, location);
    var i = 0, n = functions.length;
    var args = toArray(arguments);
    var cb = args.pop();
    assert(typeof cb === 'function', 'last argument must be a function');

    if (n === 0) {
      utils.debug('%s %s END', operator, location);
      deferCall(false, cb, [null]);
      return;
    }

    var returned = false;
    doEachSeq.apply(null, args);
    returned = true;

    function doEachSeq() {
      var fn = utils.makeFunc(functions[i]);
      var params = toArray(arguments).concat(next);
      utils.debug('begin %s[%d] at %s with:', operator, i, location, params);
      try {
        fn.apply(null, params);
      } catch (err) {
        utils.debug('failed %s[%d] at %s thrown:', operator, i, location,
                    util.isError(err) ? err.message : err);
        err = makeError('seq', i, location, 'thrown', err);
        deferCall(returned, cb, [err]);
        return;
      }

      function next(err) {
        if (err) {
          utils.debug('failed %s[%d] at %s with:', operator, i, location,
                      util.isError(err) ? err.message : err);
          err = makeError(operator, i, location, 'failed', err);
          deferCall(returned, cb, [err]);
          return;
        }
        var args = toArray(arguments);
        utils.debug('end %s[%d] at %s with :', operator, i, location, args);
        if (++i >= n) {
          utils.debug('END %s at %s', operator, location);
          deferCall(returned, cb, args);
          return;
        }
        doEachSeq.apply(null, args.slice(1));
      }
    }
  };
}

function setupPar(ref, functions) {
  assert(Array.isArray(functions), 'functions must be an array');

  var operator = ref.name;
  var location = getLocation(ref);

  return function doPar() {
    var args = toArray(arguments);
    var cb = args.pop();
    assert(typeof cb === 'function', 'last argument must be a function');

    invokeParFuncs(operator, location, functions.length, functions,
                   function invokeFunc(fn, next) {
      fn = utils.makeFunc(fn);
      fn.apply(null, args.slice().concat(next));
    }, cb);
  };
}

function setupMap(ref, concurrency, fn) {
  fn = utils.makeFunc(fn);
  assert(typeof fn === 'function', 'last argument must be a function');

  var operator = ref.name;
  var location = getLocation(ref);

  return function doMap(array, cb) {
    assert(Array.isArray(array), 'first argument must be an array');
    assert(typeof cb === 'function', 'last argument must be a function');
    invokeParFuncs(operator, location, concurrency, array, fn, cb);
  };
}

function invokeParFuncs(operator, location, concurrency, array,
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
    if (!doEachParallel(i++)) {
      break;
    }
  }
  returned = true;

  function doEachParallel(index) {
    utils.debug('begin %s[%d] at %s with:',
                operator, index, location, array[index]);
    var returnedInner = false;
    try {
      invokeFunction(array[index], next);
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
        deferCall(returned & returnedInner, cb, [null, results]);
      } else if (i < n) {
        deferCall(returned & returnedInner, doEachParallel, [i++]);
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
