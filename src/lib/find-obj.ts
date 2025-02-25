type Return<T> = {
  result: T[keyof T] | undefined
  objKey: keyof T | undefined
}

const findObjValue = <T extends Record<string, unknown>>(
  obj: T,
  value: string,
): Return<T> => {
  let result: T[keyof T] | undefined = undefined
  let objKey: keyof T | undefined = undefined

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (obj[key] === value) {
        result = obj[key] // Include the property if the predicate returns true
        objKey = key
      }
    }
  }

  return { result, objKey }
}

export default findObjValue
