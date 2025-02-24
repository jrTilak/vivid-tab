/**
 * Taken from @jrtilak/lazykit
 * See more about this method: https://lazykit.jrtilak.dev/docs/functions/objects/filterObj
 */

/**
 * Same as Array.prototype.filter, but for objects.
 **/
const filterObj = <T extends Record<string, unknown>>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean,
): Partial<T> => {
  const result: Partial<T> = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (predicate(obj[key], key)) {
        result[key] = obj[key] // Include the property if the predicate returns true
      }
    }
  }

  return result
}

export default filterObj
