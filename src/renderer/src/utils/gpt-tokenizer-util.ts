import { encodeChat } from 'gpt-tokenizer'
import { ChatMessage } from 'gpt-tokenizer/src/GptEncoding'

export const getChatTokens = (messages: BaseMessage[]) => {
  return encodeChat(messages as ChatMessage[], 'gpt-4-0314')
}

export const getChatTokensLength = (messages: BaseMessage[]) => {
  return getChatTokens(messages).length
}

export const getContentTokensLength = (content: string) => {
  return getChatTokens([{ role: 'user', content }]).length
}
