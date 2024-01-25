/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'markdown-it-mathjax3' {
  import MarkdownIt from 'markdown-it'
  const markdownItMathjax3: MarkdownIt.PluginSimple
  export default markdownItMathjax3
}

type BigModelProvider = 'OpenAI' | 'Spark' | 'ERNIEBot' | 'Tongyi' | 'Gemini'
type TranslatorProvider = 'Youdao'
type AssistantType = 'chat' | 'drawing'
type ChatMsgType = 'text' | 'img'
type ChatRole = 'user' | 'assistant' | 'system'
type CalendarReportType = 'day' | 'week' | 'month' | 'year'
type MiniProgramType = 'webview' | 'local'
type AppNotificationType = 'info' | 'warn' | 'error'
type ChatPluginType = 'function'
// https://json-schema.org/understanding-json-schema/reference/type
type ChatPluginParameterType = 'string' | 'number' | 'integer' | 'object' | 'array' | 'boolean'

interface Assistant {
  // 通用
  id: string
  type: AssistantType
  name: string
  provider: BigModelProvider
  model: string
  createTime: number
  lastUpdateTime: number
  chatMessageList: ChatMessage[]

  // 对话
  instruction: string
  inputMaxTokens: number
  maxTokens: number
  contextSize: number

  // 生图
  imageSize: string
  imageQuality: string
  imageStyle: string
}

interface BaseMessage {
  role: ChatRole
  content: string
  image?: string
}

interface ChatMessage extends BaseMessage {
  id: string
  type: ChatMsgType
  createTime: number
}

interface ChatMessageSet {
  id: string
  name: string
  provider: BigModelProvider
  model: string
  chatMessageList: ChatMessage[]
  createTime: number
}

interface KnowledgeBase {
  id: string
  name: string
  description: string
  redisConfig: RedisConfig
  indexName: string
  createTime: number
  lastUpdateTime: number
}

interface RedisConfig {
  url: string
  username?: string
  password?: string
}

interface KnowledgeFile {
  key: string
  text: string
  createTime: number
  updateTime: number
}

interface CalendarReport {
  id: string
  content: string
  createTime: number
  updateTime: number
  startTime: number
  endTime: number
}

interface MiniProgram {
  type: MiniProgramType
  name: string
  url: string
}

interface AppNotification {
  type: AppNotificationType
  content: string
  createTime: number
}

interface ChatPlugin {
  id: string
  type: ChatPluginType
  description: string
  name: string
  code: string
  parameters: ChatPluginParameter[]
  createTime: number
  lastUpdateTime: number
}

interface ChatPluginParameter {
  name: string
  type: ChatPluginParameterType
  description: string
}
