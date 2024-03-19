<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import AIDrawingConsole from '@renderer/components/views/ai-drawing/AIDrawingConsole.vue'
import AIDrawingImgCurrent from '@renderer/components/views/ai-drawing/AIDrawingImgCurrent.vue'
import AIDrawingImgList from '@renderer/components/views/ai-drawing/AIDrawingImgList.vue'
import AIDrawingInput from '@renderer/components/views/ai-drawing/AIDrawingInput.vue'
import { useDrawingStore } from '@renderer/store/drawing'
import { useNotificationStore } from '@renderer/store/notification'
import { useSettingStore } from '@renderer/store/setting'
import { useSystemStore } from '@renderer/store/system'
import { CommonDrawingOption, drawingByBigModel } from '@renderer/utils/big-model'
import { randomUUID } from '@renderer/utils/id-util'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

// store
const systemStore = useSystemStore()
const drawingStore = useDrawingStore()
const settingStore = useSettingStore()
const notificationStore = useNotificationStore()

// i18n
const { t } = useI18n()

// 阻断控制
let abortCtr = new AbortController()

// 数据绑定
const data = reactive({
  currentSessionId: randomUUID()
})

// 开始生成
const startGenerate = () => {
  // 检查大模型配置
  let configErrorFlag = false
  switch (drawingStore.getCurrentTask.provider) {
    case 'OpenAI':
      if (!settingStore.openAI.baseUrl || !settingStore.openAI.key) {
        configErrorFlag = true
      }
      break
    case 'Spark':
      if (!settingStore.spark.appId || !settingStore.spark.secret || !settingStore.spark.key) {
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
      content: t(`chatWindow.configMiss.${drawingStore.getCurrentTask.provider}`),
      okText: t('common.goSetting'),
      cancelText: t('common.cancel'),
      onOk: () => {
        systemStore.openSettingModal('bigModel')
      }
    })
    return
  }

  // 加载中
  systemStore.aiDrawingLoading = true

  // 公共配置参数
  const options: CommonDrawingOption = {
    sessionId: data.currentSessionId,
    prompt: drawingStore.getCurrentTask.prompt,
    negativePrompt: drawingStore.getCurrentTask.negativePrompt,
    model: drawingStore.getCurrentTask.model,
    size: drawingStore.getCurrentTask.options.size,
    quality: drawingStore.getCurrentTask.options.quality,
    style: drawingStore.getCurrentTask.options.style,
    n: drawingStore.getCurrentTask.options.n,
    imageGenerated: (sessionId: string, imageUrl: string) => {
      if (data.currentSessionId != sessionId) {
        return
      }
      drawingStore.getCurrentTask.imageList[0] = imageUrl
    },
    end: (sessionId: string, errMsg?: any) => {
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
      systemStore.aiDrawingLoading = false
    },
    abortCtr: abortCtr
  }
  // 各家大模型特有选项
  let otherOption = {}
  switch (drawingStore.getCurrentTask.provider) {
    case 'OpenAI':
      otherOption = {
        apiKey: settingStore.openAI.key,
        baseURL: settingStore.openAI.baseUrl
      }
      break
    case 'Spark':
      otherOption = {
        appId: settingStore.spark.appId,
        secretKey: settingStore.spark.secret,
        apiKey: settingStore.spark.key
      }
      break
    case 'Tongyi':
      otherOption = {
        apiKey: settingStore.tongyi.apiKey
      }
      break
  }

  // 调用能力
  drawingByBigModel(drawingStore.getCurrentTask.provider, {
    ...options,
    ...otherOption
  })
}

// 停止生成
const stopGenerate = () => {
  data.currentSessionId = randomUUID()
  systemStore.aiDrawingLoading = false
  abortCtr.abort()
  abortCtr = new AbortController()
}
</script>

<template>
  <div class="ai-drawing">
    <!-- 头部 -->
    <div class="ai-drawing-header drag-area">
      <div class="ai-drawing-header-title">{{ $t('aiDrawing.name') }}</div>
    </div>
    <!-- 主体 -->
    <div class="ai-drawing-body">
      <div class="ai-drawing-body-left">
        <AIDrawingConsole />
      </div>
      <div class="ai-drawing-body-right">
        <div class="ai-drawing-img-area">
          <AIDrawingImgCurrent class="ai-drawing-img-current" />
          <AIDrawingImgList class="ai-drawing-img-list" />
        </div>
        <AIDrawingInput
          class="ai-drawing-input"
          @start-generate="startGenerate"
          @stop-generate="stopGenerate"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.ai-drawing {
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  .ai-drawing-header {
    flex-shrink: 0;
    height: 40px;
    border-bottom: 1px solid var(--color-border-1);
    box-sizing: border-box;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .ai-drawing-header-title {
      flex-grow: 1;
      font-size: 15px;
      font-weight: 500;
    }
  }

  .ai-drawing-body {
    flex-grow: 1;
    min-height: 0;
    display: flex;

    .ai-drawing-body-left {
      width: 270px;
      flex-shrink: 0;
      border-right: 1px solid var(--color-border-1);
      box-sizing: border-box;
      overflow-y: auto;
    }

    .ai-drawing-body-right {
      flex-grow: 1;
      display: flex;
      flex-direction: column;

      .ai-drawing-img-area {
        flex: 1;
        min-height: 0;
        display: flex;
        gap: 10px;
        box-sizing: border-box;
        padding: 15px 10px 15px 15px;

        .ai-drawing-img-current {
          flex-grow: 1;
        }

        .ai-drawing-img-list {
          flex-shrink: 0;
        }
      }

      .ai-drawing-input {
        flex-shrink: 0;
      }
    }
  }
}
</style>
