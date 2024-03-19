<script setup lang="ts">
import { Modal } from '@arco-design/web-vue'
import { useDrawingStore } from '@renderer/store/drawing'
import { useSystemStore } from '@renderer/store/system'
import { randomUUID } from '@renderer/utils/id-util'
import { useI18n } from 'vue-i18n'

// i18n
const { t } = useI18n()

// store
const systemStore = useSystemStore()
const drawingStore = useDrawingStore()

// 新建
const newDrawingTask = () => {
  if (systemStore.aiDrawingLoading) {
    return
  }
  const id = randomUUID()
  drawingStore.drawingTaskList.unshift({
    id: id,
    provider: 'OpenAI',
    model: 'dall-e-3',
    imageList: [],
    prompt: '',
    options: { size: '1024x1024', style: 'vivid', quality: 'standard' }
  })
  drawingStore.currentTaskId = id
}

// 切换
const drawingTaskClick = (taskId: string) => {
  if (systemStore.aiDrawingLoading) {
    return
  }
  drawingStore.currentTaskId = taskId
}

// 删除
const deleteDrawingTask = (taskId: string) => {
  if (systemStore.aiDrawingLoading) {
    return
  }
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: t('common.deleteConfirmContent'),
    okText: t('common.ok'),
    cancelText: t('common.cancel'),
    onOk: () => {
      drawingStore.drawingTaskList = drawingStore.drawingTaskList.filter((t) => t.id !== taskId)
    }
  })
}
</script>

<template>
  <div class="ai-drawing-img-list">
    <div class="ai-drawing-img-new" @click="newDrawingTask()">
      <icon-plus />
    </div>
    <div
      v-for="dt in drawingStore.drawingTaskList"
      :key="dt.id"
      class="ai-drawing-img-item"
      @click="drawingTaskClick(dt.id)"
    >
      <a-image
        v-if="dt.imageList[0]"
        width="100"
        height="100"
        :src="`file://${dt.imageList[0]}`"
        show-loader
        fit="cover"
        :preview="false"
      >
      </a-image>
      <div v-else class="ai-drawing-img-default">
        <icon-image size="20" />
      </div>
      <a-button
        class="ai-drawing-img-delete-btn"
        shape="circle"
        size="mini"
        status="danger"
        @click.stop="deleteDrawingTask(dt.id)"
      >
        <icon-delete />
      </a-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.ai-drawing-img-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  overflow-y: auto;
  padding-right: 5px;
  box-sizing: border-box;

  .ai-drawing-img-new {
    flex-shrink: 0;
    width: 100px;
    height: 100px;
    background-color: var(--color-fill-3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-3);
    font-size: 20px;
    cursor: pointer;
    transition: all 200ms;

    &:hover {
      color: var(--color-text-2);
    }
  }

  .ai-drawing-img-item {
    position: relative;
    cursor: pointer;

    .ai-drawing-img-delete-btn {
      position: absolute;
      top: 3px;
      right: 3px;
      opacity: 0;
      transition: opacity 200ms;
    }

    &:hover {
      .ai-drawing-img-delete-btn {
        opacity: 1;
      }
    }

    .ai-drawing-img-default {
      flex-shrink: 0;
      width: 100px;
      height: 100px;
      background-color: var(--color-fill-3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-3);
    }
  }
}
</style>
