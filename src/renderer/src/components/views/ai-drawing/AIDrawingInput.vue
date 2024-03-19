<script setup lang="ts">
import { useDrawingStore } from '@renderer/store/drawing'
import { useSystemStore } from '@renderer/store/system'

// store
const systemStore = useSystemStore()
const drawingStore = useDrawingStore()

// 定义事件
const emits = defineEmits(['startGenerate', 'stopGenerate'])

// 开始生成
const startGenerate = (event?: KeyboardEvent) => {
  // 加载中、内容为空、输入法回车，不发送消息
  if (
    systemStore.aiDrawingLoading ||
    !drawingStore.getCurrentTask.prompt.trim() ||
    event?.isComposing
  ) {
    event?.preventDefault()
    return
  } else if (event?.shiftKey) {
    return
  } else {
    event?.preventDefault()
  }

  emits('startGenerate')
}
</script>

<template>
  <div class="ai-drawing-input">
    <!-- 文本域 -->
    <a-textarea
      v-model="drawingStore.getCurrentTask.prompt"
      class="ai-drawing-prompt-textarea"
      :placeholder="$t('aiDrawing.promptPlaceholder')"
      :auto-size="{
        minRows: 2,
        maxRows: 2
      }"
      allow-clear
      @keydown.enter="startGenerate"
    />
    <!-- 输入框区域底部 -->
    <div class="ai-drawing-prompt-bottom">
      <div style="margin-left: auto">
        <!-- 发送消息按钮 -->
        <a-button
          v-if="!systemStore.aiDrawingLoading"
          type="primary"
          size="small"
          @click="startGenerate()"
        >
          <a-space :size="5">
            <icon-palette :size="15" />
            <span>{{ $t('aiDrawing.start') }}</span>
          </a-space>
        </a-button>
        <!-- 停止回答按钮 -->
        <a-button v-if="systemStore.aiDrawingLoading" size="small" @click="emits('stopGenerate')">
          <a-space :size="5">
            <icon-record-stop :size="15" />
            <span>{{ $t('aiDrawing.stop') }}</span>
          </a-space>
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.ai-drawing-input {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border-1);
  padding-top: 10px;

  .ai-drawing-prompt-textarea {
    border: none;
    background-color: transparent;
    box-sizing: border-box;
    padding: 0 3px;
  }

  .ai-drawing-prompt-bottom {
    box-sizing: border-box;
    padding: 0 15px 15px 15px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
}
</style>
