'use strict';

var flowless = require('../index');

flowless.runPar([
  function(cb) {
    setTimeout(cb.bind(null, null, 'a'), 300);
  },
  function(cb) {
    setTimeout(cb.bind(null, null, 'b'), 200);
  },
  function(cb) {
    setTimeout(cb.bind(null, null, 'c'), 100);
  }
], function(err, results) {
  if (err) throw err;
  console.dir(results);
});
