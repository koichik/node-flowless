'use strict';

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
  functions = functions.slice();

  return function doSeries() {
    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();
    args.unshift(null); // err
    next.apply(null, args);

    function next(err) {
      if (err) {
        return cb(err);
      }
      var args = Array.prototype.slice.call(arguments);
      if (functions.length === 0) {
        return cb.apply(null, args);
      }
      var fn = functions.shift();
      if (Array.isArray(fn)) {
        fn = makeFunc(fn);
      }
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
