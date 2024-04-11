import { defaultAssistant } from '@renderer/utils/big-model/base-util'
import { nowTimestamp } from '@renderer/utils/date-util'
import { randomUUID } from '@renderer/utils/id-util'
import { defineStore } from 'pinia'

export const useAssistantStore = defineStore({
  id: 'assistant',
  state: () => ({
    assistantList: [
      {
        ...defaultAssistant,
        name: 'AI Bot',
        id: randomUUID(),
        createTime: nowTimestamp(),
        lastUpdateTime: nowTimestamp(),
        chatMessageList: new Array<ChatMessage>()
      }
    ] as Assistant[],
    currentAssistantId: null as null | string
  }),
  getters: {
    getCurrentAssistant(): Assistant {
      return this.assistantList.find((a) => a.id === this.currentAssistantId) ?? ({} as Assistant)
    },
    getStoreJson(): string {
      return JSON.stringify({
        assistantList: this.assistantList,
        currentAssistantId: this.currentAssistantId
      })
    }
  },
  actions: {
    setStoreFromJson(json: string) {
      let importFlag = false
      if (!json) {
        return importFlag
      }
      const assistantBackup = JSON.parse(json)
      if (assistantBackup.assistantList !== undefined) {
        this.assistantList = assistantBackup.assistantList
        importFlag = true
      }
      if (assistantBackup.currentAssistantId !== undefined) {
        this.currentAssistantId = assistantBackup.currentAssistantId
        importFlag = true
      }
      return importFlag
    }
  },
  persist: true
})
