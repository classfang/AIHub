import CryptoJS from 'crypto-js'
import { CommonChatOption } from '.'
import { limitContext, turnChat } from '@renderer/utils/big-model/base-util'

// 获取星火服务地址
export const getSparkHostUrl = (model: string) => {
  return `wss://spark-api.xf-yun.com/${model}/chat`
}

// 获取ws请求地址
export const getSparkWsUrl = (model: string, apiSecret: string, apiKey: string) => {
  const url = new URL(getSparkHostUrl(model))
  const host = url.host
  const path = url.pathname
  const date = (new Date() as any).toGMTString()
  const algorithm = 'hmac-sha256'
  const headers = 'host date request-line'
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`
  const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
  const signature = CryptoJS.enc.Base64.stringify(signatureSha)
  const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
  const authorization = btoa(authorizationOrigin)
  return `${url.toString()}?authorization=${authorization}&date=${date}&host=${host}`
}

// 获取请求参数
export const getSparkWsRequestParam = (
  appId: string,
  model: string,
  maxTokens: number | undefined,
  messageList: BaseMessage[]
) => {
  return JSON.stringify({
    header: {
      app_id: appId,
      uid: '123456'
    },
    parameter: {
      chat: {
        domain: `generalv${model.substring(1, 2)}`,
        temperature: 0.5,
        max_tokens: maxTokens ?? 4096
      }
    },
    payload: {
      message: {
        text: messageList
      }
    }
  })
}

export const chat2spark = async (option: CommonChatOption) => {
  const {
    model,
    instruction,
    inputMaxTokens,
    maxTokens,
    contextSize,
    appId,
    apiKey,
    secretKey,
    messages,
    sessionId,
    startAnswer,
    appendAnswer,
    end
  } = option

  // 必须参数
  if (!appId || !apiKey || !secretKey || !messages) {
    console.log('chat2spark params miss')
    end && end(sessionId)
    return
  }

  // 等待回答
  let waitAnswer = true

  // websocket 实例
  const sparkClient = new WebSocket(getSparkWsUrl(model, secretKey, apiKey))

  // 连接成功
  sparkClient.onopen = async () => {
    console.log('chat2spark open')
    // 连接成功，发送消息
    sparkClient.send(
      getSparkWsRequestParam(
        appId,
        model,
        maxTokens,
        await getSparkMessages(messages, instruction, inputMaxTokens, contextSize)
      )
    )
  }

  // 收到消息
  sparkClient.onmessage = (message) => {
    try {
      const respJson = JSON.parse(message.data.toString())
      console.log('chat2spark:', respJson)
      if (waitAnswer) {
        waitAnswer = false
        startAnswer && startAnswer(sessionId)
      }
      appendAnswer && appendAnswer(sessionId, respJson.payload.choices.text[0].content ?? '')
    } catch (e) {
      console.log('chat2spark error', e)
      end && end(sessionId, message.data)
      return
    }
  }

  // 连接关闭
  sparkClient.onclose = () => {
    console.log('chat2spark close')
    end && end(sessionId)
  }

  // 连接错误
  sparkClient.onerror = (e) => {
    console.log('chat2spark error', e)
    end && end(sessionId, e)
  }
}

export const getSparkMessages = async (
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

  return messages
}
