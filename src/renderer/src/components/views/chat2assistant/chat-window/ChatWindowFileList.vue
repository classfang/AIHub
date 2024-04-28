<script setup lang="ts">
import { FileItem, RequestOption } from '@arco-design/web-vue'

const modalVisible = defineModel<boolean>('modalVisible', { default: () => false })
const selectFileList = defineModel<FileItem[]>('selectFileList', { default: () => [] })

const selectFileRequest = (option: RequestOption) => {
  const { fileItem, onSuccess } = option
  selectFileList.value.push(fileItem)
  onSuccess()

  return {
    abort: () => {}
  }
}
</script>

<template>
  <a-modal
    v-model:visible="modalVisible"
    :footer="false"
    unmount-on-close
    title-align="start"
    width="80vw"
  >
    <template #title>{{ $t('chatWindow.fileList.title') }}</template>
    <div class="file-list-page">
      <a-alert class="file-list-page-tip">{{ $t('chatWindow.fileList.tip') }}</a-alert>
      <a-upload
        v-model:file-list="selectFileList"
        :custom-request="selectFileRequest"
        accept=".txt, .pdf, .docx, .pptx"
        multiple
        draggable
      >
      </a-upload>
    </div>
  </a-modal>
</template>

<style lang="less" scoped>
.file-list-page {
  height: 60vh;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .file-list-page-tip {
    flex-shrink: 0;
  }

  :deep(.arco-upload-wrapper) {
    flex-grow: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .arco-upload-list {
      overflow-x: hidden;
      overflow-y: auto;
    }
  }
}
</style>
