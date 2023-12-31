import { EventStreamContentType, fetchEventSource } from '@microsoft/fetch-event-source'
import { CommonChatOption } from '.'
import { getChatTokensLength } from '@renderer/utils/gpt-tokenizer-util'
import { readLocalImageBase64, saveFileByUrl } from '@renderer/utils/ipc-util'
import { randomUUID } from '@renderer/utils/id-util'

export const getTongyiChatUrl = (model: string) => {
  switch (model) {
    case 'qwen-turbo':
    case 'qwen-plus':
    case 'qwen-max':
    case 'qwen-max-longcontext':
      return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    case 'qwen-vl-plus':
      return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
    default:
      return ''
  }
}

export const chat2tongyi = async (option: CommonChatOption) => {
  const {
    type,
    model,
    instruction,
    inputMaxTokens,
    contextSize,
    apiKey,
    abortCtr,
    messages,
    imagePrompt,
    imageSize,
    imageStyle,
    checkSession,
    startAnswer,
    appendAnswer,
    imageGenerated,
    end
  } = option

  if (!apiKey || !messages) {
    console.log('chat2tongyi params miss')
    end && end()
    return
  }

  let waitAnswer = true
  let answerIndex = 0

  if (type === 'chat') {
    await fetchEventSource(getTongyiChatUrl(model), {
      // 保持后台运行
      openWhenHidden: true,
      signal: abortCtr?.signal,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({
        model,
        input: {
          messages: await getTongyiMessages(
            messages,
            instruction,
            inputMaxTokens,
            contextSize,
            model
          )
        }
      }),
      async onopen(response) {
        if (response.ok && response.headers.get('content-type')?.includes(EventStreamContentType)) {
          return
        } else {
          const respText = await response.text()
          console.log('通义千问大模型连接错误', respText)
          throw new Error(respText)
        }
      },
      onmessage: (e) => {
        console.log('通义千问大模型回复：', e)

        if (checkSession && !checkSession()) {
          end && end()
          return
        }

        const respJson = JSON.parse(e.data)
        let content: string
        if (model === 'qwen-vl-plus') {
          if (
            !respJson ||
            !respJson.output?.choices ||
            !respJson.output?.choices[0]?.message?.content ||
            !respJson.output?.choices[0]?.message?.content[0]
          ) {
            end && end('no answer')
            return
          }
          content = JSON.parse(e.data).output.choices[0].message.content[0].text ?? ''
        } else {
          if (!respJson || !respJson.output?.text) {
            end && end('no answer')
            return
          }
          content = respJson.output.text ?? ''
        }

        if (waitAnswer) {
          waitAnswer = false
          if (startAnswer) {
            startAnswer && startAnswer('')
          }
        }

        appendAnswer && appendAnswer(content.substring(answerIndex))
        answerIndex = content.length
      },
      onclose: () => {
        console.log('通义千问大模型关闭连接')
        end && end()
      },
      onerror: (err: any) => {
        console.log('通义千问大模型错误：', err)
        // 抛出异常防止重连
        if (err instanceof Error) {
          throw err
        }
      }
    })
  } else if (type === 'drawing') {
    if (!imagePrompt || !imageStyle || !imageSize) {
      console.log('chat2tongyi params miss')
      return
    }

    // 提交生成图片任务
    fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
      signal: abortCtr?.signal,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      body: JSON.stringify({
        model,
        input: {
          prompt: imagePrompt
        },
        parameters: {
          style: imageStyle,
          size: imageSize.replace('x', '*'),
          n: 1
        }
      })
    })
      .then((res) => res.json())
      .then((respJson) => {
        // 获取任务id
        const taskId = respJson?.output?.task_id
        const errMsg = respJson?.message
        if (!taskId) {
          end && end(errMsg)
          return
        }

        // 轮询任务结果
        if (checkSession && !checkSession()) {
          end && end()
          return
        }
        const interval = setInterval(() => {
          if (checkSession && !checkSession()) {
            clearInterval(interval)
            end && end()
            return
          }
          fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
            signal: abortCtr?.signal,
            method: 'GET',
            headers: {
              Authorization: `Bearer ${apiKey}`
            }
          })
            .then((res) => res.json())
            .then((respJson) => {
              const taskStatus = respJson?.output?.task_status
              // 非正常任务状态，直接停止轮询并报错
              if (!['PENDING', 'RUNNING', 'SUCCEEDED'].includes(taskStatus)) {
                clearInterval(interval)
                end && end('task error')
                return
              }
              // 成功任务状态，获取结果中的图片地址，保存本地并返回
              if (taskStatus === 'SUCCEEDED') {
                clearInterval(interval)
                const imageUrl = respJson?.output?.results[0].url ?? ''
                if (imageUrl) {
                  saveFileByUrl(imageUrl, `${randomUUID()}.png`).then((localPath) => {
                    imageGenerated && imageGenerated(localPath)
                  })
                }
                end && end()
              }
            })
        }, 3000)
      })
      .catch((err) => {
        console.log('通义万相大模型错误：', err)
        end && end(err)
      })
  }
}

export const getTongyiMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number,
  contextSize: number,
  model: string
) => {
  // 是否是图片问题
  const lastChatMessage = chatMessageList[chatMessageList.length - 1]
  if (lastChatMessage.image) {
    const imageBase64Data = await readLocalImageBase64(lastChatMessage.image)
    return [
      {
        role: 'user',
        content: [
          {
            image: `data:image/jpg;base64,${imageBase64Data}`
          },
          { text: lastChatMessage.content }
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

  // 增加指令
  if (hasInstruction) {
    messages.unshift({
      role: 'system',
      content: instruction
    })
  }
  // 使用'gpt-4-0314'模型估算Token，如果超出了上限制则移除上下文一条消息
  while (
    inputMaxTokens > 0 &&
    messages.length > (hasInstruction ? 2 : 1) &&
    getChatTokensLength(messages) > inputMaxTokens
  ) {
    messages.shift()
    if (hasInstruction) {
      messages.shift()
      messages.unshift({
        role: 'system',
        content: instruction
      })
    }
  }
  // 第一条消息的 role 必须是 system 或者 user
  while (messages[0].role === 'assistant') {
    messages.shift()
  }

  // 处理
  if (model === 'qwen-vl-plus') {
    return messages.map((msg) => {
      return { role: msg.role, content: [{ text: msg.content }] }
    })
  }

  return messages
}
