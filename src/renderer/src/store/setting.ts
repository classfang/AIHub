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
    }
  }),
  getters: {
    getStoreJson(): string {
      return JSON.stringify({
        app: this.app,
        openAI: this.openAI,
        spark: this.spark,
        ernieBot: this.ernieBot,
        tongyi: this.tongyi,
        youdao: this.youdao
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
      return importFlag
    }
  },
  persist: true
})
