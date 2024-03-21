<script setup lang="ts">
import { useDrawingStore } from '@renderer/store/drawing'
import { useSystemStore } from '@renderer/store/system'
import { downloadFile } from '@renderer/utils/download-util'
import { reactive, toRefs } from 'vue'

// store
const systemStore = useSystemStore()
const drawingStore = useDrawingStore()

// 数据绑定
const data = reactive({
  imageListIndex: 0
})
const { imageListIndex } = toRefs(data)
</script>

<template>
  <div class="ai-drawing-img-current">
    <a-spin :loading="systemStore.aiDrawingLoading" tip="">
      <template v-if="drawingStore.getCurrentTask.imageList.length > 0">
        <a-image
          width="500"
          height="500"
          :src="`file://${drawingStore.getCurrentTask.imageList[imageListIndex]}`"
          show-loader
          fit="cover"
        >
          <template #preview-actions>
            <a-image-preview-action
              :name="$t('common.download')"
              @click="
                downloadFile(
                  `file://${drawingStore.getCurrentTask.imageList[imageListIndex]}`,
                  `img-${drawingStore.getCurrentTask.id}-${imageListIndex}.png`
                )
              "
              ><icon-download
            /></a-image-preview-action>
          </template>
        </a-image>
        <div v-if="drawingStore.getCurrentTask.imageList.length > 1" class="image-index-list">
          <a-button
            v-for="i in drawingStore.getCurrentTask.imageList.length"
            :key="i"
            size="mini"
            shape="circle"
            :type="i === imageListIndex + 1 ? 'primary' : undefined"
            @click="imageListIndex = i - 1"
            >{{ i }}</a-button
          >
        </div>
      </template>
      <div v-else class="ai-drawing-img-default"></div>
    </a-spin>
  </div>
</template>

<style scoped lang="less">
.ai-drawing-img-current {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  :deep(.arco-image) {
    border-radius: 0;
  }

  .image-index-list {
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .ai-drawing-img-default {
    width: 500px;
    height: 500px;
    background-color: var(--color-fill-3);
  }
}
</style>
