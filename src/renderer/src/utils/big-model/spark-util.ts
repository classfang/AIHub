import { CommonChatOption, CommonDrawingOption } from '.'
import { limitContext, turnChat } from '@renderer/utils/big-model/base-util'
import { randomUUID } from '@renderer/utils/id-util'
import { readLocalImageBase64, saveFileByBase64 } from '@renderer/utils/ipc-util'
import { Logger } from '@renderer/utils/logger'
import CryptoJS from 'crypto-js'

// 获取星火服务地址
const getSparkHostUrl = (model: string) => {
  let hostUrl = ''
  switch (model) {
    case 'chat-v1.1':
      hostUrl = 'wss://spark-api.xf-yun.com/v1.1/chat'
      break
    case 'chat-v2.1':
      hostUrl = 'wss://spark-api.xf-yun.com/v2.1/chat'
      break
    case 'chat-v3.1':
      hostUrl = 'wss://spark-api.xf-yun.com/v3.1/chat'
      break
    case 'chat-v3.5':
      hostUrl = 'wss://spark-api.xf-yun.com/v3.5/chat'
      break
    case 'image-v2.1':
      hostUrl = 'wss://spark-api.cn-huabei-1.xf-yun.com/v2.1/image'
      break
    case 'tti-v2.1':
      hostUrl = 'https://spark-api.cn-huabei-1.xf-yun.com/v2.1/tti'
      break
  }
  return hostUrl
}

const getDomain = (model: string) => {
  let domain = 'general'
  switch (model) {
    case 'chat-v1.1':
      domain = 'general'
      break
    case 'chat-v2.1':
      domain = 'generalv2'
      break
    case 'chat-v3.1':
      domain = 'generalv3'
      break
    case 'chat-v3.5':
      domain = 'generalv3.5'
      break
    case 'image-v2.1':
      domain = 'image'
      break
    case 'tti-v2.1':
      domain = 'general'
      break
  }
  return domain
}

// 获取ws请求地址
const getAuthUrl = (hostUrl: string, method: string, apiKey: string, apiSecret: string) => {
  const url = new URL(hostUrl)
  const host = url.host
  const path = url.pathname
  const date = (new Date() as any).toGMTString()
  const algorithm = 'hmac-sha256'
  const headers = 'host date request-line'
  const signatureOrigin = `host: ${host}\ndate: ${date}\n${method} ${path} HTTP/1.1`
  const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret)
  const signature = CryptoJS.enc.Base64.stringify(signatureSha)
  const authorizationOrigin = `api_key="${apiKey}", algorithm="${algorithm}", headers="${headers}", signature="${signature}"`
  const authorization = btoa(authorizationOrigin)
  return `${url.toString()}?authorization=${authorization}&date=${date}&host=${host}`
}

// 获取对话请求参数
const getSparkWsRequestParam = (
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
        domain: getDomain(model),
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

// 获取绘画请求参数
const getDrawingRequestParam = (appId: string, imagePrompt: string, imageSize: string) => {
  return JSON.stringify({
    header: {
      app_id: appId
    },
    parameter: {
      chat: {
        domain: 'general',
        width: Number(imageSize.split('x')[0]),
        height: Number(imageSize.split('x')[1])
      }
    },
    payload: {
      message: {
        text: [
          {
            role: 'user',
            content: imagePrompt
          }
        ]
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

  // 模型服务地址
  const modelUrl = getSparkHostUrl(model)
  if (modelUrl === '') {
    end && end(sessionId, `Unsupported model: ${model}`)
    return
  }

  // 等待回答
  let waitAnswer = true

  // websocket 实例
  const sparkClient = new WebSocket(getAuthUrl(modelUrl, 'GET', apiKey!, secretKey!))

  // 连接成功
  sparkClient.onopen = async () => {
    Logger.info('chat2spark open')
    // 连接成功，发送消息
    sparkClient.send(
      getSparkWsRequestParam(
        appId!,
        model,
        maxTokens,
        await getSparkMessages(messages!, instruction, inputMaxTokens, contextSize)
      )
    )
  }

  // 收到消息
  sparkClient.onmessage = (message) => {
    try {
      const respJson = JSON.parse(message.data.toString())
      Logger.info('chat2spark:', respJson)

      const answerContent = respJson.payload.choices.text[0].content
      if (waitAnswer) {
        waitAnswer = false
        startAnswer && startAnswer(sessionId)
      }
      appendAnswer && appendAnswer(sessionId, answerContent)
    } catch (e: any) {
      Logger.error('chat2spark error', e?.message)
      end && end(sessionId, message.data)
      return
    }
  }

  // 连接关闭
  sparkClient.onclose = () => {
    Logger.info('chat2spark close')
    end && end(sessionId)
  }

  // 连接错误
  sparkClient.onerror = (e) => {
    Logger.error('chat2spark websocket connect error', e)
    end && end(sessionId, 'chat2spark websocket connect error')
  }
}

export const getSparkMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number | undefined,
  contextSize: number
) => {
  // 消息格式转换
  let messages = await turnChat(chatMessageList)

  // 截取指定长度的上下文
  messages = limitContext(inputMaxTokens, contextSize, messages)

  // 增加指令
  if (instruction.trim().length > 0) {
    messages.unshift({
      role: 'system',
      content: instruction
    })
  }

  // 转换消息结构
  let sparkMessages: any[] = []
  for (const m of messages) {
    // 处理用户消息中的图片
    if (m.image && m.role === 'user') {
      const imageBase64Data = await readLocalImageBase64(m.image)
      // 清空消息列表，保证图片是第一条消息
      sparkMessages = []
      // 添加图片消息和文本消息
      sparkMessages.push({
        role: 'user',
        content: `${imageBase64Data}`,
        content_type: 'image'
      })
      sparkMessages.push({
        role: 'user',
        content: m.content
      })
    } else {
      sparkMessages.push({
        role: m.role,
        content: m.content
      })
    }
  }

  return sparkMessages
}

export const drawingBySpark = async (option: CommonDrawingOption) => {
  const { appId, apiKey, secretKey, sessionId, prompt, model, size, imageGenerated, end } = option

  try {
    const imageTaskResp = await fetch(
      decodeURIComponent(getAuthUrl(getSparkHostUrl(model), 'POST', apiKey!, secretKey!)),
      {
        method: 'POST',
        body: getDrawingRequestParam(appId!, prompt!, size!)
      }
    )
    const imageTaskRespJson = await imageTaskResp.json()

    if (imageTaskRespJson.header.code === 0) {
      const imageUrls: string[] = []
      if (imageTaskRespJson.payload.choices.text) {
        for (const imageData of imageTaskRespJson.payload.choices.text) {
          imageUrls.push(await saveFileByBase64(imageData.content, `${randomUUID()}.png`))
        }
      }

      imageGenerated && imageGenerated(sessionId, imageUrls)
      end && end(sessionId)
    } else {
      end && end(sessionId, imageTaskRespJson.header.message)
    }
  } catch (err) {
    Logger.error('drawingBySpark error', err)
    end && end(sessionId, err)
  }
}
