'use strict';

var fs = require('fs');
var flowless = require('../index');
var extras = flowless.extras;

flowless.runSeq([
  [fs.readdir, __dirname],
  extras.array.filter(function(filename) {
    return /\.js$/.test(filename);
  }),
  extras.array.map(function(filename) {
    return __dirname + '/' + filename;
  }),
  flowless.map([fs.readFile, flowless.first, 'utf8'])
], function(err, files) {
  if (err) throw err;
  files.forEach(function(file) {
    console.log('-----');
    console.log(file);
  });
});

