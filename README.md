# node-flowless - Less but better control-flow library

flowless is not a flawless :)

## Examples

    var fs = require('fs');
    var flowless = require('flowless');

    flowless.series([
      flowless.makeParallel([
        [fs.readFile, 'path1', 'utf8'],
        [fs.readFile, 'path2', 'utf8']
      ]),
      function(results, cb) {
        fs.writeFile('path3', results.join(''), cb);
      },
      [fs.readFile, 'path3', 'utf8']
    ], function(err, result) {
      if (err) throw err;
      console.log(result);
      console.log('all done');
    });

## Installation

    $ npm install flowless

## API

### flowless.series(functions, cb)

Runs functions in series.

 * Arguments
   * `functions`: An array of functions.
     It can contain an array passed to [makeFunc()](#flowless.makeFunc).
   * `cb`: A callback function.

### flowless.makeSeries(functions)

Returns a new function which runs functions in series.

 * Arguments
   * `functions`: An array of functions.
     It can contain an array passed to [makeFunc()](#flowless.makeFunc).
 * Returns
   * A function which runs `functions` in series.

         `function([args...] cb)`

   * Arguments
     * `args`: Zero or more arguments that will be passed to first element
       of `functions`.
     * `cb`: A callback function.

### flowless.parallel(functions, cb)

Runs functions in parallel.

 * Arguments
   * `functions`: An array of functions.
     It can contain an array passed to [makeFunc()](#flowless.makeFunc).
   * `cb`: A callback function.

### flowless.makeParallel(functions)

Returns a new function which runs functions in parallel.

 * Arguments
   * `functions`: An array of functions.
     It can contain an array passed to [makeFunc()](#flowless.makeFunc).
 * Returns
   * A new function which runs `functions` in parallel.

         `function([args...] cb)`

   * Arguments
     * `args`: Zero or more arguments that will be passed to all element
       of `functions`.
     * `cb`: A callback function.

### flowless.makeFunc(template)

Returns a new function from a template.

 * Arguments
   * `template`: An array of function template. The first element must be
     a function. The rest of elements are used as a parameter of the function.
     The array can include a special value, `flowless.first`, `flowless.second`
     and `flowless.third`. When the returned function is called, they are
     replaced with the actual argument of a corresponding position.
 * Returns
   * A function which invokes the first element of `template`.

         `function([args,...] cb)`

   * Arguments
     * `args`: Zero or more arguments.
       If `template` includes a special value, it is replaced
       with `args` of a corresponding position.
     * `cb`: A callback function.
       It is added to the rest of `template`.

Example:

    var fn = flowless.makeFunc(['fs.readFile', flowless.first, 'utf8']);
    fn('foo.txt', cb);

is equivalent of:

    fs.readFile('foo.txt', 'utf8', cb);

## Acknowledgment

flowless is inspired by [Slide](https://github.com/isaacs/slide-flow-control).

# License

flowless is licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).