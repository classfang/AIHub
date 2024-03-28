<script setup lang="ts">
const content = defineModel<string>('content', { default: () => '' })
</script>

<template>
  <div class="note-editor">
    <a-textarea v-model="content" :placeholder="$t('collectionSet.note.contentPlaceholder')" />
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
    }
  }
}
</style>
