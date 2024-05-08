export const openInBrowser = (url: string | undefined) => {
  if (!url) {
    return
  }
  window.open(url)
}

export const isZH = (): boolean => {
  return !!navigator.languages.at(0)?.startsWith('zh')
}

export const getSelectedText = (defaultText: string) => {
  const text = window.getSelection()?.toString()
  return text == undefined || text == '' ? defaultText : text
}
