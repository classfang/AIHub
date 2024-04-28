export const formatFileSize = (size: number): string => {
  if (!size || size === 0) return '0 Bytes'

  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const digitGroups = Math.floor(Math.log(size) / Math.log(1024))

  return parseFloat((size / Math.pow(1024, digitGroups)).toFixed(2)) + ' ' + units[digitGroups]
}
