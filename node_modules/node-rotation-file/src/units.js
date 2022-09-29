/**
 * Size units pairs.
 * The value unit is byte.
 * -------------------------
 *  b -> byte(s)
 *  k -> kilo-byte(s)
 *  m -> mega-byte(s)
 *  g -> giga-byte(s)
 * -------------------------
 */
const SIZE_UNITS = {
  b: 1,
  k: 1024,
  m: 1024 ** 2,
  g: 1024 ** 3
}

/**
 * Time units pairs.
 * The value unit is millisecond.
 * ------------------------------
 *  s -> second(s)
 *  m -> minute(s)
 *  h -> hour(s)
 *  D -> day(s)
 *  M -> month(s)
 *  Y -> year(s)
 * ------------------------------
 */
const TIME_UNITS = {
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  D: 1000 * 60 * 60 * 24,
  M: 1000 * 60 * 60 * 24 * 30,
  Y: 1000 * 60 * 60 * 24 * 30 * 12
}

module.exports = {
  SIZE_UNITS,
  TIME_UNITS
}
