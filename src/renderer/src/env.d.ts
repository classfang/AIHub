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

type PageName =
  | 'chat'
  | 'chat-plugin'
  | 'ai-drawing'
  | 'knowledge-base'
  | 'calendar'
  | 'translator'
  | 'collect'
  | 'ai-app'
type BigModelProvider =
  | 'OpenAI'
  | 'Ollama'
  | 'Gemini'
  | 'Tongyi'
  | 'ERNIE'
  | 'Spark'
  | 'Tiangong'
  | 'MoonshotAI'
type AIDrawingProvider = 'OpenAI' | 'Tongyi' | 'ERNIE' | 'Spark'
type AIAudioProvider = 'OpenAI'
type TranslatorProvider = 'youdao' | 'baiduTranslation'
type AssistantType = 'chat'
type ChatMsgType = 'text' | 'img'
type ChatRole = 'user' | 'assistant' | 'system' | 'tool'
type CalendarReportType = 'day' | 'week' | 'month' | 'year'
type MiniProgramType = 'webview' | 'local'
type AppNotificationType = 'info' | 'warn' | 'error'
type ChatPluginType = 'function'
// https://json-schema.org/understanding-json-schema/reference/type
type ChatPluginParameterType = 'string' | 'number' | 'integer' | 'object' | 'array' | 'boolean'
type CollectionItemType = 'chat' | 'image' | 'note'

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
  clearContextMessageId?: string | null
  chatPluginIdList: string[]

  // 对话
  instruction: string
  inputMaxTokens: number
  maxTokens: number
  contextSize: number

  // 发音
  speechModel?: string
  speechVoice?: string
  speechSpeed?: number
}

interface BaseMessage {
  role: ChatRole
  name?: string
  content: string
  image?: string
}

interface ChatMessage extends BaseMessage {
  id: string
  type: ChatMsgType
  createTime: number
}

interface CollectionItem {
  id: string
  type: CollectionItemType
  createTime: number

  // 对话收藏
  chat?: Assistant
  // 图片收藏
  image?: DrawingTask
  // 笔记收藏
  note?: CollectionNote
}

interface CollectionNote {
  title: string
  content: string
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
  name: Record<string, string>
  desc: Record<string, string>
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

interface DrawingTask {
  // 关键参数
  id: string
  provider: AIDrawingProvider
  model: string
  imageList: string[]
  prompt: string
  negativePrompt?: string

  // 选项（更换模型时清空）
  options: {
    n?: number
    quality?: string
    size?: string
    style?: string
    steps?: number
    samplerIndex?: string
    cfgScale?: number
  }
}
