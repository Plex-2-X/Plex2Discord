const { readdir, stat } = require('fs').promises
const path = require('path')

/**
 * Get the oldest files they are out of the limit to keep.
 * @param {string} dir - The directory path.
 * @param {RegExp} pattern - The pattern matcher.
 * @param {number} limit - The limit of keeping files.
 * @returns {Array<string>}
 */
async function getOldestFiles (dir, pattern, limit) {
  let files = await readdir(dir)
  files = files.filter((file) => file.match(pattern))
  files = await Promise.all(
    files.map(async (file) => {
      const filePath = path.resolve(dir, file)
      const fileStat = await stat(filePath)
      return { filePath, fileTime: fileStat.mtimeMs }
    })
  )
  return files.sort((a, b) => a.fileTime - b.fileTime)
    .splice(0, files.length - limit)
    .map(({ filePath }) => filePath)
}

module.exports = {
  getOldestFiles
}
