import CryptoJS from 'crypto-js'
import { CommonChatOption } from '.'
import { getChatTokensLength } from '@renderer/utils/gpt-tokenizer-util'

export const getSparkHostUrl = (model: string) => {
  return `wss://spark-api.xf-yun.com/${model}/chat`
}

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

export const getSparkWsRequestParam = (
  appId: string,
  model: string,
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
        max_tokens: 4096
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
    contextSize,
    appId,
    apiKey,
    secretKey,
    messages,
    checkSession,
    startAnswer,
    appendAnswer,
    end
  } = option

  if (!appId || !apiKey || !secretKey || !messages) {
    console.log('chat2spark params miss')
    end && end()
    return
  }

  let waitAnswer = true

  const sparkClient = new WebSocket(getSparkWsUrl(model, secretKey, apiKey))
  sparkClient.onopen = async () => {
    if (checkSession && !checkSession()) {
      end && end()
      return
    }
    console.log('星火服务器【已连接】')
    sparkClient.send(
      getSparkWsRequestParam(
        appId,
        model,
        await getSparkMessages(messages, instruction, inputMaxTokens, contextSize)
      )
    )
  }
  sparkClient.onmessage = (message) => {
    console.log(`星火服务器【消息】: ${message.data}`)
    if (checkSession && !checkSession()) {
      end && end()
      return
    }

    const respJson = JSON.parse(message.data.toString())
    if (!respJson || !respJson.payload?.choices?.text || !respJson.payload?.choices?.text[0]) {
      end && end('no answer')
      return
    }

    if (waitAnswer) {
      waitAnswer = false
      startAnswer && startAnswer('')
    }
    appendAnswer && appendAnswer(respJson.payload.choices.text[0].content ?? '')
  }
  sparkClient.onclose = () => {
    console.log('星火服务器【连接已关闭】')
    end && end()
  }
  sparkClient.onerror = (e) => {
    console.log('星火服务器【连接错误】', e)
    end && end(e)
  }
}

export const getSparkMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number,
  contextSize: number
) => {
  // 是否存在指令
  const hasInstruction = instruction.trim() != ''

  const messages = chatMessageList
    .map((m) => {
      return {
        role: m.role,
        content: m.content
      }
    })
    .slice(-1 - contextSize)

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
