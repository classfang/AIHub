<script setup lang="ts">
import { nextTick } from 'vue'

// 绑定输入内容
const content = defineModel<string>('content', { default: () => '' })

// 监听输入
const noteEditorInput = (newValue: string) => {
  // 换行操作
  if (newValue === content.value + '\n') {
    const lines = content.value.split('\n')

    // 序号开头
    const matchResult = lines.at(-1)?.match(/^\d+\.\s/)
    if (matchResult) {
      // 追加序号
      nextTick(() => {
        content.value = `${newValue}${Number(matchResult[0].replace('. ', '')) + 1}. `
      })
    }
  }
}
</script>

<template>
  <div id="note-editor" class="note-editor">
    <a-textarea
      v-model="content"
      :placeholder="$t('collectionSet.note.contentPlaceholder')"
      @input="noteEditorInput"
    />
  </div>
</template>

<style scoped lang="less">
.note-editor {
  :deep(.arco-textarea-wrapper) {
    height: 100%;
    border: none;
    background-color: transparent;

    .arco-textarea {
      resize: none;
      height: 100%;
      padding: 15px;
      font-size: var(--font-size-default);
    }
  }
}
</style>
