import { copyObj } from '@renderer/utils/object-util'
import { defaultCustomThemeMap, defaultFontSizeLevel } from '@renderer/utils/theme-util'
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
      // 字体大小 1-5
      fontSize: defaultFontSizeLevel,
      // 本地化
      locale: isZH() ? 'zh_CN' : 'en_US',
      // 网络代理
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
    stepFun: {
      apiKey: ''
    },
    deepSeek: {
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
        stepFun: this.stepFun,
        deepSeek: this.deepSeek,
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
      if (settingBackup.stepFun !== undefined) {
        this.stepFun = settingBackup.stepFun
        importFlag = true
      }
      if (settingBackup.deepSeek !== undefined) {
        this.deepSeek = settingBackup.deepSeek
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
    },
    checkBigModelConfig(provider: BigModelProvider) {
      let configErrorFlag = false
      switch (provider) {
        case 'OpenAI':
          if (!this.openAI.baseUrl || !this.openAI.key) {
            configErrorFlag = true
          }
          break
        case 'Ollama':
          if (!this.ollama.baseUrl) {
            configErrorFlag = true
          }
          break
        case 'Gemini':
          if (!this.gemini.baseUrl || !this.gemini.key) {
            configErrorFlag = true
          }
          break
        case 'ZhipuAI':
          if (!this.zhipuAI.apiKey) {
            configErrorFlag = true
          }
          break
        case 'Spark':
          if (!this.spark.appId || !this.spark.secret || !this.spark.key) {
            configErrorFlag = true
          }
          break
        case 'ERNIE':
          if (!this.ernie.apiKey || !this.ernie.secretKey) {
            configErrorFlag = true
          }
          break
        case 'Tongyi':
          if (!this.tongyi.apiKey) {
            configErrorFlag = true
          }
          break
        case 'Tiangong':
          if (!this.tiangong.appKey || !this.tiangong.appSecret) {
            configErrorFlag = true
          }
          break
        case 'MoonshotAI':
          if (!this.moonshotAI.apiKey) {
            configErrorFlag = true
          }
          break
        case 'StepFun':
          if (!this.stepFun.apiKey) {
            configErrorFlag = true
          }
          break
        case 'DeepSeek':
          if (!this.deepSeek.apiKey) {
            configErrorFlag = true
          }
          break
      }
      return configErrorFlag
    },
    getBigModelConfig(provider: BigModelProvider) {
      let otherOption = {}
      switch (provider) {
        case 'OpenAI':
          otherOption = {
            apiKey: this.openAI.key,
            baseURL: this.openAI.baseUrl
          }
          break
        case 'Ollama':
          otherOption = {
            baseURL: this.ollama.baseUrl
          }
          break
        case 'Gemini':
          otherOption = {
            apiKey: this.gemini.key,
            baseURL: this.gemini.baseUrl
          }
          break
        case 'ZhipuAI':
          otherOption = {
            apiKey: this.zhipuAI.apiKey
          }
          break
        case 'Spark':
          otherOption = {
            appId: this.spark.appId,
            secretKey: this.spark.secret,
            apiKey: this.spark.key
          }
          break
        case 'ERNIE':
          otherOption = {
            apiKey: this.ernie.apiKey,
            secretKey: this.ernie.secretKey
          }
          break
        case 'Tongyi':
          otherOption = {
            apiKey: this.tongyi.apiKey
          }
          break
        case 'Tiangong':
          otherOption = {
            apiKey: this.tiangong.appKey,
            secretKey: this.tiangong.appSecret
          }
          break
        case 'MoonshotAI':
          otherOption = {
            apiKey: this.moonshotAI.apiKey
          }
          break
        case 'StepFun':
          otherOption = {
            apiKey: this.stepFun.apiKey
          }
          break
        case 'DeepSeek':
          otherOption = {
            apiKey: this.deepSeek.apiKey
          }
          break
      }
      return otherOption
    }
  },
  persist: true
})
