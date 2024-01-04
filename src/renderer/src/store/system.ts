import { defineStore } from 'pinia'
import dayjs from 'dayjs'

export const useSystemStore = defineStore({
  id: 'system',
  state: () => ({
    globalLoading: false,
    chatWindowLoading: false,
    knowledgeBaseWindowLoading: false,
    calendarLoading: false,
    dayKey: dayjs().format('YYYYMMDD')
  }),
  actions: {
    startDayKeyInterval() {
      // 刷新 dayKey，用于更具日期自动刷新组件
      setInterval(() => {
        this.dayKey = dayjs().format('YYYYMMDD')
      }, 1000)
    }
  },
  persist: false
})
