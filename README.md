Express Butterfly Effect 🦋🌊
=============================

## Descirption

When a butterfly flaps its wings over some line of your code there ~~is~~ was no
telling of the consequence.

`express-butterfly-effect` takes one or more file changes and gives you back
which express endpoints might be affected by those changes

## Installation

```sh
npm i --save-dev express-butterfly-effect
```

## Usage

You can either use `express-butterfly-effect` as a command-line app or as a
library.

As a command-line app you would do:

```sh
./node_modules/.bin/express-butterfly-effect glob1 [glob2] change1 [change2]
```

You need to specify at least one glob and one change. Globs are used to find all
the `.js` files in your project.

A change is a path to a file, followed by a `:` and then a line number or line
range (`start-count`), possibly followed by other `:` plus line or
range.

For example:

```sh
./node_modules/.bin/express-butterfly-effect './lib/**/*.js' \
  ./lib/my-file.js:1:4-2:10 \
  ./lib/my-other-file.js:5

# my-file.js changed at lines 1, 4, 5 and 10
# my-other-file.js changed at line 5
```

To use `express-butterfly-effect` you need to:

```js
const computeEndpointImpact = require('express-butterfly-effect').default;
// Note: .default in the line above!

const impact = computeEndpointImpact(
  globs, // string[],
  targetFiles, // string[]
);

// impact is a string[], where each item looks like:
// 'get /api/users/1' (i.e. method + ' ' +  path)
```

## Pulling changes from git

```sh
./node_modules/express-butterfly-effect/git-changes.sh [base-branch]
```

If you omit `base-branch`, the script defaults to `master`. This script returns
the changes in the format you need to pass to `express-butterfly-effect`.

All together it would look something like:

```sh
./node_modules/.bin/express-butterfly-effect \
  './lib/**/*.js' \
  $(./node_modules/express-butterfly-effect/git-changes.sh)
```
