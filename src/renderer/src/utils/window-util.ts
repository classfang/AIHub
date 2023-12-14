export const openInBrowser = (url: string | undefined) => {
  if (!url) {
    return
  }
  window.open(url)
}
