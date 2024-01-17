import { getChatTokensLength } from '@renderer/utils/gpt-tokenizer-util'

export const turnChat = (chatMessageList: ChatMessage[]) => {
  // 将消息历史处理为user和assistant轮流对话
  const messages: BaseMessage[] = []
  let currentRole = 'user' as 'user' | 'assistant'
  for (let i = chatMessageList.length - 1; i >= 0; i--) {
    const chatMessage = chatMessageList[i]
    if (currentRole === chatMessage.role) {
      messages.unshift({
        role: chatMessage.role,
        content: chatMessage.content,
        image: chatMessage.image
      })
      currentRole = currentRole === 'user' ? 'assistant' : 'user'
    }
  }

  return messages
}

export const limitContext = (
  inputMaxTokens: number | undefined,
  contextSize: number,
  messages: BaseMessage[]
) => {
  // 截取指定长度的上下文
  messages = messages.slice(-1 - contextSize)

  // 估算Token，如果超出了上限制则移除上下文一条消息
  while (
    inputMaxTokens != null &&
    messages.length > 1 &&
    getChatTokensLength(messages) > inputMaxTokens
  ) {
    messages.shift()
  }

  return messages
}
