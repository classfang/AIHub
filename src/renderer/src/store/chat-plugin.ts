import { defineStore } from 'pinia'

export const useChatPluginStore = defineStore({
  id: 'chat-plugin',
  state: () => ({
    chatPluginList: [] as ChatPlugin[],
    // 不持久化
    currentChatPluginId: null as null | string
  }),
  getters: {
    getCurrentChatPlugin(): ChatPlugin {
      return (
        this.chatPluginList.find((a) => a.id === this.currentChatPluginId) ?? ({} as ChatPlugin)
      )
    },
    getStoreJson(): string {
      return JSON.stringify({
        chatPluginList: this.chatPluginList
      })
    }
  },
  actions: {
    setStoreFromJson(json: string) {
      let importFlag = false
      if (!json) {
        return importFlag
      }
      const chatPluginBackup = JSON.parse(json)
      if (chatPluginBackup.chatPluginList !== undefined) {
        this.chatPluginList = chatPluginBackup.chatPluginList
        importFlag = true
      }
      return importFlag
    }
  },
  persist: {
    paths: ['chatPluginList']
  }
})
