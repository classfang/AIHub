import { Message } from '@arco-design/web-vue'
import chatModels from '@renderer/assets/json/chat-models.json'
import i18n from '@renderer/i18n'
import { useNotificationStore } from '@renderer/store/notification'
import { getChatTokensLength } from '@renderer/utils/gpt-tokenizer-util'
import { langChainLoadFile } from '@renderer/utils/ipc-util'

// 多语言
const { t } = i18n.global

export const defaultAssistant = {
  name: '',
  type: 'chat',
  instruction: '',
  provider: 'OpenAI',
  model: 'gpt-4-turbo',
  maxTokens: 2048,
  inputMaxTokens: 2048,
  contextSize: 1,
  speechModel: 'tts-1',
  speechVoice: 'alloy',
  speechSpeed: 1.0
}

export const turnChat = async (chatMessageList: ChatMessage[]) => {
  // 消息格式转换
  const messages: BaseMessage[] = []
  let currentRole = 'user' as 'user' | 'assistant'
  for (let i = chatMessageList.length - 1; i >= 0; i--) {
    const chatMessage = chatMessageList[i]
    if (currentRole === chatMessage.role) {
      // 将文件内容拼接到用户消息中
      if (chatMessage.fileList && chatMessage.fileList.length > 0) {
        const fileContentList: Record<string, string> = {}
        for (const f of chatMessage.fileList) {
          fileContentList[f.name] = await langChainLoadFile(f.path)
        }
        chatMessage.content = `Files Data:\n${JSON.stringify(fileContentList)}\n${chatMessage.content}`
      }
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
    const msg = `${t('chatWindow.contextSizeDown')} ${currentLength}`
    Message.info(msg)
    useNotificationStore().info(msg)
  }

  return messages
}

export const isCustomModel = (providerName: BigModelProvider, modelName: string) => {
  const models = chatModels[providerName]
  if (!models) {
    return true
  }
  const model = models.find((m) => m.name === modelName)
  return !model
}

export const isSupportImage = (providerName: BigModelProvider, modelName: string) => {
  // Ollama 始终支持图片上传，暂不根据模型进行判断
  if (providerName === 'Ollama') {
    return true
  }
  const models = chatModels[providerName]
  if (!models) {
    return false
  }
  const model = models.find((m) => m.name === modelName)
  if (!model) {
    return true
  }
  return model['isSupportImage']
}

export const isSupportPlugin = (providerName: BigModelProvider, modelName: string) => {
  const models = chatModels[providerName]
  if (!models) {
    return false
  }
  const model = models.find((m) => m.name === modelName)
  if (!model) {
    return true
  }
  return model['isSupportPlugin']
}

export const isSupportNetwork = (providerName: string, modelName: string) => {
  const models = chatModels[providerName]
  if (!models) {
    return false
  }
  const model = models.find((m) => m.name === modelName)
  if (!model) {
    return true
  }
  return model['isSupportNetwork']
}

export const isSupportSpeech = (providerName: BigModelProvider) => {
  return providerName === 'OpenAI'
}
