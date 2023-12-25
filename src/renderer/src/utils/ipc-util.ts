import { copyObj } from '@renderer/utils/object-util'

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

export const langChainRedisAddFile = (
  redisConfig: RedisConfig,
  openaiConfig: {
    baseUrl: string
    key: string
  },
  indexName: string,
  text: string
) => {
  return window.electron.ipcRenderer.invoke(
    'lang-chain-redis-add-file',
    copyObj(redisConfig),
    copyObj(openaiConfig),
    indexName,
    text,
    fileKey
  )
}

export const langChainRedisListFile = (
  redisConfig: RedisConfig,
  indexName: string
): Promise<{
  files: KnowledgeFile[]
  docCount: number
}> => {
  return window.electron.ipcRenderer.invoke(
    'lang-chain-redis-list-file',
    copyObj(redisConfig),
    indexName
  )
}

export const langChainRedisDeleteFile = (
  redisConfig: RedisConfig,
  indexName: string,
  fileKey: string
) => {
  return window.electron.ipcRenderer.invoke(
    'lang-chain-redis-delete-file',
    copyObj(redisConfig),
    indexName,
    fileKey
  )
}

export const langChainRedisQuestion = (
  redisConfig: RedisConfig,
  openaiConfig: {
    baseUrl: string
    key: string
  },
  indexName: string,
  question: string
) => {
  return window.electron.ipcRenderer.invoke(
    'lang-chain-redis-question',
    copyObj(redisConfig),
    copyObj(openaiConfig),
    indexName,
    question
  )
}
