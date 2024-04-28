import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { limitContext, turnChat } from '@renderer/utils/big-model/base-util'
import { CommonChatOption } from '@renderer/utils/big-model/index'
import { readLocalImageBase64 } from '@renderer/utils/ipc-util'
import { Logger } from '@renderer/utils/logger'

export const chat2gemini = async (option: CommonChatOption) => {
  const {
    model,
    instruction,
    inputMaxTokens,
    contextSize,
    apiKey,
    baseURL,
    maxTokens,
    messages,
    abortCtr,
    sessionId,
    startAnswer,
    appendAnswer,
    end
  } = option

  // 等待回答
  let waitAnswer = true

  // sse
  await fetchEventSource(`${baseURL}/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`, {
    openWhenHidden: true, // 保持后台运行
    signal: abortCtr?.signal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: await getGeminiMessages(messages!, instruction, inputMaxTokens, contextSize),
      safetySettings: [
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE'
        }
      ],
      generationConfig: {
        maxOutputTokens: maxTokens
      }
    }),
    // 连接开启
    async onopen(response) {
      Logger.info('chat2gemini open')
      if (response.ok && response.headers.get('content-type')?.includes(EventStreamContentType)) {
        return
      } else {
        const respText = await response.text()
        Logger.error('chat2gemini error', respText)
        throw new Error(respText)
      }
    },
    // 接收消息
    onmessage: (message) => {
      try {
        const respJson = JSON.parse(message.data)
        Logger.info('chat2gemini:', respJson)
        const errMsg = respJson.error?.message
        if (errMsg) {
          end && end(sessionId, errMsg)
          return
        }
        if (respJson.promptFeedback?.blockReason) {
          end && end(sessionId, 'block reason: ' + respJson.promptFeedback?.blockReason)
          return
        }
        if (waitAnswer) {
          waitAnswer = false
          startAnswer && startAnswer(sessionId)
        }
        appendAnswer && appendAnswer(sessionId, respJson.candidates[0].content.parts[0].text)
      } catch (e: any) {
        Logger.error('chat2gemini error', e?.message)
        end && end(sessionId, message.data)
      }
    },
    // 连接关闭
    onclose: () => {
      Logger.info('chat2gemini close')
      end && end(sessionId)
    },
    // 连接错误
    onerror: (e: any) => {
      Logger.error('chat2gemini error：', e?.message)
      // 抛出异常防止重连
      if (e instanceof Error) {
        throw e
      }
    }
  })
}

export const getGeminiMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number | undefined,
  contextSize: number
) => {
  // 图片问题，不联系上下文
  const lastChatMessage = chatMessageList.at(-1)
  if (lastChatMessage?.image) {
    const imageBase64Data = await readLocalImageBase64(lastChatMessage.image)
    return [
      {
        role: 'user',
        parts: [
          {
            text: lastChatMessage.content
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: imageBase64Data
            }
          }
        ]
      }
    ]
  }

  // 增加指令
  if (instruction.trim().length > 0) {
    chatMessageList.at(-1)!.content = `${instruction}\n${chatMessageList.at(-1)!.content}`
  }

  // 消息格式转换
  let messages = await turnChat(chatMessageList)

  // 截取指定长度的上下文
  messages = limitContext(inputMaxTokens, contextSize, messages)

  // 消息开头不能是 assistant
  if (messages[0].role === 'assistant') {
    messages.shift()
  }

  // 修改消息结构
  return messages.map((msg) => {
    return {
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: msg.content
        }
      ]
    }
  })
}
