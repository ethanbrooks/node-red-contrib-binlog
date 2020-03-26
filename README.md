# node-red-contrib-binlog

## Build

Use a current version of [Node.js](https://nodejs.org/en/). Install the dependencies, run the tests, and compile the TypeScript code with [yarn](https://yarnpkg.com/lang/en/) or npm:

```shell
$ yarn
$ yarn test
$ yarn build
```

## Releasing to NPM

Commit all changes and run the following:

```shell
$ npm login
$ npm version <update_type>
$ npm publish
```

… where `<update_type>` is one of `patch`, `minor`, or `major`. This will update the `package.json`, and create a tagged Git commit with the version number.


- - -

Copyright Ethan Brooks, 2019

