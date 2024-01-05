import { defineStore } from 'pinia'
import dayjs from 'dayjs'

export const useSystemStore = defineStore({
  id: 'system',
  state: () => ({
    globalLoading: false,
    chatWindowLoading: false,
    knowledgeBaseWindowLoading: false,
    aiCalendarLoading: false,
    dayKey: dayjs().format('YYYYMMDD'),
    settingModal: {
      defaultActiveKey: '',
      visible: false
    }
  }),
  actions: {
    startDayKeyInterval() {
      // 刷新 dayKey，用于更具日期自动刷新组件
      setInterval(() => {
        this.dayKey = dayjs().format('YYYYMMDD')
      }, 1000)
    },
    openSettingModal(defaultActiveKey = '') {
      if (
        this.globalLoading ||
        this.chatWindowLoading ||
        this.knowledgeBaseWindowLoading ||
        this.aiCalendarLoading
      ) {
        return
      }
      this.settingModal.defaultActiveKey = defaultActiveKey
      this.settingModal.visible = true
    }
  },
  persist: false
})
