import { defineStore } from 'pinia'

export const useNotificationStore = defineStore({
  id: 'notification',
  state: () => ({
    notifications: [] as AppNotification[]
  }),
  actions: {
    error(errMsg: string) {
      this.notifications.unshift({
        type: 'error',
        createTime: new Date().getTime(),
        content: errMsg
      })
    }
  },
  persist: false
})
