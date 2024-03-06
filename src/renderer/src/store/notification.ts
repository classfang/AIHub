import { defineStore } from 'pinia'

export const useNotificationStore = defineStore({
  id: 'notification',
  state: () => ({
    notifications: [] as AppNotification[]
  }),
  actions: {
    info(msg: string) {
      this.notifications.unshift({
        type: 'info',
        createTime: new Date().getTime(),
        content: msg
      })
    },
    warn(msg: string) {
      this.notifications.unshift({
        type: 'warn',
        createTime: new Date().getTime(),
        content: msg
      })
    },
    error(msg: string) {
      this.notifications.unshift({
        type: 'error',
        createTime: new Date().getTime(),
        content: msg
      })
    }
  },
  persist: false
})
