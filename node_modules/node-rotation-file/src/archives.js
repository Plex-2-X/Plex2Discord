const path = require('path')
const { COMPRESSION_TYPES } = require('./compresser.js')

/**
 * Generate an name for an archive based on birthtime as milliseconds.
 * @param {string} src - The source file path.
 * @param {Date} birthtime - The file birthtime.
 * @returns {string}
 */
function getArchiveName (src, birthtime) {
  const srcExt = path.extname(src)
  const srcName = path.basename(src, srcExt)
  const timeTag = birthtime.getTime()
  return `${srcName}_${timeTag}${srcExt}`
}

/**
 * Generate a regex matcher for the archives.
 * @param {string} src - The source file path.
 * @param {string} compressType - The archives compression type.
 * @returns {RegExp}
 */
function getArchivePattern (src, compressType) {
  const srcExt = path.extname(src)
  const srcName = path.basename(src, srcExt)
  const compressExt = compressType
    ? ('.' + COMPRESSION_TYPES[compressType].extention)
    : ''
  return new RegExp(`^${srcName}_[0-9]{13}${srcExt}${compressExt}$`)
}

module.exports = {
  getArchiveName,
  getArchivePattern
}
