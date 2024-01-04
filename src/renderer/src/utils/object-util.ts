export const copyObj = (obj: object | undefined) => {
  if (!obj) {
    return obj
  }
  return JSON.parse(JSON.stringify(obj))
}

export const copyFields = (source: object, target: object) => {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key]
    }
  }
}
