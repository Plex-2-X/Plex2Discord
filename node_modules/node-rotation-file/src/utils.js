const TAG_REGEX = /^([0-9]+)([a-zA-Z])$/
const PATH_REGEX = /^[a-zA-Z0-9@._/-]+$/

/**
 * Convert a value-unit tag to a unsafe integer value.
 * @param {string} tag - The value-unit tag.
 * @param {object} hash - The hash to make convertion.
 * @returns {number} Converted value as unsafe integer.
 * @throws {RangeError}
 */
function unfriendlize (tag, hash) {
  const match = tag.match(TAG_REGEX)

  if (!match || match.length < 3) {
    throw new RangeError(
      `The provided tag "${tag}" is not valid, it's must match with "${TAG_REGEX}".`
    )
  }

  if (!(match[2] in hash)) {
    throw new RangeError(
      `The provided tag "${tag}" is not valid, the unit must be (${Object.keys(hash).join(', ')})`
    )
  }

  return hash[match[2]] * parseInt(match[1])
}

/**
 * @param {any} value
 * @returns {boolean}
 */
function isNullOrPositiveInteger (value) {
  return value === null || (Number.isInteger(value) && value >= 0)
}

module.exports = {
  TAG_REGEX,
  PATH_REGEX,
  unfriendlize,
  isNullOrPositiveInteger
}
