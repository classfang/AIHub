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
  <a-avatar v-else-if="provider === 'Ollama'" shape="square" :size="size" class="assistant-avatar">
    <img alt="avatar" src="@renderer/assets/images/ollama.png" />
  </a-avatar>
  <a-avatar v-else-if="provider === 'Gemini'" shape="square" :size="size" class="assistant-avatar">
    <img alt="avatar" src="@renderer/assets/images/gemini.png" />
  </a-avatar>
  <a-avatar v-else-if="provider === 'Spark'" shape="square" :size="size" class="assistant-avatar">
    <img alt="avatar" src="@renderer/assets/images/spark.png" />
  </a-avatar>
  <a-avatar v-else-if="provider === 'ERNIE'" shape="square" :size="size" class="assistant-avatar">
    <img alt="avatar" src="@renderer/assets/images/ernie_bot.png" />
  </a-avatar>
  <a-avatar v-else-if="provider === 'Tongyi'" shape="square" :size="size" class="assistant-avatar">
    <img alt="avatar" src="@renderer/assets/images/tongyi.png" />
  </a-avatar>
  <a-avatar
    v-else-if="provider === 'Tiangong'"
    shape="square"
    :size="size"
    class="assistant-avatar"
  >
    <img alt="avatar" src="@renderer/assets/images/tiangong.png" />
  </a-avatar>
  <a-avatar
    v-else-if="provider === 'MoonshotAI'"
    shape="square"
    :size="size"
    class="assistant-avatar"
  >
    <img alt="avatar" src="@renderer/assets/images/moonshot.png" />
  </a-avatar>
  <a-avatar v-else-if="provider === 'ZhipuAI'" shape="square" :size="size" class="assistant-avatar">
    <img alt="avatar" src="@renderer/assets/images/zhipu.png" />
  </a-avatar>
</template>

<style lang="less" scoped>
.assistant-avatar {
  :deep(.arco-avatar-image) {
    background-color: var(--color-bg-white);

    img {
      object-fit: contain;
    }
  }
}
</style>
