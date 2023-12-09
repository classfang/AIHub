export const scrollToBottom = (el: Element) => {
  setTimeout(() => {
    el.scrollTop = el.scrollHeight
  }, 0)
}
