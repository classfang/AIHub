import en_US from '@renderer/i18n/local/en_US.json'
import zh_CN from '@renderer/i18n/local/zh_CN.json'
import { createI18n } from 'vue-i18n'

const messages = {
  en_US,
  zh_CN
}

const i18n = createI18n({
  locale: 'en_US', // 设置当前语言类型
  fallbackLocale: 'en_US', // 设置兜底语言
  legacy: false, // 如果要支持compositionAPI，此项必须设置为false;
  globalInjection: true, // 全局注册$t方法
  messages
})

export default i18n
