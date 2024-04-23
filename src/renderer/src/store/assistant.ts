import { defaultAssistant } from '@renderer/utils/big-model/base-util'
import { nowTimestamp } from '@renderer/utils/date-util'
import { randomUUID } from '@renderer/utils/id-util'
import { copyObj } from '@renderer/utils/object-util'
import { defineStore } from 'pinia'

export const useAssistantStore = defineStore({
  id: 'assistant',
  state: () => ({
    // 自定义助手
    assistantList: [
      {
        ...copyObj(defaultAssistant),
        name: 'AI Bot',
        id: randomUUID(),
        createTime: nowTimestamp(),
        lastUpdateTime: nowTimestamp(),
        chatMessageList: new Array<ChatMessage>()
      }
    ] as Assistant[],
    currentAssistantId: null as null | string,
    // 虚拟助手，用于通用对话，每次会话是一个单独的虚拟助手
    virtualAssistantList: [
      {
        ...copyObj(defaultAssistant),
        name: '',
        id: randomUUID(),
        createTime: nowTimestamp(),
        lastUpdateTime: nowTimestamp(),
        chatMessageList: new Array<ChatMessage>()
      }
    ] as Assistant[],
    currentVirtualAssistantId: null as null | string
  }),
  getters: {
    getCurrentAssistant(): Assistant {
      return this.assistantList.find((a) => a.id === this.currentAssistantId) ?? ({} as Assistant)
    },
    getCurrentVirtualAssistant(): Assistant {
      return (
        this.virtualAssistantList.find((a) => a.id === this.currentVirtualAssistantId) ??
        ({} as Assistant)
      )
    },
    getStoreJson(): string {
      return JSON.stringify({
        assistantList: this.assistantList,
        currentAssistantId: this.currentAssistantId,
        virtualAssistantList: this.virtualAssistantList,
        currentVirtualAssistantId: this.currentVirtualAssistantId
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
      if (assistantBackup.virtualAssistantList !== undefined) {
        this.virtualAssistantList = assistantBackup.virtualAssistantList
        importFlag = true
      }
      if (assistantBackup.currentVirtualAssistantId !== undefined) {
        this.currentVirtualAssistantId = assistantBackup.currentVirtualAssistantId
        importFlag = true
      }
      return importFlag
    }
  },
  persist: true
})
