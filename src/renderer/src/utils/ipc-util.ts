export const startDockBounce = async () => {
  return await window.electron.ipcRenderer.invoke('start-dock-bounce')
}

export const openCacheDir = async () => {
  return await window.electron.ipcRenderer.invoke('open-cache-dir')
}

export const setProxy = async (proxy: string) => {
  return await window.electron.ipcRenderer.invoke('set-proxy', proxy)
}

export const getAppVersion = async () => {
  return await window.electron.ipcRenderer.invoke('get-app-version')
}

export const saveFileByPath = async (imagePath: string, fileName: string) => {
  return await window.electron.ipcRenderer.invoke('save-file-by-path', imagePath, fileName)
}

export const saveFileByUrl = async (url: string, fileName: string) => {
  return await window.electron.ipcRenderer.invoke('save-file-by-url', url, fileName)
}

export const readLocalImageBase64 = async (path: string) => {
  return await window.electron.ipcRenderer.invoke('read-local-image-base64', path)
}

export const clipboardWriteText = async (text: string) => {
  return await window.electron.ipcRenderer.invoke('clipboard-write-text', text)
}

export const clearCacheFiles = async (images: string[]) => {
  return await window.electron.ipcRenderer.invoke('clear-cache-files', images)
}

export const selectFileAndRead = async (filters: string[]) => {
  return await window.electron.ipcRenderer.invoke('select-file-and-read', filters)
}

export const onMainWindowFocus = (action: () => void) => {
  window.electron.ipcRenderer.on('main-window-focus', () => {
    action()
  })
}
