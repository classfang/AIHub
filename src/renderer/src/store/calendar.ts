import { defineStore } from 'pinia'

export const useCalendarStore = defineStore({
  id: 'calendar',
  state: () => ({
    yearReportList: [] as CalendarReport[],
    monthReportList: [] as CalendarReport[],
    dayReportList: [] as CalendarReport[]
  }),
  getters: {
    getStoreJson(): string {
      return JSON.stringify({
        yearReportList: this.yearReportList,
        monthReportList: this.monthReportList,
        dayReportList: this.dayReportList
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
      if (calendarBackup.yearReportList !== undefined) {
        this.yearReportList = calendarBackup.yearReportList
        importFlag = true
      }
      if (calendarBackup.monthReportList !== undefined) {
        this.monthReportList = calendarBackup.monthReportList
        importFlag = true
      }
      if (calendarBackup.dayReportList !== undefined) {
        this.dayReportList = calendarBackup.dayReportList
        importFlag = true
      }
      return importFlag
    }
  },
  persist: true
})
