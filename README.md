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

## Core API

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

### flowless.parallelMap(array, fn, cb)

Produces a new array of values by mapping each value in the given array
through the asynchronous function.

 * Arguments
   * `array`: an array of values.
   * `fn`: An asynchronous function.
     It can be an array passed to [makeFunc()](#flowless.makeFunc).
   * `cb`: A callback function.

### flowless.makeParallelMap(fn)

Returns a new function which produces a new array of values by mapping
each value in the given array through the asynchronous function.

 * Arguments
   * `fn`: An asynchronous function.
     It can be an array passed to [makeFunc()](#flowless.makeFunc).
 * Returns
   * A new function which produces a new array of values by mapping
     each value in the given `array` through `fn`.

         `function(array, cb)`

   * Arguments
     * `array`: an array of values.
     * `cb`: A callback function.

### flowless.makeFunc(template)

Returns a new function from a template.

 * Arguments
   * `template`: An array of function template.
     The first or second element must be a function.
     If the first element is not a function,
     it is used as a context (`this`) object.
     The rest of elements are used as a parameter of the function.
     The array can include a special value,
     `flowless.first`, `flowless.second` and `flowless.third`.
     When the returned function is called,
     they are replaced with the actual argument of a corresponding position.
 * Returns
   * A function which invokes the first or second element of `template`.

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

## Extras API

### flowless.array

Provides asynchronous style wrapper functions to wrap a method of `Array`.
It takes the first argument as `this`.

Example:

    flowless.serieas([
      ...
      flowless.array.join(':'),
      ...
    ], cb);

is equivalent of:

    flowless.serieas([
      ...
      function(self, cb) {
        cb(null, self.join(':'));
      },
      ...
    ], cb);

### flowless.string

Provides asynchronous style wrapper functions to wrap a method of `String`.
It takes the first argument as `this`.

Example:

    flowless.serieas([
      ...
      flowless.string.split(':'),
      ...
    ], cb);

is equivalent of:

    flowless.serieas([
      ...
      function(self, cb) {
        cb(null, self.split(':'));
      },
      ...
    ], cb);

### flowless.generate(args...)

Returns a new asynchronous style function which passes a given arguments
to a callback.

 * Arguments
   * `args`: Values to be given in a callback.
 * Returns
   * An asynchronous style function which passes `args` to a callback.

Example:

    flowless.serieas([
      flowless.generate(1, 2, 3),
      ...
    ], cb);

is equivalent of:

    flowless.serieas([
      function(cb) {
        cb(null, 1, 2, 3);
      },
      ...
    ], cb);

### flowless.makeAsync(fn)

Returns a new asynchronous style function which invokes a synchronous function
and passes the return value to a callback.

 * Arguments
   * `fn`: A synchronous function.
 * Returns
   * An asynchronous style function which invokes a synchronous function.

Example:

    flowless.serieas([
      ...
      flowless.makeAsync(function(a, b) {
        return a + b;
      }),
      ...
    ], cb);

is equivalent of:

    flowless.serieas([
      ...
      function(a, b, cb) {
        cb(a + b);
      }),
      ...
    ], cb);

## Acknowledgment

flowless is inspired by [Slide](https://github.com/isaacs/slide-flow-control).

# License

flowless is licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).
