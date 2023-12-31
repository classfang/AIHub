<script setup lang="ts">
import { useSystemStore } from '@renderer/store/system'
import { computed, nextTick, onMounted, reactive, ref, toRefs } from 'vue'
import UserAvatar from '@renderer/components/avatar/UserAvatar.vue'
import AssistantAvatar from '@renderer/components/avatar/AssistantAvatar.vue'
import MultipleChoiceConsole from '@renderer/components/views/chat2assistant/chat-window/MultipleChoiceConsole.vue'
import ChatWindowHeader from '@renderer/components/views/chat2assistant/chat-window/ChatWindowHeader.vue'
import { useI18n } from 'vue-i18n'
import { useSettingStore } from '@renderer/store/setting'
import { FileItem, Message, Modal, RequestOption } from '@arco-design/web-vue'
import { getContentTokensLength } from '@renderer/utils/gpt-tokenizer-util'
import { downloadFile } from '@renderer/utils/download-util'
import { nowTimestamp } from '@renderer/utils/date-util'
import { randomUUID } from '@renderer/utils/id-util'
import { renderMarkdown } from '@renderer/utils/markdown-util'
import { useAssistantStore } from '@renderer/store/assistant'
import { clipboardWriteText } from '@renderer/utils/ipc-util'
import { saveFileByPath } from '@renderer/utils/ipc-util'
import { CommonChatOption, chat2bigModel } from '@renderer/utils/big-model'
import dayjs from 'dayjs'

// store
const systemStore = useSystemStore()
const settingStore = useSettingStore()
const assistantStore = useAssistantStore()

// i18n
const { t } = useI18n()

// 元素 ref
const chatMessageListScrollbarRef = ref()
const chatMessageListRef = ref()
const chatInputTextareaRef = ref()

// 阻断控制
const abortCtr = new AbortController()

// 数据绑定
const data = reactive({
  // 聊天窗口加载完毕
  isLoad: false,
  // 用于判断是否切换聊天窗口
  sessionId: randomUUID(),
  // 当前的助手
  currentAssistant: assistantStore.getCurrentAssistant,
  // 输入的问题
  question: '',
  // 上传图片选择
  selectImageList: [] as FileItem[],
  // 判断大模型是否已经回答
  waitAnswer: false,
  // 是否打开多选
  multipleChoiceFlag: false,
  // 多选消息列表
  multipleChoiceList: [] as string[]
})
const {
  isLoad,
  currentAssistant,
  question,
  selectImageList,
  waitAnswer,
  multipleChoiceFlag,
  multipleChoiceList
} = toRefs(data)

// 支持图片上传 TODO 'qwen-vl-plus' 暂不支持base64图片
const isSupportImage = computed(() => {
  return ['gpt-4-vision-preview', 'gemini-pro-vision'].includes(data.currentAssistant.model)
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
    await useBigModel(data.sessionId)
  } catch (e) {
    console.log('big model error: ', e)
    Message.error(e ? e + '' : t(`chatWindow.error.${data.currentAssistant.provider}`))
    systemStore.chatWindowLoading = false
    data.waitAnswer = false
  }
}

// 使用大模型
const useBigModel = async (sessionId: string) => {
  // 检查大模型配置
  let configErrorFlag = false
  switch (data.currentAssistant.provider) {
    case 'OpenAI':
      if (!settingStore.openAI.baseUrl || !settingStore.openAI.key) {
        configErrorFlag = true
      }
      break
    case 'Gemini':
      if (!settingStore.gemini.baseUrl || !settingStore.gemini.key) {
        configErrorFlag = true
      }
      break
    case 'Spark':
      if (!settingStore.spark.appId || !settingStore.spark.secret || !settingStore.spark.key) {
        configErrorFlag = true
      }
      break
    case 'ERNIEBot':
      if (!settingStore.ernieBot.apiKey || !settingStore.ernieBot.secretKey) {
        configErrorFlag = true
      }
      break
    case 'Tongyi':
      if (!settingStore.tongyi.apiKey) {
        configErrorFlag = true
      }
      break
  }
  if (configErrorFlag) {
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
    const imagePath = data.selectImageList[0].file?.path
    // 将图片本地链接保存
    if (isSupportImage.value && imagePath) {
      questionImage = await saveFileByPath(
        imagePath,
        `${randomUUID()}${imagePath.substring(imagePath.lastIndexOf('.'))}`
      )
    }
    data.selectImageList = []
  }

  // 用户消息追加
  data.currentAssistant.chatMessageList.push({
    id: randomUUID(),
    type: 'text',
    role: 'user',
    content: question,
    image: questionImage,
    createTime: nowTimestamp()
  })
  scrollToBottom()

  // 大模型通用选项
  const chat2bigModelOption: CommonChatOption = {
    model: data.currentAssistant.model,
    instruction: data.currentAssistant.instruction,
    inputMaxTokens: data.currentAssistant.inputMaxTokens,
    contextSize: data.currentAssistant.contextSize,
    messages: data.currentAssistant.chatMessageList,
    checkSession: () => sessionId === data.sessionId,
    startAnswer: (content) => {
      data.currentAssistant.chatMessageList.push({
        id: randomUUID(),
        type: 'text',
        role: 'assistant' as ChatRole,
        content,
        createTime: nowTimestamp()
      })
      scrollToBottom()
      data.waitAnswer = false
    },
    appendAnswer: (content: string) => {
      data.currentAssistant.chatMessageList[
        data.currentAssistant.chatMessageList.length - 1
      ].content += content
      scrollToBottom()
    },
    end: (errMsg: any) => {
      errMsg && Message.error(errMsg)
      // 关闭等待
      data.waitAnswer = false
      systemStore.chatWindowLoading = false
    }
  }

  // 各家大模型特有选项
  let otherOption = {}
  switch (data.currentAssistant.provider) {
    case 'OpenAI':
      otherOption = {
        apiKey: settingStore.openAI.key,
        baseURL: settingStore.openAI.baseUrl,
        type: data.currentAssistant.type,
        maxTokens: data.currentAssistant.maxTokens,
        imagePrompt: question,
        imageSize: data.currentAssistant.imageSize,
        imageQuality: data.currentAssistant.imageQuality,
        imageStyle: data.currentAssistant.imageStyle,
        imageGenerated: (imageUrl: string) => {
          data.currentAssistant.chatMessageList.push({
            id: randomUUID(),
            type: 'img',
            role: 'assistant' as ChatRole,
            content: '',
            image: imageUrl,
            createTime: nowTimestamp()
          })
          scrollToBottom()
          data.waitAnswer = false
        }
      }
      break
    case 'Gemini':
      otherOption = {
        apiKey: settingStore.gemini.key,
        baseURL: settingStore.gemini.baseUrl,
        maxTokens: data.currentAssistant.maxTokens,
        abortCtr: abortCtr
      }
      break
    case 'Spark':
      otherOption = {
        appId: settingStore.spark.appId,
        secretKey: settingStore.spark.secret,
        apiKey: settingStore.spark.key
      }
      break
    case 'ERNIEBot':
      otherOption = {
        apiKey: settingStore.ernieBot.apiKey,
        secretKey: settingStore.ernieBot.secretKey,
        abortCtr: abortCtr
      }
      break
    case 'Tongyi':
      otherOption = {
        apiKey: settingStore.tongyi.apiKey,
        type: data.currentAssistant.type,
        imagePrompt: question,
        imageSize: data.currentAssistant.imageSize,
        imageStyle: data.currentAssistant.imageStyle,
        abortCtr,
        imageGenerated: (imageUrl: string) => {
          data.currentAssistant.chatMessageList.push({
            id: randomUUID(),
            type: 'img',
            role: 'assistant' as ChatRole,
            content: '',
            image: imageUrl,
            createTime: nowTimestamp()
          })
          scrollToBottom()
          data.waitAnswer = false
        }
      }
      break
  }

  // 大模型能力调用
  await chat2bigModel(data.currentAssistant.provider, {
    ...chat2bigModelOption,
    ...otherOption
  })
}

// 手动结束回答
const stopAnswer = () => {
  data.sessionId = randomUUID()
  systemStore.chatWindowLoading = false
  data.waitAnswer = false
  abortCtr.abort()
}

// 自定义图片上传
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
const multipleChoiceOpen = (id: string) => {
  if (systemStore.chatWindowLoading) {
    return
  }
  data.multipleChoiceFlag = true
  multipleChoiceChange(id)
}

// 关闭多选
const multipleChoiceClose = () => {
  data.multipleChoiceList = []
  data.multipleChoiceFlag = false
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
const scrollToBottom = () => {
  nextTick(() => {
    chatMessageListScrollbarRef.value.scrollTop(chatMessageListRef.value.clientHeight)
  })
}

// 挂载完毕
onMounted(() => {
  // 对话记录滚动到底部
  scrollToBottom()
  // 防止滚动闪烁
  data.isLoad = true
  // 聚焦输入框
  chatInputTextareaRef.value.focus()
})
</script>

<template>
  <div class="chat-window">
    <!-- 头部 -->
    <ChatWindowHeader :current-assistant="currentAssistant" />

    <!-- 消息列表 -->
    <a-scrollbar
      ref="chatMessageListScrollbarRef"
      :class="{ 'fade-in-to': isLoad }"
      class="fade-in-from"
      outer-class="chat-message-list-container arco-scrollbar-small"
      style="height: calc(100vh - 150px - 55px); overflow-y: auto"
    >
      <div ref="chatMessageListRef" class="chat-message-list">
        <template v-for="(msg, index) in currentAssistant.chatMessageList" :key="msg.id">
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
            <div class="chat-message">
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
                      index === currentAssistant.chatMessageList.length - 1 &&
                        systemStore.chatWindowLoading
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
                      name="下载"
                      @click="downloadFile(`file://${msg.image}`, `img-${msg.id}.png`)"
                      ><icon-download
                    /></a-image-preview-action>
                  </template>
                </a-image>
              </div>
            </div>
            <!-- 右键菜单内容 -->
            <template #content>
              <a-doption @click="clipboardWriteText(msg.content)">{{
                $t('chatWindow.copy')
              }}</a-doption>
              <a-doption @click="multipleChoiceOpen(msg.id)">{{
                $t('chatWindow.multipleChoice')
              }}</a-doption>
            </template>
          </a-dropdown>
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
    <div class="chat-input">
      <!-- 文本域 -->
      <a-textarea
        ref="chatInputTextareaRef"
        v-model="question"
        class="chat-input-textarea"
        :placeholder="$t('chatWindow.inputPlaceholder.' + currentAssistant.type)"
        :auto-size="{
          minRows: 4,
          maxRows: 4
        }"
        allow-clear
        @keydown.enter="sendQuestion"
      />
      <!-- 输入框区域底部 -->
      <div class="chat-input-bottom">
        <!-- 图片选择 -->
        <div v-if="isSupportImage" class="chat-input-select-image">
          <a-upload
            :file-list="selectImageList"
            :limit="1"
            :custom-request="selectImageRequest"
            accept="image/*"
          >
            <template #upload-button>
              <a-button size="small">
                <a-space :size="5">
                  <icon-image :size="15" />
                  <span>{{ $t('chatWindow.selectImage') }}</span>
                </a-space>
              </a-button>
            </template>
          </a-upload>
        </div>
        <!-- 发送消息按钮 -->
        <a-button v-if="!systemStore.chatWindowLoading" size="small" @click="sendQuestion()">
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
        <!-- 底部多选操作区域 -->
        <transition name="slide2top">
          <MultipleChoiceConsole
            v-if="multipleChoiceFlag"
            :current-assistant="currentAssistant"
            :multiple-choice-list="multipleChoiceList"
            @close="multipleChoiceClose()"
          />
        </transition>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '../../../../assets/css/chat-window.less';
</style>
