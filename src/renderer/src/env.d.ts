/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

type BigModelProvider = 'OpenAI' | 'Spark' | 'ERNIEBot' | 'Tongyi'
type AssistantType = 'chat' | 'drawing'
type ChatMsgType = 'text' | 'img'
type ChatRole = 'user' | 'assistant' | 'system'

interface Assistant {
  id: string
  type: AssistantType
  name: string
  instruction: string
  provider: BigModelProvider
  model: string
  inputMaxTokens: number
  maxTokens: number
  contextSize: number
  imageSize: string
  createTime: number
  lastUpdateTime: number
  chatMessageList: ChatMessage[]
}

interface BaseMessage {
  role: ChatRole
  content: string
}

interface ChatMessage extends BaseMessage {
  id: string
  type: ChatMsgType
  image?: string
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
