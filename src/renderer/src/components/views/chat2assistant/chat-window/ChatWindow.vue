<script setup lang="ts">
import { FileItem, Message, Modal, RequestOption } from '@arco-design/web-vue'
import AssistantAvatar from '@renderer/components/avatar/AssistantAvatar.vue'
import UserAvatar from '@renderer/components/avatar/UserAvatar.vue'
import PromptList from '@renderer/components/modal/PromptList.vue'
import ChatMessageFile from '@renderer/components/views/chat2assistant/chat-window/ChatMessageFile.vue'
import ChatWindowFileList from '@renderer/components/views/chat2assistant/chat-window/ChatWindowFileList.vue'
import ChatWindowHeader from '@renderer/components/views/chat2assistant/chat-window/ChatWindowHeader.vue'
import ChatWindowWelcome from '@renderer/components/views/chat2assistant/chat-window/ChatWindowWelcome.vue'
import MultipleChoiceConsole from '@renderer/components/views/chat2assistant/chat-window/MultipleChoiceConsole.vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { useChatPluginStore } from '@renderer/store/chat-plugin'
import { useNotificationStore } from '@renderer/store/notification'
import { useSettingStore } from '@renderer/store/setting'
import { useSystemStore } from '@renderer/store/system'
import { chat2bigModel, CommonChatOption, speechByBigModel } from '@renderer/utils/big-model'
import {
  isSupportImage,
  isSupportPlugin,
  isSupportSpeech
} from '@renderer/utils/big-model/base-util'
import { SpeechStatus } from '@renderer/utils/constant'
import { nowTimestamp } from '@renderer/utils/date-util'
import { downloadFile } from '@renderer/utils/download-util'
import { getContentTokensLength } from '@renderer/utils/gpt-tokenizer-util'
import { randomUUID } from '@renderer/utils/id-util'
import { clipboardWriteText, saveFileByBase64, saveFileByPath } from '@renderer/utils/ipc-util'
import { Logger } from '@renderer/utils/logger'
import { renderMarkdown } from '@renderer/utils/markdown-util'
import { copyObj } from '@renderer/utils/object-util'
import dayjs from 'dayjs'
import { APIUserAbortError } from 'openai'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// store
const systemStore = useSystemStore()
const settingStore = useSettingStore()
const assistantStore = useAssistantStore()
const notificationStore = useNotificationStore()
const chatPluginStore = useChatPluginStore()

// i18n
const { t } = useI18n()

// 元素 ref
const chatMessageListScrollbarRef = ref()
const chatInputTextareaRef = ref()
const chatWindowHeaderRef = ref()

// 阻断控制
let abortCtr = new AbortController()

// 创建一个AudioContext对象来处理音频
const audioContext = new AudioContext()
let audioBufferSource = audioContext.createBufferSource()

// 组件传参
const props = defineProps({
  // 是否是虚拟助手模式
  isVirtual: {
    type: Boolean,
    default: () => false
  }
})

// 数据绑定
const data = reactive({
  // 聊天窗口加载完毕
  isLoad: false,
  // 用于判断会话是否变换
  currentSessionId: randomUUID(),
  // 当前的助手
  currentAssistant: props.isVirtual
    ? assistantStore.getCurrentVirtualAssistant
    : assistantStore.getCurrentAssistant,
  // 输入的问题
  question: '',
  // 上传文件选择
  selectFileList: [] as FileItem[],
  // 上传图片选择
  selectImageList: [] as FileItem[],
  // 判断大模型是否已经回答
  waitAnswer: false,
  // 是否打开多选
  multipleChoiceFlag: false,
  // 多选消息列表
  multipleChoiceList: [] as string[],
  // 是否显示置底按钮
  isToBottomBtnShow: false,
  // 分页
  page: {
    number: 1,
    size: 20
  },
  // 发音标识
  speechStatus: SpeechStatus.STOP,
  speechSessionId: randomUUID(),
  // 提示词列表modal
  promptListModalVisible: false,
  // 文件上传列表modal
  fileListModalVisible: false
})
const {
  isLoad,
  currentAssistant,
  question,
  selectFileList,
  selectImageList,
  waitAnswer,
  multipleChoiceFlag,
  multipleChoiceList,
  isToBottomBtnShow,
  page,
  speechStatus,
  promptListModalVisible,
  fileListModalVisible
} = toRefs(data)

// 监听消息列表变化
watch(
  () => data.currentAssistant.chatMessageList,
  () => {
    nextTick(() => {
      calcToBottomShow()
    })
  },
  {
    deep: true
  }
)

// 计算分页数据
const chatMessageListPageData = computed(() => {
  let start = data.currentAssistant.chatMessageList.length - data.page.number * data.page.size
  start = start > 0 ? start : 0
  return data.currentAssistant.chatMessageList.slice(
    start,
    data.currentAssistant.chatMessageList.length
  )
})

// 加载更多分页数据
const chatMessageLoadMore = (id: string) => {
  data.page.number++
  nextTick(() => {
    // 重新定位到当前消息
    document.querySelector(`#chat-message-${id}`)?.scrollIntoView()
  })
}

// 支持图片上传
const isSupportImageComputed = computed(() => {
  return isSupportImage(data.currentAssistant.provider, data.currentAssistant.model)
})

// 支持插件
const isSupportPluginComputed = computed(() => {
  return isSupportPlugin(data.currentAssistant.provider, data.currentAssistant.model)
})

// 支持发音
const isSupportSpeechComputed = computed(() => {
  return isSupportSpeech(data.currentAssistant.provider)
})

// 发送提问
const sendQuestion = async (event?: KeyboardEvent) => {
  // 加载中、内容为空、输入法回车，不发送消息
  if (systemStore.chatWindowLoading || !data.question.trim() || event?.isComposing) {
    event?.preventDefault()
    return
  } else if (event?.shiftKey) {
    return
  } else {
    event?.preventDefault()
  }

  // 检查输入 Token 数
  if (getContentTokensLength(data.question.trim()) > data.currentAssistant.inputMaxTokens) {
    Message.error(t('chatWindow.inputTokensLimit'))
    return
  }

  // 大模型调用
  try {
    await useBigModel()
  } catch (e: any) {
    Logger.error('big model error: ', e?.message)
    // 除了手动中断异常
    if (!(e instanceof APIUserAbortError)) {
      const errMsg = e ? e + '' : t(`chatWindow.error.${data.currentAssistant.provider}`)
      Message.error(errMsg)
      notificationStore.error(errMsg)
    }
    systemStore.chatWindowLoading = false
    data.waitAnswer = false
  }
}

// 使用大模型
const useBigModel = async () => {
  // 检查大模型配置
  if (settingStore.checkBigModelConfig(data.currentAssistant.provider)) {
    Modal.confirm({
      title: t('common.configError'),
      content: t(`chatWindow.configMiss.${data.currentAssistant.provider}`),
      okText: t('common.goSetting'),
      cancelText: t('common.cancel'),
      onOk: () => {
        systemStore.openSettingModal('bigModel')
      }
    })
    return
  }

  // 模型特有错误检查
  if (data.currentAssistant.model === 'gemini-pro-vision') {
    if (!data.selectImageList[0]) {
      Message.error(t('chatWindow.error.imageRequires'))
      return
    }
  }

  // 开启等待
  systemStore.chatWindowLoading = true
  data.waitAnswer = true

  // 处理并清空问题输入
  const question = data.question.trim()
  data.question = ''

  // 处理并清空图片数据
  let questionImage = ''
  if (data.selectImageList[0]) {
    const imageName = data.selectImageList[0].file?.name
    const imagePath = data.selectImageList[0].file?.path
    // 将图片本地链接保存
    if (isSupportImageComputed.value && imagePath) {
      questionImage = await saveFileByPath(imagePath, `${randomUUID()}${imageName}`)
    }
    data.selectImageList = []
  }

  // 处理并清空文件列表
  const questionFileList: MessageFile[] = []
  if (data.selectFileList.length > 0) {
    for (const f of data.selectFileList) {
      const fileSavePath = await saveFileByPath(f.file!.path, `${randomUUID()}${f.file!.name}`)
      questionFileList.push({
        id: randomUUID(),
        name: f.file!.name,
        path: fileSavePath,
        size: f.file!.size
      })
    }
    data.selectFileList = []
  }

  // 用户消息追加
  data.currentAssistant.chatMessageList.push({
    id: randomUUID(),
    type: 'text',
    role: 'user',
    content: question,
    image: questionImage,
    fileList: questionFileList,
    createTime: nowTimestamp()
  })
  scrollToBottom(false)

  // 大模型接收的消息列表
  let bigModelMessageList = data.currentAssistant.chatMessageList
  // 找到清空上下文的位置
  const clearContextMessageIndex = bigModelMessageList.findIndex(
    (msg) => msg.id === data.currentAssistant.clearContextMessageId
  )
  if (clearContextMessageIndex >= 0) {
    bigModelMessageList = bigModelMessageList.slice(clearContextMessageIndex + 1)
  }

  // 大模型通用选项
  const chat2bigModelOption: CommonChatOption = {
    sessionId: data.currentSessionId,
    model: data.currentAssistant.model,
    instruction: data.currentAssistant.instruction,
    inputMaxTokens: data.currentAssistant.inputMaxTokens,
    maxTokens: data.currentAssistant.maxTokens,
    contextSize: data.currentAssistant.contextSize,
    messages: copyObj(bigModelMessageList),
    abortCtr: abortCtr,
    chatPlugins: chatPluginStore.getPluginListByIds(data.currentAssistant.chatPluginIdList, true),
    startAnswer: (sessionId: string, content?: string) => {
      if (data.currentSessionId != sessionId) {
        return
      }
      data.currentAssistant.chatMessageList.push({
        id: randomUUID(),
        type: 'text',
        role: 'assistant' as ChatRole,
        content: content ?? '',
        createTime: nowTimestamp()
      })
      scrollToBottom(true)
      data.waitAnswer = false
    },
    appendAnswer: (sessionId: string, content: string) => {
      if (data.currentSessionId != sessionId) {
        return
      }
      data.currentAssistant.chatMessageList[
        data.currentAssistant.chatMessageList.length - 1
      ].content += content
      scrollToBottom(true)
    },
    end: (sessionId: string, errMsg: any) => {
      if (data.currentSessionId != sessionId) {
        return
      }
      if (errMsg != null) {
        // 错误提示
        Message.error(errMsg)
        // 添加提醒
        notificationStore.error(errMsg)
      }
      // 关闭等待
      data.waitAnswer = false
      systemStore.chatWindowLoading = false
    }
  }

  // 各家大模型特有选项
  const otherOption = settingStore.getBigModelConfig(data.currentAssistant.provider)

  // 大模型能力调用
  await chat2bigModel(data.currentAssistant.provider, {
    ...chat2bigModelOption,
    ...otherOption
  })
}

// 手动结束回答
const stopAnswer = () => {
  data.currentSessionId = randomUUID()
  systemStore.chatWindowLoading = false
  data.waitAnswer = false
  abortCtr.abort()
  abortCtr = new AbortController()
}

// 自定义图片上传
const selectImageClick = () => {
  // 每次点击上传按钮，先清空图片列表
  data.selectImageList = []
}
const selectImageRequest = (option: RequestOption) => {
  const { fileItem, onSuccess } = option
  data.selectImageList = [fileItem]
  onSuccess()

  return {
    abort: () => {}
  }
}

// 多选选择事件
const multipleChoiceChange = (id: string) => {
  if (data.multipleChoiceList.includes(id)) {
    data.multipleChoiceList = data.multipleChoiceList.filter((i) => i != id)
  } else {
    data.multipleChoiceList.push(id)
  }
}

// 开启多选
const multipleChoiceOpen = (id?: string) => {
  if (systemStore.chatWindowLoading) {
    return
  }
  data.multipleChoiceFlag = true
  if (id) {
    multipleChoiceChange(id)
  }
}

// 关闭多选
const multipleChoiceClose = () => {
  data.multipleChoiceList = []
  data.multipleChoiceFlag = false
  calcToBottomShow()
}

// 计算显示的消息时间
let lastShowTime: number = 0
let lastShowTimeMessageId: string = ''
const calcMessageTime = (current: ChatMessage, isFirst: boolean) => {
  if (
    isFirst ||
    (current.createTime - lastShowTime) / 1000 / 60 >= 5 ||
    current.id === lastShowTimeMessageId
  ) {
    lastShowTime = current.createTime
    lastShowTimeMessageId = current.id
    if (dayjs(current.createTime).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')) {
      return dayjs(current.createTime).format('HH:mm')
    } else {
      return dayjs(current.createTime).format('YYYY-MM-DD HH:mm')
    }
  }
  return null
}

// 对话记录滚动到底部
const scrollToBottom = (isAuto: boolean) => {
  nextTick(() => {
    if (!isAuto || !data.isToBottomBtnShow) {
      chatMessageListScrollbarRef.value.scrollTop(
        chatMessageListScrollbarRef.value.containerRef.scrollHeight
      )
    }
  })
}

// 监听消息列表滚动
const onChatMessageListScroll = () => {
  calcToBottomShow()
}

// 计算置底按钮是否显示
const calcToBottomShow = () => {
  // 滚动超过一定高度时，显示置底按钮
  data.isToBottomBtnShow =
    chatMessageListScrollbarRef.value.containerRef.scrollHeight -
      chatMessageListScrollbarRef.value.containerRef.clientHeight -
      chatMessageListScrollbarRef.value.containerRef.scrollTop >
    50
}

// 清空上下文
const clearContext = () => {
  if (systemStore.chatWindowLoading || data.currentAssistant.chatMessageList.length === 0) {
    return
  }
  // 最后一条消息id
  const lastMessageId = data.currentAssistant.chatMessageList.at(-1)?.id
  // 清空或者恢复
  if (data.currentAssistant.clearContextMessageId === lastMessageId) {
    data.currentAssistant.clearContextMessageId = null
  } else {
    data.currentAssistant.clearContextMessageId = lastMessageId
  }
  scrollToBottom(false)
}

// 开始发音
const startSpeech = async (content?: string) => {
  // 空内容不播放
  if (!content) {
    return
  }

  // 用于判断播放会话
  data.speechSessionId = randomUUID()
  const sessionId = data.speechSessionId

  // 获取音频流
  data.speechStatus = SpeechStatus.LOADING
  try {
    const audioData = await speechByBigModel(data.currentAssistant.provider as AIAudioProvider, {
      apiKey: settingStore.openAI.key,
      baseURL: settingStore.openAI.baseUrl,
      model: data.currentAssistant.speechModel,
      voice: data.currentAssistant.speechVoice,
      speed: data.currentAssistant.speechSpeed,
      input: content
    })

    // 判断会话
    if (sessionId != data.speechSessionId) {
      return
    }

    // 断开之前的音频连接
    audioBufferSource.disconnect()
    // 创建新的数据源对象
    audioBufferSource = audioContext.createBufferSource()
    // 转换音频数据
    await audioContext.decodeAudioData(
      audioData,
      (buffer) => {
        // 判断会话
        if (sessionId != data.speechSessionId) {
          return
        }

        // 设置缓冲区数据
        audioBufferSource.buffer = buffer

        // 连接到输出设备
        audioBufferSource.connect(audioContext.destination)

        // 播放音频
        audioBufferSource.start()
        data.speechStatus = SpeechStatus.START

        // 播放结束
        audioBufferSource.onended = () => {
          // 判断会话
          if (sessionId != data.speechSessionId) {
            return
          }
          data.speechStatus = SpeechStatus.STOP
        }
      },
      (error) => {
        data.speechStatus = SpeechStatus.STOP
        console.error('Error decoding audio data', error)
        Message.error(error.message)
      }
    )
  } catch (e: any) {
    data.speechStatus = SpeechStatus.STOP
    Message.error(e.message)
  }
}

// 终止发音
const stopSpeech = () => {
  audioBufferSource.disconnect()
  data.speechSessionId = randomUUID()
  data.speechStatus = SpeechStatus.STOP
}

// 输入框粘贴监听
const handleInputPaste = (event: ClipboardEvent) => {
  // 获取粘贴的内容
  const items = event.clipboardData?.items
  if (!items) {
    return
  }

  // 支持图片上传
  if (isSupportImageComputed.value) {
    // 只获取第一张图片
    const item = items[0]
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      // 阻止默认粘贴行为
      event.preventDefault()
      // 获取图片数据
      const blob = item.getAsFile()
      if (blob) {
        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target && e.target.result) {
            // 获取 base64 数据
            const imageUrl = e.target.result as string
            if (!imageUrl) {
              return
            }
            const imageBase64 = imageUrl.split('base64,')[1]
            if (!imageBase64) {
              return
            }

            // 随机文件名
            const fileName = `${randomUUID()}.png`

            // 保存到本地
            saveFileByBase64(imageBase64, fileName).then((path) => {
              // 保存成功后添加到图片预览
              data.selectImageList = [
                {
                  uid: randomUUID(),
                  file: {
                    name: fileName,
                    path: path
                  }
                } as FileItem
              ]
            })
          }
        }
        // 加载图片数据
        reader.readAsDataURL(blob)
      }
    }
  }
}

// 选择快捷指令
const selectPrompt = (prompt: string) => {
  data.question = prompt
}

// 挂载完毕
onMounted(() => {
  // 对话记录滚动到底部
  scrollToBottom(false)
  // 防止滚动闪烁
  data.isLoad = true
  // 聚焦输入框
  chatInputTextareaRef.value.focus()
})

// 卸载之前
onBeforeUnmount(() => {
  // 断开之前的音频连接
  audioBufferSource.disconnect()
})
</script>

<template>
  <div class="chat-window">
    <!-- 头部 -->
    <ChatWindowHeader
      ref="chatWindowHeaderRef"
      :is-virtual="isVirtual"
      :current-assistant="currentAssistant"
    />

    <!-- 消息列表滚动 -->
    <a-scrollbar
      ref="chatMessageListScrollbarRef"
      outer-class="chat-message-list-container arco-scrollbar-small"
      style="height: calc(100vh - 160px - 55px); overflow-y: auto"
      @scroll="onChatMessageListScroll"
    >
      <!-- 对话欢迎窗口 -->
      <ChatWindowWelcome
        v-if="isVirtual && currentAssistant.chatMessageList.length === 0"
        :assistant="currentAssistant"
      />

      <!-- 消息列表-->
      <div v-else class="chat-message-list fade-in-from" :class="{ 'fade-in-to': isLoad }">
        <!-- 加载更多 -->
        <a-button
          v-if="currentAssistant.chatMessageList.length - page.number * page.size > 0"
          style="background-color: transparent"
          type="text"
          size="mini"
          @click="chatMessageLoadMore(chatMessageListPageData[0].id)"
          >{{ $t('common.loadMore') }}
        </a-button>

        <!-- 消息体 -->
        <template v-for="(msg, index) in chatMessageListPageData" :key="msg.id">
          <div
            v-if="calcMessageTime(msg, index === 0)"
            :key="`chat-message-time-${msg.id}-${systemStore.dayKey}`"
            class="chat-message-time"
          >
            {{ calcMessageTime(msg, index === 0) }}
          </div>
          <!-- 右键点击菜单 -->
          <a-dropdown :align-point="true" trigger="contextMenu">
            <!-- 消息块 -->
            <div
              :id="`chat-message-${msg.id}`"
              class="chat-message"
              :class="{ 'chat-message-user': msg.role === 'user' }"
            >
              <!-- 多选框 -->
              <a-checkbox
                v-if="multipleChoiceFlag"
                class="chat-message-checkbox"
                :default-checked="multipleChoiceList.includes(msg.id)"
                @change="multipleChoiceChange(msg.id)"
              />
              <!-- 消息头像 -->
              <div class="chat-message-avatar">
                <UserAvatar v-if="msg.role === 'user'" :size="30" />
                <AssistantAvatar
                  v-else-if="msg.role === 'assistant'"
                  :provider="currentAssistant.provider"
                  :size="30"
                />
              </div>
              <!-- 消息内容 -->
              <div class="chat-message-content select-text">
                <!-- 用户消息：文本内容 -->
                <div v-if="msg.role === 'user'">{{ msg.content }}</div>
                <!-- 大模型消息：markdown 内容 -->
                <div
                  v-else-if="msg.role === 'assistant'"
                  class="chat-message-md"
                  v-html="
                    renderMarkdown(
                      msg.content,
                      index === chatMessageListPageData.length - 1 && systemStore.chatWindowLoading
                    )
                  "
                ></div>
                <!-- 消息内容携带的图片 -->
                <a-image
                  v-if="msg.image"
                  class="chat-message-img"
                  width="300"
                  height="300"
                  :src="`file://${msg.image}`"
                  show-loader
                  fit="cover"
                >
                  <template #preview-actions>
                    <a-image-preview-action
                      :name="$t('common.download')"
                      @click="downloadFile(`file://${msg.image}`, `img-${msg.id}.png`)"
                    >
                      <icon-download />
                    </a-image-preview-action>
                  </template>
                </a-image>
                <!-- 消息内容携带的文件列表 -->
                <div v-if="msg.fileList && msg.fileList.length > 0" class="chat-message-file-list">
                  <ChatMessageFile v-for="f in msg.fileList" :key="f.id" :message-file="f" />
                </div>
              </div>
            </div>
            <!-- 右键菜单内容 -->
            <template #content>
              <a-doption @click="clipboardWriteText(msg.content)"
                >{{ $t('chatWindow.copy') }}
              </a-doption>
              <a-doption v-if="isSupportSpeechComputed" @click="startSpeech(msg.content)"
                >{{ $t('chatWindow.speech') }}
              </a-doption>
              <a-doption @click="multipleChoiceOpen(msg.id)"
                >{{ $t('chatWindow.multipleChoice') }}
              </a-doption>
            </template>
          </a-dropdown>
          <!-- 清空上下文提示 -->
          <transition name="fadein">
            <a-divider
              v-if="currentAssistant.clearContextMessageId === msg.id"
              class="chat-message-clear-context"
              orientation="center"
              @click="currentAssistant.clearContextMessageId = null"
              >{{ $t('chatWindow.clearContextTip') }}
            </a-divider>
          </transition>
        </template>
        <!-- 等待回答占位显示 -->
        <div v-if="waitAnswer" class="chat-message">
          <div class="chat-message-avatar">
            <AssistantAvatar :provider="currentAssistant.provider" :size="30" />
          </div>
          <div class="chat-message-content">
            <a-spin :size="15" />
          </div>
        </div>
      </div>
    </a-scrollbar>

    <!-- 输入框区域 -->
    <div class="chat-input-container">
      <!-- 回到底部 -->
      <div
        v-if="isToBottomBtnShow"
        class="chat-message-list-to-bottom"
        @click="scrollToBottom(false)"
      >
        <icon-arrow-down class="chat-message-list-to-bottom-icon" />
      </div>
      <!-- 工具栏 -->
      <div class="chat-input-tools">
        <!-- 打开设置 -->
        <a-tooltip
          :content="isVirtual ? $t('chatWindow.header.editChat') : $t('chatWindow.header.edit')"
          position="top"
          mini
          :content-style="{ fontSize: '12px' }"
        >
          <a-button size="mini" shape="round" @click="chatWindowHeaderRef.edit()">
            <icon-settings :size="15" />
          </a-button>
        </a-tooltip>

        <!-- 清空上下文 -->
        <a-tooltip
          :content="$t('chatWindow.clearContext')"
          position="top"
          mini
          :content-style="{ fontSize: '12px' }"
        >
          <a-button size="mini" shape="round" @click="clearContext()">
            <icon-eraser :size="15" />
          </a-button>
        </a-tooltip>

        <!-- 清空记录 -->
        <a-tooltip
          :content="$t('chatWindow.header.clear')"
          position="top"
          mini
          :content-style="{ fontSize: '12px' }"
        >
          <a-button size="mini" shape="round" @click="chatWindowHeaderRef.clearConfirm()">
            <icon-delete :size="15" />
          </a-button>
        </a-tooltip>

        <!-- 打开多选菜单 -->
        <a-tooltip
          :content="$t('chatWindow.multipleChoice')"
          position="top"
          mini
          :content-style="{ fontSize: '12px' }"
        >
          <a-button size="mini" shape="round" @click="multipleChoiceOpen()">
            <icon-select-all :size="15" />
          </a-button>
        </a-tooltip>

        <!-- 快捷指令 -->
        <a-tooltip
          v-if="isVirtual"
          :content="$t('chatWindow.fastPrompt')"
          position="top"
          mini
          :content-style="{ fontSize: '12px' }"
        >
          <a-button size="mini" shape="round" @click="promptListModalVisible = true">
            <icon-bulb :size="15" />
          </a-button>
        </a-tooltip>

        <!-- 选择图片 -->
        <div v-if="isSupportImageComputed" class="chat-input-select-image">
          <a-upload
            :file-list="selectImageList"
            :limit="1"
            :on-button-click="selectImageClick"
            :custom-request="selectImageRequest"
            accept="image/*"
            :show-file-list="false"
          >
            <template #upload-button>
              <a-tooltip
                :content="$t('chatWindow.selectImage')"
                position="top"
                mini
                :content-style="{ fontSize: '12px' }"
              >
                <a-button size="mini" shape="round">
                  <icon-image :size="15" />
                </a-button>
              </a-tooltip>
            </template>
          </a-upload>
        </div>

        <!-- 选择文档 -->
        <a-tooltip
          :content="$t('chatWindow.selectFile')"
          position="top"
          mini
          :content-style="{ fontSize: '12px' }"
        >
          <a-button
            size="mini"
            :type="selectFileList.length > 0 ? 'primary' : undefined"
            shape="round"
            @click="fileListModalVisible = true"
          >
            <icon-file :size="15" />
          </a-button>
        </a-tooltip>

        <!-- 选择插件 -->
        <a-popover position="tl" trigger="click">
          <a-tooltip
            v-if="isSupportPluginComputed"
            :content="$t('chatWindow.selectPlugin')"
            position="top"
            mini
            :content-style="{ fontSize: '12px' }"
          >
            <a-button
              size="mini"
              :type="
                chatPluginStore.getPluginListByIds(currentAssistant.chatPluginIdList).length > 0
                  ? 'primary'
                  : undefined
              "
              shape="round"
            >
              <icon-experiment :size="15" />
            </a-button>
          </a-tooltip>
          <template #content>
            <div class="chat-plugin-select">
              <a-checkbox-group
                v-if="chatPluginStore.chatPluginList.length > 0"
                v-model="currentAssistant.chatPluginIdList"
                direction="vertical"
              >
                <a-checkbox v-for="p in chatPluginStore.chatPluginList" :key="p.id" :value="p.id"
                  >{{ p.name }}
                </a-checkbox>
              </a-checkbox-group>
              <a-empty v-else>
                <template #image></template>
                {{ $t('chatWindow.noPlugin') }}
              </a-empty>
            </div>
          </template>
        </a-popover>

        <!-- 发音开始/停止 -->
        <a-tooltip
          v-if="isSupportSpeech(currentAssistant.provider)"
          :content="$t('chatWindow.startSpeech')"
          position="tr"
          mini
          :content-style="{ fontSize: '12px' }"
        >
          <a-button
            v-if="speechStatus === SpeechStatus.STOP"
            size="mini"
            shape="round"
            style="margin-left: auto"
            @click="startSpeech(currentAssistant.chatMessageList.at(-1)?.content)"
          >
            <icon-sound :size="15" />
          </a-button>
          <a-button
            v-else
            size="mini"
            shape="round"
            status="danger"
            style="margin-left: auto"
            @click="stopSpeech()"
          >
            <icon-loading v-if="speechStatus === SpeechStatus.LOADING" spin :size="15" />
            <icon-record-stop v-else :size="15" />
          </a-button>
        </a-tooltip>
      </div>
      <div class="chat-input">
        <transition name="fadein">
          <div v-if="selectImageList.length > 0" class="chat-input-image">
            <a-image
              width="80"
              height="80"
              :src="`file://${selectImageList[0].file?.path}`"
              preview
              show-loader
              fit="cover"
            />
            <a-button
              class="chat-input-image-delete-btn"
              shape="circle"
              size="mini"
              status="danger"
              @click="selectImageList = []"
            >
              <icon-delete />
            </a-button>
          </div>
        </transition>

        <a-space direction="vertical" :size="10" style="width: 100%">
          <!-- 文本域 -->
          <a-textarea
            ref="chatInputTextareaRef"
            v-model="question"
            class="chat-input-textarea"
            :placeholder="$t('chatWindow.inputPlaceholder.' + currentAssistant.type)"
            :auto-size="{
              minRows: 2,
              maxRows: 2
            }"
            allow-clear
            @keydown.enter="sendQuestion"
            @paste="handleInputPaste"
          />
          <!-- 输入框区域底部 -->
          <div class="chat-input-bottom">
            <div style="margin-left: auto">
              <!-- 发送消息按钮 -->
              <a-button
                v-if="!systemStore.chatWindowLoading"
                type="primary"
                size="small"
                @click="sendQuestion()"
              >
                <a-space :size="5">
                  <icon-send :size="15" />
                  <span>{{ $t('chatWindow.send') }}</span>
                </a-space>
              </a-button>
              <!-- 停止回答按钮 -->
              <a-button v-if="systemStore.chatWindowLoading" size="small" @click="stopAnswer()">
                <a-space :size="5">
                  <icon-record-stop :size="15" />
                  <span>{{ $t('chatWindow.stop') }}</span>
                </a-space>
              </a-button>
            </div>
            <!-- 底部多选操作区域 -->
            <transition name="slide2top">
              <MultipleChoiceConsole
                v-if="multipleChoiceFlag"
                :current-assistant="currentAssistant"
                :multiple-choice-list="multipleChoiceList"
                :is-virtual="isVirtual"
                @close="multipleChoiceClose()"
              />
            </transition>
          </div>
        </a-space>
      </div>
    </div>

    <!-- 提示词列表modal -->
    <PromptList v-model:modal-visible="promptListModalVisible" @select-prompt="selectPrompt" />

    <!-- 文件列表modal -->
    <ChatWindowFileList
      v-model:modal-visible="fileListModalVisible"
      v-model:select-file-list="selectFileList"
    />
  </div>
</template>

<style lang="less" scoped>
@import '../../../../assets/css/chat-window.less';

.chat-plugin-select {
  max-height: 40vh;
  overflow-y: auto;
  padding: 0 5px;
}
</style>
