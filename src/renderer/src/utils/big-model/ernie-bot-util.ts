import { CommonChatOption, CommonDrawingOption } from '.'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { limitContext, turnChat } from '@renderer/utils/big-model/base-util'
import { randomUUID } from '@renderer/utils/id-util'
import { saveFileByBase64 } from '@renderer/utils/ipc-util'
import { Logger } from '@renderer/utils/logger'

export const getErnieBotChatUrl = (model: string) => {
  switch (model) {
    case 'ERNIE-4.0-8k':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro'
    case 'ERNIE-3.5-8K':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions'
    case 'ERNIE-Speed-8K':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie_speed'
    case 'ERNIE-Speed-128K':
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-speed-128k'
    default:
      return ''
  }
}

const getAccessToken = async (apiKey: string | undefined, secretKey: string | undefined) => {
  // 获取 accessToken
  const tokenResp = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
  )
  const tokenRespJson = await tokenResp.json()
  return tokenRespJson.access_token
}

export const chat2ernie = async (option: CommonChatOption) => {
  const {
    model,
    instruction,
    inputMaxTokens,
    maxTokens,
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
  const accessToken = await getAccessToken(apiKey, secretKey)

  // sse
  await fetchEventSource(`${getErnieBotChatUrl(model)}?access_token=${accessToken}`, {
    openWhenHidden: true, // 保持后台运行
    signal: abortCtr?.signal,
    method: 'POST',
    body: JSON.stringify({
      messages: await getERNIEMessages(messages!, instruction, inputMaxTokens, contextSize),
      stream: true,
      max_output_tokens: maxTokens
    }),
    // 连接开启
    async onopen(response) {
      if (response.ok && response.headers.get('content-type')?.includes(EventStreamContentType)) {
        return
      } else {
        const respText = await response.text()
        Logger.error('chat2ernie error', respText)
        throw new Error(respText)
      }
    },
    // 接收消息
    onmessage: (message) => {
      try {
        const respJson = JSON.parse(message.data)
        Logger.info('chat2ernie:', respJson)
        if (waitAnswer) {
          waitAnswer = false
          startAnswer && startAnswer(sessionId)
        }
        appendAnswer && appendAnswer(sessionId, respJson.result)
      } catch (e: any) {
        Logger.error('chat2ernie error', e?.message)
        end && end(sessionId, message.data)
      }
    },
    // 连接关闭
    onclose: () => {
      Logger.info('chat2ernie close')
      end && end(sessionId)
    },
    // 连接错误
    onerror: (e: any) => {
      Logger.error('chat2ernie error：', e?.message)
      // 抛出异常防止重连
      if (e instanceof Error) {
        throw e
      }
    }
  })
}

export const getERNIEMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number | undefined,
  contextSize: number
) => {
  // 增加指令
  if (instruction.trim().length > 0) {
    chatMessageList.at(-1)!.content = `${instruction}\n${chatMessageList.at(-1)!.content}`
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

export const drawingByERNIE = async (option: CommonDrawingOption) => {
  const {
    apiKey,
    secretKey,
    sessionId,
    prompt,
    negativePrompt,
    model,
    size,
    style,
    n,
    steps,
    samplerIndex,
    cfgScale,
    imageGenerated,
    end,
    abortCtr
  } = option

  try {
    const accessToken = await getAccessToken(apiKey, secretKey)

    // 提交生成图片任务
    const imageTaskResp = await fetch(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/text2image/${model}?access_token=${accessToken}`,
      {
        signal: abortCtr?.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          negative_prompt: negativePrompt,
          size: size,
          steps: steps,
          n: n,
          sampler_index: samplerIndex,
          cfg_scale: cfgScale,
          style: style
        })
      }
    )
    const imageTaskRespJson = await imageTaskResp.json()

    const errorCode = imageTaskRespJson?.error_code
    // 错误码
    if (errorCode) {
      end && end(sessionId, imageTaskRespJson?.error_msg)
      return
    }
    // 成功
    const imageUrls: string[] = []
    if (imageTaskRespJson?.data) {
      for (const imageData of imageTaskRespJson.data) {
        // 保存图片
        imageUrls.push(await saveFileByBase64(imageData.b64_image, `${randomUUID()}.png`))
      }
    }
    imageGenerated && imageGenerated(sessionId, imageUrls)
    end && end(sessionId)
  } catch (err) {
    Logger.error('drawingByERNIE error', err)
    end && end(sessionId, err)
  }
}
