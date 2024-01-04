import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { CommonChatOption } from '.'
import { getChatTokensLength } from '@renderer/utils/gpt-tokenizer-util'

export const getErnieBotChatUrl = (model: string) => {
  switch (model) {
    case 'ERNIE-Bot 4.0':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro'
    case 'ERNIE-Bot-8K':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie_bot_8k'
    case 'ERNIE-Bot':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions'
    case 'ERNIE-Bot-turbo':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant'
    default:
      return ''
  }
}

export const chat2ernieBot = async (option: CommonChatOption) => {
  const {
    model,
    instruction,
    inputMaxTokens,
    contextSize,
    apiKey,
    secretKey,
    abortCtr,
    messages,
    checkSession,
    startAnswer,
    appendAnswer,
    end
  } = option

  if (!apiKey || !secretKey || !messages) {
    console.log('chat2ernieBot params miss')
    end && end()
    return
  }

  let waitAnswer = true

  const tokenResp = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
  )
  const tokenRespJson = await tokenResp.json()
  const accessToken = tokenRespJson.access_token

  if (checkSession && !checkSession()) {
    end && end()
    return
  }

  await fetchEventSource(`${getErnieBotChatUrl(model)}?access_token=${accessToken}`, {
    // 保持后台运行
    openWhenHidden: true,
    signal: abortCtr?.signal,
    method: 'POST',
    body: JSON.stringify({
      messages: await getERNIEBotMessages(messages, instruction, inputMaxTokens, contextSize),
      stream: true
    }),
    async onopen(response) {
      if (response.ok && response.headers.get('content-type')?.includes(EventStreamContentType)) {
        return
      } else {
        const respText = await response.text()
        console.log('文心一言大模型连接错误', respText)
        throw new Error(respText)
      }
    },
    onmessage: (e) => {
      console.log('文心一言大模型回复：', e)

      if (checkSession && !checkSession()) {
        end && end()
        return
      }

      const respJson = JSON.parse(e.data)
      if (!respJson) {
        end && end('no answer')
        return
      }

      if (waitAnswer) {
        waitAnswer = false
        startAnswer && startAnswer('')
      }

      appendAnswer && appendAnswer(respJson.result ?? '')
    },
    onclose: () => {
      console.log('文心一言大模型关闭连接')
      end && end()
    },
    onerror: (err: any) => {
      console.log('文心一言大模型错误：', err)
      // 抛出异常防止重连
      if (err instanceof Error) {
        throw err
      }
    }
  })
}

export const getERNIEBotMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number,
  contextSize: number
) => {
  // 是否存在指令
  const hasInstruction = instruction.trim() != ''
  // 将消息历史处理为user和assistant轮流对话
  let messages: BaseMessage[] = []
  let currentRole = 'user' as 'user' | 'assistant'
  for (let i = chatMessageList.length - 1; i >= 0; i--) {
    const chatMessage = chatMessageList[i]
    if (currentRole === chatMessage.role) {
      messages.unshift({
        role: chatMessage.role,
        content: chatMessage.content
      })
      currentRole = currentRole === 'user' ? 'assistant' : 'user'
    }
  }
  messages = messages.slice(-1 - contextSize)
  // 必须user开头user结尾
  if (messages[0].role === 'assistant') {
    messages.shift()
  }
  // 增加指令
  if (hasInstruction) {
    chatMessageList[chatMessageList.length - 1].content = `${instruction}\n${
      chatMessageList[chatMessageList.length - 1].content
    }`
  }
  // 使用'gpt-4-0314'模型估算Token，如果超出了上限制则移除上下文一条消息
  while (
    inputMaxTokens > 0 &&
    messages.length > 1 &&
    getChatTokensLength(messages) > inputMaxTokens
  ) {
    messages.shift()
  }
  return messages
}
