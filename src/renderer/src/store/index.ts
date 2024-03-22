import electronStore from '@renderer/store/electron-store'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

const store = createPinia()
// pinia持久化
store.use(
  createPersistedState({
    storage: {
      setItem: (key: string, value: string) => {
        electronStore.setStr(key, value)
      },
      getItem: (key: string) => {
        return electronStore.getStrSync(key)
      }
    }
  })
)
export default store
