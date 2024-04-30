import { copyObj } from '@renderer/utils/object-util'
import { defaultCustomThemeMap } from '@renderer/utils/theme-util'
import { isZH } from '@renderer/utils/window-util'
import { defineStore } from 'pinia'

export const useSettingStore = defineStore({
  id: 'setting',
  state: () => ({
    app: {
      // 主题模式：0自动 1明亮 2黑暗 3自定义
      themeModel: 0,
      // 自定义主题样式表
      customThemeMap: copyObj(defaultCustomThemeMap),
      locale: isZH() ? 'zh_CN' : 'en_US',
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
    ernie: {
      apiKey: '',
      secretKey: ''
    },
    tongyi: {
      apiKey: ''
    },
    tiangong: {
      appKey: '',
      appSecret: ''
    },
    youdao: {
      appId: '',
      secret: ''
    },
    ollama: {
      baseUrl: 'http://localhost:11434'
    },
    moonshotAI: {
      apiKey: ''
    },
    zhipuAI: {
      apiKey: ''
    },
    baiduTranslation: {
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
        ernie: this.ernie,
        tongyi: this.tongyi,
        tiangong: this.tiangong,
        ollama: this.ollama,
        moonshotAI: this.moonshotAI,
        zhipuAI: this.zhipuAI,
        youdao: this.youdao,
        baiduTranslation: this.baiduTranslation,
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
      if (settingBackup.ernie !== undefined) {
        this.ernie = settingBackup.ernie
        importFlag = true
      }
      if (settingBackup.tongyi !== undefined) {
        this.tongyi = settingBackup.tongyi
        importFlag = true
      }
      if (settingBackup.tiangong !== undefined) {
        this.tiangong = settingBackup.tiangong
        importFlag = true
      }
      if (settingBackup.ollama !== undefined) {
        this.ollama = settingBackup.ollama
        importFlag = true
      }
      if (settingBackup.moonshotAI !== undefined) {
        this.moonshotAI = settingBackup.moonshotAI
        importFlag = true
      }
      if (settingBackup.zhipuAI !== undefined) {
        this.zhipuAI = settingBackup.zhipuAI
        importFlag = true
      }
      if (settingBackup.youdao !== undefined) {
        this.youdao = settingBackup.youdao
        importFlag = true
      }
      if (settingBackup.baiduTranslation !== undefined) {
        this.baiduTranslation = settingBackup.baiduTranslation
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
