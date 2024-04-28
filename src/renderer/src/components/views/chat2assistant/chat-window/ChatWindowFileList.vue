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
    <template #title>{{ $t('chatWindow.selectFile') }}</template>
    <div class="file-list-page">
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
  overflow-x: hidden;
  overflow-y: auto;
}
</style>
