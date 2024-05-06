// 初始化仓库
import { ipcMain } from 'electron'
import Store from 'electron-store'

export const initStore = () => {
  // 存储相关
  const store: Record<string, any> = new Store()
  ipcMain.handle('get-store-value', (_event, key) => {
    return store.get(key)
  })
  ipcMain.on('get-store-value-sync', (event, key) => {
    event.returnValue = store.get(key)
  })
  ipcMain.handle('set-store-value', (_event, key, value) => {
    store.set(key, value)
  })
  ipcMain.handle('delete-store-value', (_event, key) => {
    store.delete(key)
  })
  return store
}
