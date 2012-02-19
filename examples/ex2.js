'use strict';

var fs = require('fs');
var path = require('path');
var flowless = require('../index');
var file = path.join(__dirname, 'path3');

flowless.series([
  [fs.stat, file],
  function(stat, cb) {
    if (!stat.isFile()) {
      return cb(file +  ' is not a file');
    }
    fs.readFile(file, 'utf8', cb);
  },
  function(data, cb) {
    fs.writeFile(file, data.toUpperCase(), cb);
  }
], function(err, results) {
  if (err) {
    return console.log(err);
  }
  console.log('completed');
});
