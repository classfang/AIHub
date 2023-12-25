import { defineStore } from 'pinia'

export const useKnowledgeBaseStore = defineStore({
  id: 'knowledge-base',
  state: () => ({
    knowledgeBaseList: [] as KnowledgeBase[],
    // 不持久化
    currentKnowledgeBaseId: null as null | string
  }),
  getters: {
    getCurrentKnowledgeBase(): KnowledgeBase {
      return (
        this.knowledgeBaseList.find((a) => a.id === this.currentKnowledgeBaseId) ??
        ({} as KnowledgeBase)
      )
    },
    getStoreJson(): string {
      return JSON.stringify({
        knowledgeBaseList: this.knowledgeBaseList,
        currentKnowledgeBaseId: this.currentKnowledgeBaseId
      })
    }
  },
  actions: {
    setStoreFromJson(json: string) {
      let importFlag = false
      if (!json) {
        return importFlag
      }
      const knowledgeBaseBackup = JSON.parse(json)
      if (knowledgeBaseBackup.knowledgeBaseList !== undefined) {
        this.knowledgeBaseList = knowledgeBaseBackup.knowledgeBaseList
        importFlag = true
      }
      if (knowledgeBaseBackup.currentKnowledgeBaseId !== undefined) {
        this.currentKnowledgeBaseId = knowledgeBaseBackup.currentKnowledgeBaseId
        importFlag = true
      }
      return importFlag
    }
  },
  persist: {
    paths: ['knowledgeBaseList']
  }
})
