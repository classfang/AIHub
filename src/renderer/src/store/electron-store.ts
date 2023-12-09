const electronStore = {
  set: async (key: string, value: object): Promise<void> => {
    await electronStore.setStr(key, JSON.stringify(value))
  },
  get: async (key: string): Promise<object> => {
    const strData = await electronStore.getStr(key)
    return strData ? JSON.parse(strData) : strData
  },
  getList: async (key: string): Promise<object[]> => {
    const strData = await electronStore.getStr(key)
    return strData ? JSON.parse(strData) : []
  },
  setStr: async (key: string, value: string): Promise<void> => {
    await window.electron.ipcRenderer.invoke('set-store-value', key, value)
  },
  getStr: async (key: string): Promise<string> => {
    return await window.electron.ipcRenderer.invoke('get-store-value', key)
  },
  getStrSync: (key: string): string => {
    return window.electron.ipcRenderer.sendSync('get-store-value-sync', key)
  },
  delete: async (key: string): Promise<void> => {
    await window.electron.ipcRenderer.invoke('delete-store-value', key)
  }
}

export default electronStore
