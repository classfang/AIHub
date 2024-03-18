<script setup lang="ts">
import AIDrawingConsole from '@renderer/components/views/ai-drawing/AIDrawingConsole.vue'
import AIDrawingImgCurrent from '@renderer/components/views/ai-drawing/AIDrawingImgCurrent.vue'
import AIDrawingImgList from '@renderer/components/views/ai-drawing/AIDrawingImgList.vue'
import AIDrawingInput from '@renderer/components/views/ai-drawing/AIDrawingInput.vue'
import { useSystemStore } from '@renderer/store/system'
import { randomUUID } from '@renderer/utils/id-util'
import { reactive } from 'vue'

// store
const systemStore = useSystemStore()

// 数据绑定
const data = reactive({
  currentSessionId: randomUUID()
})

// 开始生成
const startGenerate = () => {
  systemStore.aiDrawingLoading = true
}

// 停止生成
const stopGenerate = () => {
  systemStore.aiDrawingLoading = false
  data.currentSessionId = randomUUID()
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
