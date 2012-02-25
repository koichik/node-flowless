'use strict';

var fs = require('fs');
var path = require('path');
var flowless = require('../index');

var path1 = path.join(__dirname, 'path1');
var path2 = path.join(__dirname, 'path2');
var path3 = path.join(__dirname, 'path3');

flowless.runSeq([
  flowless.par([
    [fs.readFile, path1, 'utf8'],
    [fs.readFile, path2, 'utf8']
  ]),
  flowless.array.join(''),
  [fs.writeFile, path3, flowless.first],
  [fs.readFile, path3, 'utf8']
], function(err, result) {
  if (err) throw err;
  console.log(result);
  console.log('all done');
});
