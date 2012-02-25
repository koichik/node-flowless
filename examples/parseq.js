'use strict';

var fs = require('fs');
var exec = require('child_process').exec;
var flowless = require('../index');

flowless.runSeq([
  [exec, 'whoami'],
  flowless.par([
    [exec, 'groups', flowless.first],
    [fs.readFile, __filename, 'utf8']
  ])
], function(err, results) {
  if (err) throw err;
  console.log('Groups: ' + results[0][0].trim());
  console.log('This file has ' + results[1].length + ' bytes');
});
