import { fetchEventSource } from '@microsoft/fetch-event-source'
import { CommonChatOption } from '.'
import { getChatTokensLength } from '@renderer/utils/gpt-tokenizer-util'

export const getTongyiChatUrl = (model: string) => {
  switch (model) {
    case 'qwen-turbo':
    case 'qwen-plus':
    case 'qwen-max':
      return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
    case 'qwen-vl-plus':
      return 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
    default:
      return ''
  }
}

export const chat2tongyi = async (option: CommonChatOption) => {
  const {
    model,
    instruction,
    inputMaxTokens,
    contextSize,
    apiKey,
    abortCtr,
    messages,
    checkSession,
    startAnswer,
    appendAnswer,
    end
  } = option

  if (!apiKey || !messages) {
    console.log('chat2tongyi params miss')
    return
  }

  let waitAnswer = true

  await fetchEventSource(getTongyiChatUrl(model), {
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
        messages: await getTongyiMessages(messages, instruction, inputMaxTokens, contextSize, model)
      }
    }),
    onmessage: (e) => {
      if (checkSession && !checkSession()) {
        return
      }
      console.log('通义千问大模型回复：', e)
      if (waitAnswer) {
        waitAnswer = false
        if (startAnswer) {
          startAnswer('')
        }
      }
      if (appendAnswer) {
        let content = ''
        if (model === 'qwen-vl-plus') {
          content = JSON.parse(e.data).output?.choices[0]?.message?.content[0]?.text ?? ''
        } else {
          content = JSON.parse(e.data).output?.text ?? ''
        }
        appendAnswer(content)
      }
    },
    onclose: () => {
      console.log('通义千问大模型关闭连接')
      if (end) {
        end()
      }
    },
    onerror: (err: any) => {
      console.log('通义千问大模型错误：', err)
      if (end) {
        end(err)
      }
      // 抛出异常防止重连
      if (err instanceof Error) {
        throw err
      }
    }
  })
}

export const getTongyiMessages = async (
  chatMessageList: ChatMessage[],
  instruction: string,
  inputMaxTokens: number,
  contextSize: number,
  model: string
) => {
  // 是否存在指令
  const hasInstruction = instruction.trim() != ''

  const messages: BaseMessage[] = chatMessageList
    .map((m) => {
      return {
        role: m.role,
        content: m.content
      }
    })
    .slice(-1 - contextSize)

  // 增加指令
  if (hasInstruction) {
    messages.unshift({
      role: 'system',
      content: instruction
    })
  }
  // 使用'gpt-4-0314'模型估算Token，如果超出了上限制则移除上下文一条消息
  while (
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
