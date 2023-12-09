import { defineStore } from 'pinia'

export const useUserStore = defineStore({
  id: 'user',
  state: () => ({
    avatar: '',
    nickname: 'Some one'
  }),
  getters: {
    getStoreJson(): string {
      return JSON.stringify({
        avatar: this.avatar,
        nickname: this.nickname
      })
    }
  },
  actions: {
    setStoreFromJson(json: string) {
      let importFlag = false
      if (!json) {
        return importFlag
      }
      const userBackup = JSON.parse(json)
      if (userBackup.avatar !== undefined) {
        this.avatar = userBackup.avatar
        importFlag = true
      }
      if (userBackup.nickname !== undefined) {
        this.nickname = userBackup.nickname
        importFlag = true
      }
      return importFlag
    }
  },
  persist: true
})
