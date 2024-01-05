import { defineStore } from 'pinia'

export const useSettingStore = defineStore({
  id: 'setting',
  state: () => ({
    app: {
      // 主题模式：0自动 1明亮 2黑暗
      themeModel: 0,
      locale: 'en_US',
      proxy: ''
    },
    openAI: {
      baseUrl: 'https://api.openai.com/v1',
      key: ''
    },
    gemini: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      key: ''
    },
    spark: {
      appId: '',
      secret: '',
      key: ''
    },
    ernieBot: {
      apiKey: '',
      secretKey: ''
    },
    tongyi: {
      apiKey: ''
    },
    youdao: {
      appId: '',
      secret: ''
    },
    aiCalendar: {
      // 星期的开始：0周日 1周一
      weekStart: 1,
      bigModel: {
        provider: 'OpenAI' as BigModelProvider,
        model: 'gpt-4-32k'
      }
    }
  }),
  getters: {
    getStoreJson(): string {
      return JSON.stringify({
        app: this.app,
        openAI: this.openAI,
        gemini: this.gemini,
        spark: this.spark,
        ernieBot: this.ernieBot,
        tongyi: this.tongyi,
        youdao: this.youdao,
        aiCalendar: this.aiCalendar
      })
    }
  },
  actions: {
    setStoreFromJson(json: string) {
      let importFlag = false
      if (!json) {
        return importFlag
      }
      const settingBackup = JSON.parse(json)
      if (settingBackup.app !== undefined) {
        this.app = settingBackup.app
        importFlag = true
      }
      if (settingBackup.openAI !== undefined) {
        this.openAI = settingBackup.openAI
        importFlag = true
      }
      if (settingBackup.gemini !== undefined) {
        this.gemini = settingBackup.gemini
        importFlag = true
      }
      if (settingBackup.spark !== undefined) {
        this.spark = settingBackup.spark
        importFlag = true
      }
      if (settingBackup.ernieBot !== undefined) {
        this.ernieBot = settingBackup.ernieBot
        importFlag = true
      }
      if (settingBackup.tongyi !== undefined) {
        this.tongyi = settingBackup.tongyi
        importFlag = true
      }
      if (settingBackup.youdao !== undefined) {
        this.youdao = settingBackup.youdao
        importFlag = true
      }
      if (settingBackup.aiCalendar !== undefined) {
        this.aiCalendar = settingBackup.aiCalendar
        importFlag = true
      }
      return importFlag
    }
  },
  persist: true
})
