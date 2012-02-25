# node-flowless - Less but better control-flow library

flowless is not a flawless :)

## Examples

Here is the same example as [asyncblock](https://github.com/scriby/asyncblock).

```javascript
var fs = require('fs');
var flowless = require('flowless');

flowless.runSeq([
  flowless.par([
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
```

## Installation

    $ npm install flowless

## Features

### Easily nestable

flowless provides two kind of API for control-flow.

 * Runs asynchronous functions immediately:
   * `runSeq()`, `runPar()` and `runMap()`.
 * Returns a function which runs asynchronous functions:
   * `seq()`, `par()` and `map()`.

The former is similar to the function that other control-flow modules
(e.g. [Async](https://github.com/caolan/async)) provide.

On the other hand, the latter returns a function which runs asynchronous
functions, rather than running them immediately.
Because the returned function is also an asynchronous style,
they are easily nestable.

Example:

```javascript
var flowless = require('flowless');

flowless.runSeq([
  function one() {...},
  function two() {...},

  flowless.par([
    flowless.seq([
      function three() {...},
      function four() {...},
    ]),

    flowless.seq([
      function five() {...},
      function six() {...},
    ])
  ]),

  flowless.map(
    function seven() {...}
  ),

  function eight() {...}

], function allDone() {...}
);
```

The structure of this program reflects a control-flow directly.

                                        +-> seven -+
                 +-> three --> four -+  +-> seven -+
    one --> two -+                   +--+-> seven -+-> eight --> allDone
                 +-> five  --> six  -+  +-> seven -+
                                              ...

### Easily composable

Example:

```javascript
function foo() {
  return flowless.seq([
    function(...) {...},
    function(...) {...},
    ...
  ]);
}
```

```javascript
function bar() {
  return flowless.par([
    function(...) {...},
    function(...) {...},
    ...
  ]);
}
```

You can put them together as follows.

```javascript
flowless.runSeq([
  foo(),
  bar()
], function(err, result) {
  ...
});
```

### Exception handling in the same way as an error.

When an error is passed to a callback.

```javascript
flowless.runSeq([
  function one(cb) {
    cb(null);
  },
  function two(cb) {
    cb(new Error('two faild')); // Error is passed
  },
  function three(cb) {
    assert.fail('unreachable');
  }
], function allDone(err, result) {
  console.log(err); // [Error: two faild]
});
```

When an exception is thrown.

```javascript
flowless.runSeq([
  function one(cb) {
    cb(null);
  },
  function two(cb) {
    throw new Error('two faild'); // Error is thrown
  },
  function three(cb) {
    assert.fail('unreachable');
  }
], function allDone(err, result) {
  console.log(err); // [Error: two faild]
});
```

In both of the cases, `three()` is not called and `Error` is passed to
the `allDone()`. 

## Core API

### flowless.seq(functions)

Returns an asynchronous style function which runs functions in sequential.

 * Arguments
   * `functions`: An array of functions.
     Each function can be an array as a *Function Template* that is
     explained below.
 * Returns
   * An asynchronous style function which runs `functions` in sequential.

Returned function is:

    function([args...,] cb)

 * Arguments
   * `args`: Zero or more arguments that will be passed to first element
     of `functions`.
   * `cb`: A callback function.

If some function in the sequential throws an exception or passes an error
to its callback, no more functions are invoked and `cb` is immediately
called with the exception or error.

### flowless.runSeq(functions [, cb])

Runs functions in sequential immediately.

 * Arguments
   * `functions`: An array of functions.
     Each function can be an array as a *Function Template* that is
     explained below.
   * `cb`: A callback function.

Example:

```javascript
flowless.runSeq([
  function(cb) {
    ...
  },
  function(cb) {
    ...
  }
], function(err, result) {
  ...
});
```

is equivalent of:

```javascript
var fn = flowless.seq([
  function(cb) {
    ...
  },
  function(cb) {
    ...
  }
]);
fn(function(err, result) {
  ...
});
```

### flowless.par(functions)

Returns an asynchronous style function which runs functions in parallel.

If any of the functions throw an exception or pass an error to its callback,
the main callback is immediately called with the value of the error.

 * Arguments
   * `functions`: An array of functions.
     Each function can be an array as a *Function Template* that is
     explained below.
 * Returns
   * An asynchronous style function which runs `functions` in parallel.

Returned function is:

    function([args...,] cb)

 * Arguments
   * `args`: Zero or more arguments that will be passed to all element
     of `functions`.
   * `cb`: A callback function.

If any functions in the parallel throw an exception or pass an error
to its callback, `cb` is immediately called with the exception or error.

### flowless.runPar(functions [, cb])

Runs functions in parallel immediateley.

 * Arguments
   * `functions`: An array of functions.
     Each function can be an array as a *Function Template* that is
     explained below.
   * `cb`: A callback function.

Example:

```javascript
flowless.runPar([
  function(cb) {
    ...
  },
  function(cb) {
    ...
  }
], function(err, result) {
  ...
});
```

is equivalent of:

```javascript
var fn = flowless.par([
  function(cb) {
    ...
  },
  function(cb) {
    ...
  }
]);
fn(function(err, result) {
  ...
});
```

### flowless.map([concurrency,] fn)

Returns an asynchronous style function which produces a new array of values
by mapping each value in the given array through the returned function.

 * Arguments
   * `concurrency`: A number of how many functions should be run in parallel.
     Defaults to `10`.
   * `fn`: An asynchronous function which takes an element of the array
     as a first argument. 
     It can be an array as a *Function Template* that is explained below.
 * Returns
   * An asynchronous style function which produces a new array of values
     by mapping each value in the given `array` through `fn`.

`fn` should be:

    function(element, cb)

 * Arguments
   * `element`: an element of `array` passed to returned function.
   * `cb`: A callback function.

Returned function is:

    function(array, cb)

 * Arguments
   * `array`: An array of values.
   * `cb`: A callback function.

If any functions in the parallel throw an exception or pass an error
to its callback, `cb` is immediately called with the exception or error.

### flowless.runMap([concurrency,] array, fn [, cb])

Produces a new array of values by mapping each value in the given array
through the returned function.

 * Arguments
   * `concurrency`: A number of how many functions should be run in parallel.
     Defaults to `10`.
   * `array`: an array of values.
   * `fn`: An asynchronous function.
     It can be an array as a *Function Template* that is explained below.
   * `cb`: A callback function.

`fn` should be:

    function(element, cb)

 * Arguments
   * `element`: an element of `array`.
   * `cb`: A callback function.

Example:

```javascript
flowless.runMap(array, function(value, cb) {
  ...
}, function(err, result) {
  ...
});
```

is equivalent of:

```javascript
var fn = flowless.map(function(value, cb) {
    ...
});
fn(array, function(err, result) {
  ...
});
```

### Function Template

A Function template is an array representing a function and its argument.
The first or second element must be a function.
If the first element is not a function,
it will be used as a context (`this`) object.
The rest of elements will be used as the arguments of the function.
The array can include a special value,
`flowless.first`, `flowless.second` and `flowless.third`.
When the function is called,
they will be replaced with the actual argument of a corresponding position.

Example:

```javascript
flowless.seq([
  ...
  ['fs.readFile', flowless.first, 'utf8'],
  ...
]);
```

is equivalent of:

```javascript
flowless.seq([
  ...
  function(file, cb) {
    fs.readFile(file, 'utf8', cb);
  },
  ...
]);
```

## Extra API

### flowless.array

Provides asynchronous style functions to wrap a method of `Array`.
It takes the first argument as `this`.

Example:

```javascript
flowless.seq([
  ...
  flowless.array.join(':'),
  ...
]);
```

is equivalent of:

```javascript
flowless.seq([
  ...
  function(self, cb) {
    cb(null, self.join(':'));
  },
  ...
]);
```

### flowless.string

Provides asynchronous style functions to wrap a method of `String`.
It takes the first argument as `this`.

Example:

```javascript
flowless.seq([
  ...
  flowless.string.split(':'),
  ...
]);
```

is equivalent of:

```javascript
flowless.seq([
  ...
  function(self, cb) {
    cb(null, self.split(':'));
  },
  ...
]);
```

### flowless.generate(args...)

Returns a new asynchronous style function which passes a given arguments
to a callback.

 * Arguments
   * `args`: Values to be given in a callback.
 * Returns
   * An asynchronous style function which passes `args` to a callback.

Example:

```javascript
flowless.seq([
  flowless.generate(1, 2, 3),
  ...
]);
```

is equivalent of:

```javascript
flowless.seq([
  function(cb) {
    cb(null, 1, 2, 3);
  },
  ...
]);
```

### flowless.bindFirst(target, name)
### flowless.bindSecond(target, name)
### flowless.bindThird(target, name)

Returns a new asynchronous style function which binds an argument of the
specific position (first, second or third) to a property of a target object.

 * Arguments
   * `target`: An object that a value is bound.
   * `name`: A string of property name that a value is bound.
 * Returns
   * An asynchronous style function which binds an argument of the specific
     position to a property of `target` object.

Example:

```javascript
var context = {};
flowless.seq([
  ...
  flowless.bindFirst(context, 'name'),
  ...
]);
```

is equivalent of:

```javascript
var context = {};
flowless.seq([
  ...
  function(name, cb) {
    context['name'] = name;
    cb(null, name);
  },
  ...
]);
```

### flowless.flattenFirst()
### flowless.flattenSecond()
### flowless.flattenThird()

Returns a new asynchronous style function which flatten an argument of the
specific position (first, second or third).

 * Returns
   * An asynchronous style function which flatten an argument of the specific
     position. If an argument is not an array, it is passed to the callback.

Example:

```javascript
var context = {};
flowless.seq([
  flowless.generate(['foo', 'bar', 'baz']),
  flowless.flattenFirst(),
  function(foo, bar, baz, cb) { // foo: 'foo', bar: 'bar', baz: 'baz'
    ...
  }
]);
```

### flowless.makeAsync(fn)

Returns a new asynchronous style function which invokes a synchronous function
and passes the return value to a callback.

 * Arguments
   * `fn`: A synchronous function.
 * Returns
   * An asynchronous style function which invokes a synchronous function.

Example:

```javascript
flowless.seq([
  ...
  flowless.makeAsync(encodeURI),
  ...
]);
```

is equivalent of:

```javascript
flowless.seq([
  ...
  function(uri, cb) {
    cb(encodeURI(uri));
  }),
  ...
]);
```

## Acknowledgment

flowless is inspired by [Slide](https://github.com/isaacs/slide-flow-control).

# License

flowless is licensed under the [MIT license](http://www.opensource.org/licenses/mit-license.php).
