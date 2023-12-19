import { CommonChatOption } from '@renderer/utils/big-model/index'
import { readLocalImageBase64 } from '@renderer/utils/ipc-util'
import { getChatTokensLength } from '@renderer/utils/gpt-tokenizer-util'
import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
// import { simulateThreadWait } from '@renderer/utils/thread-util'

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
    checkSession,
    startAnswer,
    appendAnswer,
    end
  } = option

  if (!apiKey || !baseURL || !maxTokens || !messages) {
    console.log('chat2gemini params miss')
    end && end()
    return
  }

  let waitAnswer = true

  await fetchEventSource(`${baseURL}/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`, {
    signal: abortCtr?.signal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: await getGeminiMessages(messages, instruction, inputMaxTokens, contextSize),
      generationConfig: {
        maxOutputTokens: maxTokens
      }
    }),
    async onopen(response) {
      if (response.ok && response.headers.get('content-type')?.includes(EventStreamContentType)) {
        return
      } else {
        const respText = await response.text()
        console.log('Gemini大模型连接错误', respText)
        throw new Error(respText)
      }
    },
    onmessage: (e) => {
      console.log('Gemini大模型回复：', e)

      if (checkSession && !checkSession()) {
        end && end()
        return
      }

      const respJson = JSON.parse(e.data)
      const errMsg = respJson.error?.message
      if (errMsg) {
        end && end(errMsg)
        return
      }
      if (respJson.promptFeedback?.blockReason) {
        end && end('block reason: ' + respJson.promptFeedback?.blockReason)
        return
      }
      if (
        !respJson ||
        !respJson.candidates ||
        !respJson.candidates[0]?.content.parts ||
        !respJson.candidates[0]?.content.parts[0]
      ) {
        end && end('no answer')
        return
      }

      if (waitAnswer) {
        waitAnswer = false
        startAnswer && startAnswer('')
      }

      appendAnswer && appendAnswer(respJson.candidates[0].content.parts[0].text ?? '')
    },
    onclose: () => {
      console.log('Gemini大模型关闭连接')
      end && end()
    },
    onerror: (err: any) => {
      console.log('Gemini大模型错误：', err)
      // 抛出异常防止重连
      if (err instanceof Error) {
        throw err
      }
    }
  })
}

export const getGeminiMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number,
  contextSize: number
) => {
  // 是否是图片问题
  const lastChatMessage = chatMessageList[chatMessageList.length - 1]
  if (lastChatMessage.image) {
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
  while (messages.length > 1 && getChatTokensLength(messages) > inputMaxTokens) {
    messages.shift()
  }
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
