import { encodeChat } from 'gpt-tokenizer'

export const getChatTokens = (messages: BaseMessage[]) => {
  return encodeChat(messages, 'gpt-4-0314')
}

export const getChatTokensLength = (messages: BaseMessage[]) => {
  return getChatTokens(messages).length
}

export const getContentTokensLength = (content: string) => {
  return getChatTokens([{ role: 'user', content }]).length
}
