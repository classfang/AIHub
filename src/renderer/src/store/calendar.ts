import { defineStore } from 'pinia'

export const useCalendarStore = defineStore({
  id: 'calendar',
  state: () => ({
    calendarYearReportList: [] as CalendarYearReport[]
  }),
  getters: {
    getStoreJson(): string {
      return JSON.stringify({
        calendarYearReportList: this.calendarYearReportList
      })
    }
  },
  actions: {
    setStoreFromJson(json: string) {
      let importFlag = false
      if (!json) {
        return importFlag
      }
      const calendarBackup = JSON.parse(json)
      if (calendarBackup.calendarYearReportList !== undefined) {
        this.calendarYearReportList = calendarBackup.calendarYearReportList
        importFlag = true
      }
      return importFlag
    }
  },
  persist: true
})
