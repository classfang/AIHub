import { CommonChatOption } from '@renderer/utils/big-model/index'
import { readLocalImageBase64 } from '@renderer/utils/ipc-util'
import { getChatTokensLength } from '@renderer/utils/gpt-tokenizer-util'
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
    // appendAnswer,
    end
  } = option

  if (!apiKey || !baseURL || !maxTokens || !messages) {
    console.log('chat2gemini params miss')
    end && end()
    return
  }

  let respJson: any
  try {
    const resp = await fetch(`${baseURL}/models/${model}:generateContent?key=${apiKey}`, {
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
      })
    })
    respJson = await resp.json()
  } catch (err) {
    console.log('Gemini大模型错误：', err)
    end && end(err)
  }

  if (!respJson) {
    end && end()
    return
  }

  let errMsg = respJson.error?.message

  if (errMsg) {
    end && end(errMsg)
    return
  }

  if (!respJson.candidates || !respJson.candidates[0]) {
    errMsg = 'No candidates returned'
    if (respJson.promptFeedback?.blockReason) {
      errMsg = 'block reason: ' + respJson.promptFeedback?.blockReason
    }
    end && end(errMsg)
    return
  }

  const answer = respJson.candidates[0].content.parts[0].text ?? ''

  if (checkSession && !checkSession()) {
    end && end()
    return
  }
  startAnswer && startAnswer(answer)

  // for (const c of answer.split('')) {
  //   await simulateThreadWait(10)
  //   if (checkSession && !checkSession()) {
  //     end && end()
  //     return
  //   }
  //   appendAnswer && appendAnswer(c)
  // }

  end && end()
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
