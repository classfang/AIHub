import { defineStore } from 'pinia'

export const useCollectionSetStore = defineStore({
  id: 'collection-set',
  state: () => ({
    chatMessageSetList: [] as ChatMessageSet[]
  }),
  getters: {
    getStoreJson(): string {
      return JSON.stringify({
        chatMessageSetList: this.chatMessageSetList
      })
    }
  },
  actions: {
    setStoreFromJson(json: string) {
      let importFlag = false
      if (!json) {
        return importFlag
      }
      const collectionSetBackup = JSON.parse(json)
      if (collectionSetBackup.chatMessageSetList !== undefined) {
        this.chatMessageSetList = collectionSetBackup.chatMessageSetList
        importFlag = true
      }
      return importFlag
    }
  },
  persist: true
})
