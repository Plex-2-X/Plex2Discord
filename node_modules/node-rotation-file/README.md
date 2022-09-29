<h1 align="center">node-rotation-file</h1>
<p align="center">📄 Make rotation file with time or size.</p>
<p align="center">
  <a alt="Npm version" href="https://www.npmjs.com/package/node-rotation-file">
    <img src="https://img.shields.io/npm/v/node-rotation-file.svg" />
  </a>
  <a alt="Build Status" href="https://travis-ci.com/JuMastro/node-rotation-file">
    <img src="https://travis-ci.com/JuMastro/node-rotation-file.svg?branch=master" />
  </a>
  <a alt="Node requierement version" href="https://github.com/JuMastro/node-rotation-file/blob/master/package.json">
    <img src="https://img.shields.io/node/v/node-rotation-file.svg?longCache=true">
  </a>
  <a alt="Dependencies" href="https://github.com/JuMastro/node-rotation-file/blob/master/package.json">
    <img src="https://img.shields.io/david/JuMastro/node-rotation-file.svg" />
  </a>
  <a alt="Coverage" href="https://codeclimate.com/github/JuMastro/node-rotation-file/test_coverage">
    <img src="https://api.codeclimate.com/v1/badges/461a071228254ce1d786/test_coverage" />
  </a>
  <a alt="Maintainability" href="https://codeclimate.com/github/JuMastro/node-rotation-file/maintainability">
    <img src="https://api.codeclimate.com/v1/badges/461a071228254ce1d786/maintainability" />
  </a>
</p>

## Installation

Install with [`npm`](https://www.npmjs.com/):
```
$ npm i --save node-rotation-file
```
The minimum version of Node to use `node-rotation-file` is `v10.0.0`.

## Example

To read more information about node writable stream read : [documentation](https://nodejs.org/api/stream.html#stream_writable_streams).

```javascript
const RotationFileStream = require('node-rotation-file')

const stream = new RotationFileStream({
  path: './logs/output.log',
  maxTime: '1D',
  maxSize: '10m',
  maxArchives: 14,
  archivesDirectory: './logs/archives',
  compressType: 'gzip'
})

for (let i = 0; i < 1e5; ++i) {
  stream.write('Helloworld!\n')
}

stream.end('Last line...')
```

## Options

- ### path
    - **Type:** string

    - **Default:**

    The file path location.

- ### maxSize
    - **Type:** null | number | string

    - **Default:** "10m"

    The size as integer number, string tag or null.

- ### maxTime
    - **Type:** null | number | string

    - **Default:** "1D"

    The size as integer number, string tag or null.

- ### maxArchives
    - **Type:** null | number

    - **Default:** 14

    The number of file to keep in history.

- ### archivesDirectory
    - **Type:** string

    - **Default:** dirname(path)

    The directory location where archives are stored.

- ### compressType
    - **Type:** string

    - **Default:** "gzip"

    The compression type.

## Events

- ### init (once)
    - **Emittable:** false

    An event emitted once at stream initialization.

- ### error (once)
    - **Emittable:** true

    An event emitted once when an error is encountered/throwed. It's can be used to throw an error and ending the stream.

- ### rotate
    - **Emittable:** true

    An event emitted when stream will start a rotation. It's can be used to start a rotation.

- ### open
    - **Emittable:** false

    An event emitted when the stream start to openning a writing sub-stream.

- ### ready
    - **Emittable:** false

    An event emitted when the stream is ready to write.

- ### close
    - **Emittable:** false

    An event emitted when the stream start to closing the writing sub-stream.

- ### drain
    - **Emittable:** false

    An event emitted when the stream is ready to write again.

- ### finish
    - **Emittable:** false

    An event emitted after the stream closing fine.

## Dev dependencies

- [Jest](https://github.com/facebook/jest) Delightful JavaScript Testing.
- [Eslint](https://github.com/eslint/eslint) Javascript linter.
