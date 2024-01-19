import { defineStore } from 'pinia'

export const useNotificationStore = defineStore({
  id: 'notification',
  state: () => ({
    notifications: [] as AppNotification[]
  }),
  persist: false
})
