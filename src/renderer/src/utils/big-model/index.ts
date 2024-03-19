import { chat2ernieBot } from '@renderer/utils/big-model/ernie-bot-util'
import { chat2gemini } from '@renderer/utils/big-model/gemini-util'
import { chat2openai, drawingByOpenAI } from '@renderer/utils/big-model/openai-util'
import { chat2spark, drawingBySpark } from '@renderer/utils/big-model/spark-util'
import { chat2tiangong } from '@renderer/utils/big-model/tiangong-util'
import { chat2tongyi, drawingByTongyi } from '@renderer/utils/big-model/tongyi-util'

type ChatFunctionMap = {
  [provider in BigModelProvider]: (option: CommonChatOption) => Promise<any>
}

type DrawingFunctionMap = {
  [provider in AIDrawingProvider]: (option: CommonDrawingOption) => Promise<any>
}

export interface CommonChatOption {
  appId?: string
  secretKey?: string
  apiKey?: string
  baseURL?: string
  model: string
  instruction: string
  inputMaxTokens?: number
  contextSize: number
  maxTokens?: number
  messages?: ChatMessage[]
  abortCtr?: AbortController
  sessionId: string
  chatPlugins?: ChatPlugin[]
  startAnswer?: (sessionId: string, content?: string) => void
  appendAnswer?: (sessionId: string, content: string) => void
  end?: (sessionId: string, err?: any) => void
}

export interface CommonDrawingOption {
  appId?: string
  secretKey?: string
  apiKey?: string
  baseURL?: string
  sessionId: string
  prompt: string
  negativePrompt?: string
  model: string
  size?: string
  quality?: string
  style?: string
  n?: number
  imageGenerated?: (sessionId: string, imageUrl: string) => void
  end?: (sessionId: string, errMsg?: any) => void
  abortCtr?: AbortController
}

const chatFunctionMap: ChatFunctionMap = {
  OpenAI: chat2openai,
  Gemini: chat2gemini,
  Spark: chat2spark,
  ERNIE: chat2ernieBot,
  Tongyi: chat2tongyi,
  Tiangong: chat2tiangong
}

const drawingFunctionMap: DrawingFunctionMap = {
  OpenAI: drawingByOpenAI,
  Spark: drawingBySpark,
  Tongyi: drawingByTongyi
}

export const chat2bigModel = async (provider: keyof ChatFunctionMap, option: CommonChatOption) => {
  const chatFunction = chatFunctionMap[provider]
  if (chatFunction) {
    return chatFunction(option)
  } else {
    throw new Error(`Unsupported provider: ${provider}`)
  }
}

export const drawingByBigModel = async (
  provider: keyof DrawingFunctionMap,
  option: CommonDrawingOption
) => {
  const drawingFunction = drawingFunctionMap[provider]
  if (drawingFunction) {
    return drawingFunction(option)
  } else {
    throw new Error(`Unsupported provider: ${provider}`)
  }
}
