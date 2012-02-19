var fs = require('fs');
var path = require('path');
var flowless = require('../index');

flowless.series([
  flowless.makeParallel([
    [fs.readFile, path.join(__dirname, 'path1'), 'utf8'],
    [fs.readFile, path.join(__dirname, 'path2'), 'utf8']
  ]),
  function(results, cb) {
    fs.writeFile(path.join(__dirname, 'path3'), results.join(''), cb);
  },
  [fs.readFile, path.join(__dirname, 'path3'), 'utf8']
], function(err, result) {
  if (this.err) throw this.err;
  console.log(result);
  console.log('all done');
});
