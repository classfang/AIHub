import { CommonChatOption } from '.'
import { Logger } from '@renderer/utils/logger'
import CryptoJS from 'crypto-js'
import { limitContext, turnChat } from '@renderer/utils/big-model/base-util'

export const chat2tiangong = async (option: CommonChatOption) => {
  const {
    model,
    instruction,
    inputMaxTokens,
    maxTokens,
    contextSize,
    apiKey,
    secretKey,
    messages,
    sessionId,
    startAnswer,
    appendAnswer,
    end
  } = option

  // 必须参数
  if (!apiKey || !messages) {
    Logger.error('chat2tiangong params miss')
    end && end(sessionId)
    return
  }

  // 等待回答
  let waitAnswer = true

  const url = 'https://sky-api.singularity-ai.com/saas/api/v4/generate'
  const appKey = apiKey // 这里需要替换你的APIKey
  const appSecret = secretKey // 这里需要替换你的APISecret
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signContent = appKey + appSecret + timestamp
  const signResult = CryptoJS.MD5(signContent).toString(CryptoJS.enc.Hex)

  // 设置请求头，请求的数据格式为json
  const headers = {
    app_key: appKey,
    timestamp: timestamp,
    sign: signResult,
    'Content-Type': 'application/json',
    stream: 'true'
  }

  // 设置请求URL和参数
  const data = {
    messages: await getTiangongMessages(messages, instruction, inputMaxTokens, contextSize),
    model: model,
    param: {
      generate_length: maxTokens,
      top_p: 1,
      top_k: 3,
      repetition_penalty: 1.0,
      length_penalty: 1.0,
      min_len: 2,
      temperature: 0.66
    }
  }

  // 发起请求并获取响应
  fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  })
    .then((response) => {
      // 创建一个ReadableStream的读取器
      const reader = response.body!.getReader()

      // 读取数据并处理
      return new ReadableStream({
        async start(controller) {
          try {
            let isDone = false
            while (!isDone) {
              const { done, value } = await reader.read()

              // 如果读取完成，中止ReadableStream
              isDone = done
              if (done) {
                controller.close()
                break
              }

              // 处理接收到的数据
              const jsonData = new TextDecoder('utf-8').decode(value)

              Logger.info('chat2tiangong:', jsonData)
              if (waitAnswer) {
                waitAnswer = false
                startAnswer && startAnswer(sessionId)
              }

              // 按照换行分行
              const lines = jsonData.split('\n')

              // 遍历每一行
              lines.forEach((line: string) => {
                if (line) {
                  const jsonData = JSON.parse(line)
                  // 错误返回
                  if (jsonData.code != 200) {
                    end && end(sessionId, jsonData?.code_msg)
                  }
                  // 正确返回
                  appendAnswer && appendAnswer(sessionId, jsonData?.resp_data?.reply)
                }
              })
            }

            end && end(sessionId)
          } catch (error: any) {
            Logger.error('chat2tiangong error', error?.message)
            end && end(sessionId, error?.message)
          }
        }
      })
    })
    .catch((error) => {
      Logger.error('chat2tiangong error', error?.message)
      end && end(sessionId, error?.message)
    })

  // axios
  //   .post(url, data, { headers, responseType: 'stream' })
  //   .then((response) => {
  //     Logger.info('chat2tiangong:', response.data)
  //     startAnswer && startAnswer(sessionId)
  //     const lines = response.data.split('\n')
  //     // 遍历每一行
  //     lines.forEach((line: string) => {
  //       if (line) {
  //         const jsonData = JSON.parse(line)
  //         // 错误返回
  //         if (jsonData.code != 200) {
  //           end && end(sessionId, jsonData?.code_msg)
  //         }
  //         // 正确返回
  //         appendAnswer && appendAnswer(sessionId, jsonData?.resp_data?.reply)
  //       }
  //     })
  //     end && end(sessionId)
  //   })
  //   .catch((error) => {
  //     Logger.error('chat2tiangong error', error?.message)
  //     end && end(sessionId, error?.message)
  //   })
}

export const getTiangongMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number | undefined,
  contextSize: number
) => {
  // 将消息历史处理为user和assistant轮流对话
  let messages = turnChat(chatMessageList)

  // 截取指定长度的上下文
  messages = limitContext(inputMaxTokens, contextSize, messages)

  // 增加指令
  if (instruction.trim().length > 0) {
    messages.unshift({
      role: 'system',
      content: instruction
    })
  }

  // 修改消息结构
  return messages.map((msg) => {
    return {
      role: msg.role === 'assistant' ? 'bot' : msg.role,
      content: msg.content
    }
  })
}
