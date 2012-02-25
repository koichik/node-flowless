'use strict';

var fs = require('fs');
var flowless = require('../index');

var context = {};
flowless.runSeq([
  [fs.readdir, __dirname],
  flowless.bindFirst(context, 'fileNames'),
  flowless.map(function(file, cb) {
    fs.stat(__dirname + '/' + file, cb);
  }),
  flowless.array.reduce(function(sizes, stat, i) {
    sizes[context.fileNames[i]] = stat.size;
    return sizes;
  }, {})
], function(err, sizes) {
  if (err) throw err;
  console.dir(sizes);
});
