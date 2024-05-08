import { chat2ernie, drawingByERNIE } from '@renderer/utils/big-model/ernie-bot-util'
import { chat2gemini } from '@renderer/utils/big-model/gemini-util'
import { chat2moonshot } from '@renderer/utils/big-model/moonshot-util'
import { chat2ollama } from '@renderer/utils/big-model/ollama-util'
import { chat2openai, drawingByOpenAI, speechByOpenAI } from '@renderer/utils/big-model/openai-util'
import { chat2spark, drawingBySpark } from '@renderer/utils/big-model/spark-util'
import { chat2step } from '@renderer/utils/big-model/step-util'
import { chat2tiangong } from '@renderer/utils/big-model/tiangong-util'
import { chat2tongyi, drawingByTongyi } from '@renderer/utils/big-model/tongyi-util'
import { chat2zhipu, drawingByZhipu } from '@renderer/utils/big-model/zhipu-util'

type ChatFunctionMap = {
  [provider in BigModelProvider]: (option: CommonChatOption) => Promise<any>
}

type DrawingFunctionMap = {
  [provider in AIDrawingProvider]: (option: CommonDrawingOption) => Promise<any>
}

type SpeechFunctionMap = {
  [provider in AIAudioProvider]: (option: CommonSpeechOption) => Promise<any>
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
  steps?: number
  samplerIndex?: string
  cfgScale?: number
  imageGenerated?: (sessionId: string, imageUrls: string[]) => void
  end?: (sessionId: string, errMsg?: any) => void
  abortCtr?: AbortController
}

export interface CommonSpeechOption {
  apiKey?: string
  baseURL?: string
  model?: string
  voice?: string
  speed?: number
  input: string
}

const chatFunctionMap: ChatFunctionMap = {
  OpenAI: chat2openai,
  Ollama: chat2ollama,
  Gemini: chat2gemini,
  ZhipuAI: chat2zhipu,
  Spark: chat2spark,
  ERNIE: chat2ernie,
  Tongyi: chat2tongyi,
  Tiangong: chat2tiangong,
  MoonshotAI: chat2moonshot,
  StepFun: chat2step
}

const drawingFunctionMap: DrawingFunctionMap = {
  OpenAI: drawingByOpenAI,
  ZhipuAI: drawingByZhipu,
  Tongyi: drawingByTongyi,
  ERNIE: drawingByERNIE,
  Spark: drawingBySpark
}

const speechFunctionMap: SpeechFunctionMap = {
  OpenAI: speechByOpenAI
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

export const speechByBigModel = async (
  provider: keyof SpeechFunctionMap,
  option: CommonSpeechOption
) => {
  const speechFunction = speechFunctionMap[provider]
  if (speechFunction) {
    return speechFunction(option)
  } else {
    throw new Error(`Unsupported provider: ${provider}`)
  }
}
