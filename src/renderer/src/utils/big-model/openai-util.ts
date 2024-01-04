import OpenAI from 'openai'
import { readLocalImageBase64, saveFileByUrl } from '@renderer/utils/ipc-util'
import { randomUUID } from '@renderer/utils/id-util'
import { CommonChatOption } from '.'
import { getChatTokensLength } from '@renderer/utils/gpt-tokenizer-util'
import { ChatCompletionMessageParam } from 'openai/resources/chat'

export const chat2openai = async (option: CommonChatOption) => {
  const {
    model,
    instruction,
    inputMaxTokens,
    contextSize,
    apiKey,
    baseURL,
    type,
    maxTokens,
    messages,
    imagePrompt,
    imageSize,
    imageQuality,
    imageStyle,
    checkSession,
    startAnswer,
    appendAnswer,
    imageGenerated,
    end
  } = option

  if (!apiKey || !baseURL || !type || !maxTokens) {
    console.log('chat2openai params miss')
    end && end()
    return
  }

  const openai = new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true
  })
  if (type === 'chat' && messages) {
    // OpenAI对话
    const stream = await openai.chat.completions.create({
      messages: (await getOpenAIMessages(
        messages,
        instruction,
        inputMaxTokens,
        contextSize
      )) as ChatCompletionMessageParam[],
      model,
      stream: true,
      max_tokens: maxTokens
    })
    if (checkSession && !checkSession()) {
      end && end()
      return
    }
    if (startAnswer) {
      startAnswer('')
    }
    for await (const chunk of stream) {
      if (checkSession && !checkSession()) {
        end && end()
        return
      }
      console.log(`OpenAi【消息】: ${JSON.stringify(chunk.choices[0])}`)
      if (appendAnswer) {
        appendAnswer(chunk.choices[0].delta.content ?? '')
      }
    }
  } else if (type === 'drawing' && imagePrompt) {
    const imagesResponse = await openai.images.generate({
      prompt: imagePrompt,
      model,
      size: imageSize as '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' | null,
      response_format: 'url',
      quality: imageQuality as 'standard' | 'hd',
      style: imageStyle as 'vivid' | 'natural' | null
    })
    if (checkSession && !checkSession()) {
      end && end()
      return
    }
    console.log(`OpenAi【消息】: ${JSON.stringify(imagesResponse)}`)
    let imageUrl = imagesResponse.data[0].url ?? ''
    if (imageUrl) {
      imageUrl = await saveFileByUrl(imageUrl, `${randomUUID()}.png`)
    }
    imageGenerated && imageGenerated(imageUrl)
  }
  end && end()
}

export const getOpenAIMessages = async (
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
        content: [
          { type: 'text', text: lastChatMessage.content },
          {
            type: 'image_url',
            image_url: `data:image/jpg;base64,${imageBase64Data}`
          }
        ]
      }
    ]
  }

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
  return messages
}
