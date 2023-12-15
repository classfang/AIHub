<script setup lang="ts">
defineProps({
  provider: {
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
  <a-avatar v-if="provider === 'OpenAI'" shape="square" :size="size" class="assistant-avatar">
    <img alt="avatar" src="@renderer/assets/images/openai.png" />
  </a-avatar>
  <a-avatar v-else-if="provider === 'Gemini'" shape="square" :size="size" class="assistant-avatar">
    <img alt="avatar" src="@renderer/assets/images/gemini.png" />
  </a-avatar>
  <a-avatar v-else-if="provider === 'Spark'" shape="square" :size="size" class="assistant-avatar">
    <img alt="avatar" src="@renderer/assets/images/spark.png" />
  </a-avatar>
  <a-avatar
    v-else-if="provider === 'ERNIEBot'"
    shape="square"
    :size="size"
    class="assistant-avatar"
  >
    <img alt="avatar" src="@renderer/assets/images/ernie_bot.png" />
  </a-avatar>
  <a-avatar v-else-if="provider === 'Tongyi'" shape="square" :size="size" class="assistant-avatar">
    <img alt="avatar" src="@renderer/assets/images/tongyi.png" />
  </a-avatar>
</template>

<style lang="less" scoped>
.assistant-avatar {
  background-color: var(--color-bg-white);
}
</style>
