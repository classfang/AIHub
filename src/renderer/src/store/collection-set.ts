import { defineStore } from 'pinia'

export const useCollectionSetStore = defineStore({
  id: 'collection-set',
  state: () => ({
    collectionItemList: [] as CollectionItem[]
  }),
  getters: {
    getStoreJson(): string {
      return JSON.stringify({
        collectionItemList: this.collectionItemList
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
      if (collectionSetBackup.collectionItemList !== undefined) {
        this.collectionItemList = collectionSetBackup.collectionItemList
        importFlag = true
      }
      return importFlag
    }
  },
  persist: true
})
