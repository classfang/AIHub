import { CommonChatOption } from '.'
import { limitContext, turnChat } from '@renderer/utils/big-model/base-util'
import { Logger } from '@renderer/utils/logger'
import OpenAI from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat'

export const chat2moonshot = async (option: CommonChatOption) => {
  const {
    model,
    instruction,
    inputMaxTokens,
    contextSize,
    apiKey,
    maxTokens,
    messages,
    sessionId,
    startAnswer,
    appendAnswer,
    end
  } = option

  // OpenAI实例
  const openai = new OpenAI({
    apiKey,
    baseURL: 'https://api.moonshot.cn/v1',
    dangerouslyAllowBrowser: true
  })

  // 现有消息列表
  const chatMessages = (await getMoonshotAIMessages(
    messages!,
    instruction,
    inputMaxTokens,
    contextSize
  )) as ChatCompletionMessageParam[]

  // 流式对话
  const stream = await openai.chat.completions.create({
    messages: chatMessages,
    model,
    stream: true,
    max_tokens: maxTokens
  })

  // 开始回答
  startAnswer && startAnswer(sessionId)

  // 连续回答
  for await (const chunk of stream) {
    Logger.info('chat2moonshot:', chunk)
    appendAnswer && appendAnswer(sessionId, chunk.choices[0].delta.content ?? '')
  }

  // 结束
  end && end(sessionId)
}

export const getMoonshotAIMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number | undefined,
  contextSize: number
) => {
  // 将消息历史处理为user和assistant轮流对话
  let messages = turnChat(chatMessageList)

  // 截取指定长度的上下文
  messages = limitContext(inputMaxTokens, contextSize, messages)

  // 增加指令
  if (instruction.trim().length > 0) {
    messages.unshift({
      role: 'system',
      content: instruction
    })
  }

  return messages
}
