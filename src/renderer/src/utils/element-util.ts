export const scrollToBottom = (el: Element, callback?: () => void) => {
  setTimeout(() => {
    el.scrollTop = el.scrollHeight
    if (callback) {
      callback()
    }
  }, 0)
}
