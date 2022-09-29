const fs = require('fs')
const path = require('path')
const { Writable } = require('stream')
const { ensureOptions } = require('./options.js')
const { makeStreamRotation } = require('./rotation.js')

/**
 * The RotationFileStream constructor options object.
 * @typedef {object} RotationFileStream~Options
 * @prop {string} path - The file path location.
 * @prop {null|number|string} [maxSize='10m'] - The size as integer number, string tag or null.
 * @prop {null|number|string} [maxTime='1D'] - The time as integer number, string tag or null.
 * @prop {null|number} [maxArchives=14] - The number of file to keep in history.
 * @prop {null|string} [archivesDirectory=dirname(path)] - The directory location where archives are stored.
 * @prop {null|string} [compressType='gzip'] - The type of compression.
 */

module.exports = class RotationFileStream extends Writable {
  /**
   * Check, init and set properties and listeners.
   * @param {RotationFileStream:Options} options - The {@link RotationFileStream:Options} options object.
   */
  constructor (options = {}) {
    const opts = ensureOptions(options)
    super(opts)

    this.path = opts.path
    this.compressType = opts.compressType
    this.maxSize = opts.maxSize
    this.maxTime = opts.maxTime
    this.maxArchives = opts.maxArchives
    this.archivesDirectory = opts.archivesDirectory

    this.birthtime = null
    this.size = null
    this.error = null
    this.writer = null
    this.queue = []

    this.writing = false
    this.rotating = false
    this.ending = false
    this.ended = false

    this.once('init', this._init)
    this.once('error', this._error)
    this.on('open', this._open)
    this.on('ready', this._drain)
    this.on('close', this._close)
    this.on('drain', this._drain)
    this.on('rotate', makeStreamRotation.bind(this))

    setImmediate(() => this.emit('init'))
  }

  /**
   * Check if the stream is writable.
   * @returns {boolean}
   */
  isWritable () {
    return this.writer !== null && !this.writing && !this.rotating
  }

  /**
   * Starts to ending the stream, and write a last chunk if once provided.
   * See: https://nodejs.org/api/stream.html#stream_writable_end_chunk_encoding_callback
   * @param {Buffer|string|any} chunk - Last chunk to add to queue.
   * @param {string} encoding - Chunk encoding for string chunks.
   * @param {Function} nextEvent - Function is called once the chunk has been written.
   * @returns {void}
   */
  end (chunk, encoding, nextEvent) {
    this.ending = true

    if (chunk) {
      this.prependOnceListener('close', () => {
        this.queue.push({ chunk, nextEvent })
        this._drain()
      })
    }

    this._drain()
  }

  /**
   * Run the timeout rotation.
   * @returns {void}
   */
  _createTimeoutRotation () {
    const limit = this.maxTime - (new Date().getTime() - this.birthtime.getTime())
    const timeout = setTimeout(() => this.emit('rotate'), limit)
    this.once('close', () => clearTimeout(timeout))
  }

  /**
   * Init the stream.
   * Prepares the directories of `path` and `archivesDirectory`.
   * @returns {void}
   */
  async _init () {
    await fs.promises.mkdir(path.dirname(this.path), { recursive: true })
    await fs.promises.mkdir(this.archivesDirectory, { recursive: true })
    this.emit('open')
  }

  /**
   * Open the sub-writer stream.
   * @returns {void}
   */
  _open () {
    const writer = fs.createWriteStream(this.path, { flags: 'a' })
    writer.once('error', (err) => this.emit('error', err))
    writer.once('open', async () => {
      const { birthtime, size } = await fs.promises.stat(this.path)
      Object.assign(this, { birthtime, size, writer, ended: false })
      this.emit('ready')

      if (this.maxTime) {
        this._createTimeoutRotation()
      }
    })
  }

  /**
   * Close the writer stream.
   * @param {Function} next - Event triggered after the closing of the writer.
   * @returns {void}
   */
  _close (next) {
    if (this.writer) {
      this.writer.on('finish', next)
      this.writer.end()
      this.writer = null
    } else {
      next()
    }
  }

  /**
   * Store an error and start the end of stream.
   * @param {Object|Error} err
   * @returns {void}
   */
  _error (err) {
    this.error = err
    this.end()
  }

  /**
   * Attempt to consume pending queued chunks.
   * @returns {void}
   */
  _drain () {
    if (!this.isWritable()) {
      return
    }

    if (!this.queue.length) {
      if (this.ending) {
        this.emit('close', () => {
          this.ending = false
          this.ended = true
          this.emit('finish')
        })
      }

      return
    }

    if (this.maxSize && this.maxSize <= this.size) {
      this.emit('rotate')
      return
    }

    this._consumePendingChunk()
  }

  _consumePendingChunk () {
    const item = this.queue.shift()
    this.writing = true
    this.writer.write(item.chunk, (err) => {
      this.writing = false
      this.size += item.chunk.length

      if (err) {
        this.emit('error', err)
      }

      if (item.nextEvent) {
        item.nextEvent(err)
      }

      this._drain()
    })
  }

  /**
   * Send chunk to the underlying resource.
   * See: https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback_1
   * @param {Buffer|string|any} chunk - Chunk to add to queue.
   * @param {string} encoding - Chunk encoding for string chunks.
   * @param {Function} nextEvent - Function is called once the chunk has been written.
   * @returns {void}
   */
  _write (chunk, encoding, nextEvent) {
    this.queue.push({ chunk, nextEvent })
    this._drain()
  }

  /**
   * Send chunks to the underlying resource.
   * Used when several chunks are written together, so they will be processed by group to be more efficient.
   * See: https://nodejs.org/api/stream.html#stream_writable_writev_chunks_callback
   * @param {Object[]} chunk - Chunks to add to queue.
   * @param {Function} nextEvent - Function is called once the chunks have been written.
   * @returns {void}
   */
  _writev (chunks, nextEvent) {
    Object.assign(chunks[chunks.length - 1], { nextEvent })
    this.queue = this.queue.concat(chunks)
    this._drain()
  }
}
