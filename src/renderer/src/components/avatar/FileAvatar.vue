<script setup lang="ts">
defineProps({
  type: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 30
  }
})
</script>

<template>
  <img
    v-if="type === 'txt'"
    :height="size"
    alt="avatar"
    src="@renderer/assets/images/file-txt.png"
  />
  <img
    v-else-if="type === 'pdf'"
    :height="size"
    alt="avatar"
    src="@renderer/assets/images/file-pdf.png"
  />
  <img
    v-else-if="type === 'docx'"
    :height="size"
    alt="avatar"
    src="@renderer/assets/images/file-docx.png"
  />
  <img
    v-else-if="type === 'xlsx'"
    :height="size"
    alt="avatar"
    src="@renderer/assets/images/file-xlsx.png"
  />
  <img
    v-else-if="type === 'pptx'"
    :height="size"
    alt="avatar"
    src="@renderer/assets/images/file-pptx.png"
  />
  <img v-else alt="avatar" :height="size" src="@renderer/assets/images/file-other.png" />
</template>

<style lang="less" scoped></style>
