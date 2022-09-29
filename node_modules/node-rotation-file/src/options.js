const path = require('path')
const { COMPRESSION_TYPES } = require('./compresser.js')
const { SIZE_UNITS, TIME_UNITS } = require('./units.js')
const utils = require('./utils.js')

const DEFAULT_OPTIONS = {
  path: null,
  maxSize: '10m',
  maxTime: '1D',
  maxArchives: 10,
  archivesDirectory: null,
  compressType: 'gzip'
}

/**
 * @param {RotationFileStream:Options} options
 * @returns {object}
 */
function ensureOptions (options) {
  const opts = Object.assign({}, DEFAULT_OPTIONS, options)

  ensurePath(opts)
  ensureMaxSize(opts)
  ensureMaxTime(opts)
  ensureMaxArchives(opts)
  ensureArchivesDirectory(opts)
  ensureCompressType(opts)

  return opts
}

/**
 * @param {RotationFileStream:Options} options
 * @returns {void}
 * @throws {Error}
 */
function ensurePath (options) {
  if (typeof options.path !== 'string' || !options.path.match(utils.PATH_REGEX)) {
    throw new Error('The "path" argument must be a valid string path.')
  }
}

/**
 * @param {RotationFileStream:Options} options
 * @returns {void}
 * @throws {Error}
 */
function ensureMaxSize (options) {
  if (typeof options.maxSize === 'string') {
    Object.assign(options, {
      maxSize: utils.unfriendlize(options.maxSize, SIZE_UNITS)
    })
  }

  if (!utils.isNullOrPositiveInteger(options.maxSize)) {
    throw new Error(
      'The "maxSize" argument must be a valid string tag, a positive integer number or null.'
    )
  }
}

/**
 * @param {RotationFileStream:Options} options
 * @returns {void}
 * @throws {Error}
 */
function ensureMaxTime (options) {
  if (typeof options.maxTime === 'string') {
    Object.assign(options, {
      maxTime: utils.unfriendlize(options.maxTime, TIME_UNITS)
    })
  }

  if (!utils.isNullOrPositiveInteger(options.maxTime)) {
    throw new Error(
      'The "maxTime" argument must be a valid string tag, a positive integer number or null.'
    )
  }
}

/**
 * @param {RotationFileStream:Options} options
 * @returns {void}
 * @throws {Error}
 */
function ensureMaxArchives (options) {
  if (!utils.isNullOrPositiveInteger(options.maxArchives)) {
    throw new Error('The "maxArchives" argument must be a positive integer number or null.')
  }
}

/**
 * @param {RotationFileStream:Options} options
 * @returns {void}
 * @throws {Error}
 */
function ensureArchivesDirectory (options) {
  if (!options.archivesDirectory) {
    Object.assign(options, {
      archivesDirectory: path.dirname(options.path)
    })
  }

  if (typeof options.archivesDirectory !== 'string' || !options.archivesDirectory.match(utils.PATH_REGEX)) {
    throw new Error('The "archivesDirectory" argument must be a valid string path.')
  }
}

/**
 * @param {RotationFileStream:Options} options
 * @returns {void}
 * @throws {Error}
 */
function ensureCompressType (options) {
  if (options.compressType !== null && !Object.keys(COMPRESSION_TYPES).includes(options.compressType)) {
    throw new Error('The "compressType" argument must be a valid registered type.')
  }
}

module.exports = {
  DEFAULT_OPTIONS,
  ensureOptions,
  ensurePath,
  ensureMaxSize,
  ensureMaxTime,
  ensureMaxArchives,
  ensureArchivesDirectory,
  ensureCompressType
}
