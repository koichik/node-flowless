'use strict';

var fs = require('fs');
var flowless = require('../index');
var extras = flowless.extras;

var context = {};
flowless.runSeq([
  [fs.readdir, __dirname],
  extras.bindFirst(context, 'fileNames'),
  flowless.map(function(file, cb) {
    fs.stat(__dirname + '/' + file, cb);
  }),
  extras.array.reduce(function(sizes, stat, i) {
    sizes[context.fileNames[i]] = stat.size;
    return sizes;
  }, {})
], function(err, sizes) {
  if (err) throw err;
  console.dir(sizes);
});
