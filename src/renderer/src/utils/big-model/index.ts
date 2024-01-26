import { chat2openai } from '@renderer/utils/big-model/openai-util'
import { chat2gemini } from '@renderer/utils/big-model/gemini-util'
import { chat2spark } from '@renderer/utils/big-model/spark-util'
import { chat2ernieBot } from '@renderer/utils/big-model/ernie-bot-util'
import { chat2tongyi } from '@renderer/utils/big-model/tongyi-util'

type ChatFunctionMap = {
  [provider in BigModelProvider]: (option: CommonChatOption) => Promise<any>
}

export interface CommonChatOption {
  appId?: string
  secretKey?: string
  apiKey?: string
  baseURL?: string
  type?: 'chat' | 'drawing'
  model: string
  instruction: string
  inputMaxTokens?: number
  contextSize: number
  maxTokens?: number
  messages?: ChatMessage[]
  imagePrompt?: string
  imageSize?: string
  imageQuality?: string
  imageStyle?: string
  abortCtr?: AbortController
  sessionId: string
  chatPlugins?: ChatPlugin[]
  startAnswer?: (sessionId: string, content?: string) => void
  appendAnswer?: (sessionId: string, content: string) => void
  imageGenerated?: (sessionId: string, imageUrl: string) => void
  end?: (sessionId: string, err?: any) => void
}

const chatFunctionMap: ChatFunctionMap = {
  OpenAI: chat2openai,
  Gemini: chat2gemini,
  Spark: chat2spark,
  ERNIEBot: chat2ernieBot,
  Tongyi: chat2tongyi
}

export const chat2bigModel = async (provider: keyof ChatFunctionMap, option: CommonChatOption) => {
  const chatFunction = chatFunctionMap[provider]
  if (chatFunction) {
    return chatFunction(option)
  } else {
    throw new Error(`Unsupported provider: ${provider}`)
  }
}
