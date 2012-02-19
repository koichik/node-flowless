'use strict';

var fs = require('fs');
var flowless = require('../index');

flowless.series([
  [fs.readdir, __dirname],
  flowless.makeAsync(function(files) {
    return files.filter(function(filename) {
      return /\.js$/.test(filename);
    }).map(function(filename) {
      return __dirname + '/' + filename;
    });
  }),
  flowless.makeParallelMap([fs.readFile, flowless.first, 'utf8'])
], function(err, files) {
  if (err) throw err;
  files.forEach(function (file) {
    console.log('-----');
    console.log(file);
  });
});

