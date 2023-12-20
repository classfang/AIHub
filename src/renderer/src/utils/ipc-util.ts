export const startDockBounce = () => {
  return window.electron.ipcRenderer.invoke('start-dock-bounce')
}

export const startDockAnimation = () => {
  return window.electron.ipcRenderer.invoke('start-dock-animation')
}

export const stopDockAnimation = () => {
  return window.electron.ipcRenderer.invoke('stop-dock-animation')
}

export const openCacheDir = () => {
  return window.electron.ipcRenderer.invoke('open-cache-dir')
}

export const setProxy = (proxy: string) => {
  return window.electron.ipcRenderer.invoke('set-proxy', proxy)
}

export const getAppVersion = () => {
  return window.electron.ipcRenderer.invoke('get-app-version')
}

export const saveFileByPath = (imagePath: string, fileName: string) => {
  return window.electron.ipcRenderer.invoke('save-file-by-path', imagePath, fileName)
}

export const saveFileByUrl = (url: string, fileName: string) => {
  return window.electron.ipcRenderer.invoke('save-file-by-url', url, fileName)
}

export const readLocalImageBase64 = (path: string) => {
  return window.electron.ipcRenderer.invoke('read-local-image-base64', path)
}

export const clipboardWriteText = (text: string) => {
  return window.electron.ipcRenderer.invoke('clipboard-write-text', text)
}

export const clearCacheFiles = (images: string[]) => {
  return window.electron.ipcRenderer.invoke('clear-cache-files', images)
}

export const getCacheFiles = (): Promise<{ name: string; data: string }[]> => {
  return window.electron.ipcRenderer.invoke('get-cache-files')
}

export const addCacheFiles = (cacheFiles: { name: string; data: string }[]): Promise<boolean> => {
  return window.electron.ipcRenderer.invoke('add-cache-files', cacheFiles)
}

export const selectFileAndRead = (filters: string[]) => {
  return window.electron.ipcRenderer.invoke('select-file-and-read', filters)
}

export const openDevTools = () => {
  return window.electron.ipcRenderer.invoke('open-dev-tools')
}

export const onMainWindowFocus = (action: () => void) => {
  window.electron.ipcRenderer.on('main-window-focus', () => {
    action()
  })
}
