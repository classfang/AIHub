// 防抖
export const debounce = <T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay = 1000
): ((...args: Parameters<T>) => void) => {
  let debounceTimer: NodeJS.Timeout | null
  return (...args: Parameters<T>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流
export const throttle = <T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay = 1000
): ((...args: Parameters<T>) => void) => {
  let throttleTimer: NodeJS.Timeout | null
  return (...args: Parameters<T>): void => {
    if (throttleTimer) {
      return
    }
    throttleTimer = setTimeout(() => {
      fn.apply(this, args)
      throttleTimer = null
    }, delay)
  }
}
