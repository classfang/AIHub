import { CommonChatOption } from '.'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { limitContext, turnChat } from '@renderer/utils/big-model/base-util'
import { Logger } from '@renderer/utils/logger'

export const getErnieBotChatUrl = (model: string) => {
  switch (model) {
    case 'ERNIE-4.0':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro'
    case 'ERNIE-3.5-8K':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions'
    case 'ERNIE-Speed-8K':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie_speed'
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
    sessionId,
    startAnswer,
    appendAnswer,
    end
  } = option

  // 等待回答
  let waitAnswer = true

  // 获取 accessToken
  const tokenResp = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
  )
  const tokenRespJson = await tokenResp.json()
  const accessToken = tokenRespJson.access_token

  // sse
  await fetchEventSource(`${getErnieBotChatUrl(model)}?access_token=${accessToken}`, {
    openWhenHidden: true, // 保持后台运行
    signal: abortCtr?.signal,
    method: 'POST',
    body: JSON.stringify({
      messages: await getERNIEBotMessages(messages!, instruction, inputMaxTokens, contextSize),
      stream: true
    }),
    // 连接开启
    async onopen(response) {
      if (response.ok && response.headers.get('content-type')?.includes(EventStreamContentType)) {
        return
      } else {
        const respText = await response.text()
        Logger.error('chat2ernieBot error', respText)
        throw new Error(respText)
      }
    },
    // 接收消息
    onmessage: (message) => {
      try {
        const respJson = JSON.parse(message.data)
        Logger.info('chat2ernieBot:', respJson)
        if (waitAnswer) {
          waitAnswer = false
          startAnswer && startAnswer(sessionId)
        }
        appendAnswer && appendAnswer(sessionId, respJson.result)
      } catch (e: any) {
        Logger.error('chat2ernieBot error', e?.message)
        end && end(sessionId, message.data)
      }
    },
    // 连接关闭
    onclose: () => {
      Logger.info('chat2ernieBot close')
      end && end(sessionId)
    },
    // 连接错误
    onerror: (e: any) => {
      Logger.error('chat2ernieBot error：', e?.message)
      // 抛出异常防止重连
      if (e instanceof Error) {
        throw e
      }
    }
  })
}

export const getERNIEBotMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number | undefined,
  contextSize: number
) => {
  // 增加指令
  if (instruction.trim().length > 0) {
    chatMessageList[chatMessageList.length - 1].content = `${instruction}\n${
      chatMessageList[chatMessageList.length - 1].content
    }`
  }

  // 将消息历史处理为user和assistant轮流对话
  let messages = turnChat(chatMessageList)

  // 截取指定长度的上下文
  messages = limitContext(inputMaxTokens, contextSize, messages)

  // 消息开头不能是 assistant
  if (messages[0].role === 'assistant') {
    messages.shift()
  }

  return messages
}
