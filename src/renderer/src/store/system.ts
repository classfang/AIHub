import { defineStore } from 'pinia'

export const useSystemStore = defineStore({
  id: 'system',
  state: () => ({
    globalLoading: false,
    chatWindowLoading: false
  }),
  persist: false
})
