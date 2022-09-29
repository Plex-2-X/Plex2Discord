const { rename, unlink } = require('fs').promises
const path = require('path')
const { getArchiveName, getArchivePattern } = require('./archives.js')
const { getOldestFiles } = require('./history.js')
const { compressFile } = require('./compresser.js')

/**
 * Make a rotation file stream for a RotationFileStream instance.
 * The context of this function must be binded on a RotationFileStream instance.
 * @returns {void}
 */
async function makeStreamRotation () {
  this.rotating = true

  this.emit('close', async () => {
    try {
      const archiveName = getArchiveName(this.path, this.birthtime, this.compressType)
      const archiveInit = path.resolve(this.archivesDirectory, archiveName)
      let archivePath = archiveInit
      await rename(this.path, archiveInit)

      if (this.compressType) {
        archivePath = await compressFile(archiveInit, this.compressType)
        await unlink(archiveInit)
      }

      if (this.maxArchives) {
        const archivePattern = getArchivePattern(this.path, this.compressType)
        const archives = await getOldestFiles(this.archivesDirectory, archivePattern, this.maxArchives)
        await Promise.all(archives.map(unlink))
      }

      this.rotating = false
      this.emit('archive', { type: this.compressType || 'raw', path: archivePath })
      this.emit('open')
    } catch (err) {
      this.emit('error', err)
    }
  })
}

module.exports = {
  makeStreamRotation
}
