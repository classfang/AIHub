import { Message } from '@arco-design/web-vue'
import i18n from '@renderer/i18n'
import { getChatTokensLength } from '@renderer/utils/gpt-tokenizer-util'

// 多语言
const { t } = i18n.global

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
  // 实际消息列表长度
  const originalLength = messages.length

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

  // 受Token限制，自动减小了上下文长度，提示用户
  const currentLength = messages.length
  if (originalLength >= contextSize && currentLength < contextSize) {
    Message.info(`${t('chatWindow.contextSizeDown')} ${currentLength}`)
  }

  return messages
}
