export const nowTimestamp = () => {
  return new Date().getTime()
}

export const formatDateTime = (date: Date, format?: string) => {
  // 默认格式字符串
  format = format || 'YYYY-MM-DD HH:mm:ss'

  // 提取日期和时间组件
  const fullYear = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  // 替换格式字符串中的占位符
  return format
    .replace('YYYY', fullYear)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}
