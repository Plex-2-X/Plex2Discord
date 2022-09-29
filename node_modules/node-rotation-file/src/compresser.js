const { createReadStream, createWriteStream } = require('fs')
const { pipeline: pipelineCb } = require('stream')
const { promisify } = require('util')
const { createGzip, createBrotliCompress } = require('zlib')

const pipeline = promisify(pipelineCb)

const COMPRESSION_TYPES = {
  gzip: {
    createCompressStream: createGzip,
    extention: 'gz'
  },
  brotli: {
    createCompressStream: createBrotliCompress,
    extention: 'br'
  }
}

/**
 * Compress a file.
 * @param {string} src - The source path.
 * @param {string} type - The compression type.
 * @returns {string} The compressed dist file path.
 */
async function compressFile (src, type) {
  const { createCompressStream, extention } = COMPRESSION_TYPES[type]
  const dist = `${src}.${extention}`
  await pipeline(
    createReadStream(src),
    createCompressStream(),
    createWriteStream(dist)
  )
  return dist
}

module.exports = {
  COMPRESSION_TYPES,
  compressFile
}
