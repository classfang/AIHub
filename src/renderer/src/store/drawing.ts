import { randomUUID } from '@renderer/utils/id-util'
import { defineStore } from 'pinia'

export const useDrawingStore = defineStore({
  id: 'drawing',
  state: () => ({
    drawingTaskList: [] as DrawingTask[],
    currentTaskId: null as null | string
  }),
  getters: {
    getCurrentTask(): DrawingTask {
      if (this.drawingTaskList.length === 0) {
        this.drawingTaskList.push({
          id: randomUUID(),
          provider: 'OpenAI',
          model: 'dall-e-3',
          imageList: [],
          prompt: '',
          options: { size: '1024x1024', style: 'vivid', quality: 'standard' }
        })
      }
      if (this.currentTaskId === null) {
        this.currentTaskId = this.drawingTaskList[0].id
        return this.drawingTaskList[0]
      }

      const currentTask = this.drawingTaskList.find((a) => a.id === this.currentTaskId)
      if (currentTask == undefined) {
        this.currentTaskId = this.drawingTaskList[0].id
        return this.drawingTaskList[0]
      }

      return currentTask
    },
    getStoreJson(): string {
      return JSON.stringify({
        drawingTaskList: [] as DrawingTask[]
      })
    }
  },
  actions: {
    setStoreFromJson(json: string) {
      let importFlag = false
      if (!json) {
        return importFlag
      }
      const backupData = JSON.parse(json)
      if (backupData.drawingTaskList !== undefined) {
        this.drawingTaskList = backupData.drawingTaskList
        importFlag = true
      }
      return importFlag
    }
  },
  persist: true
})
