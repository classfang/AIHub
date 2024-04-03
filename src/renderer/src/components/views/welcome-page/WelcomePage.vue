<script setup lang="ts">
import AssistantAvatar from '@renderer/components/avatar/AssistantAvatar.vue'
import { simulateThreadWait } from '@renderer/utils/thread-util'
import { nextTick, onMounted, reactive, toRefs } from 'vue'

const data = reactive({
  providers: ['OpenAI', 'Ollama', 'Gemini', 'Tongyi', 'ERNIE', 'Spark', 'Tiangong', 'MoonshotAI']
})
const { providers } = toRefs(data)

onMounted(() => {
  nextTick(async () => {
    const providerItems = document.getElementsByClassName('provider-item')
    if (providerItems) {
      for (const providerItem of providerItems) {
        await simulateThreadWait(200)
        providerItem.classList.add('provider-item-show')
      }
    }
  })
})
</script>

<template>
  <div class="welcome-page">
    <div class="provider-list">
      <AssistantAvatar
        v-for="p in providers"
        :key="p"
        class="provider-item"
        :provider="p"
        :size="50"
      />
    </div>
  </div>
</template>

<style scoped lang="less">
.welcome-page {
  width: 100vw;
  height: 100vh;
  background-color: var(--color-fill-2);
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  .provider-list {
    width: calc(50px * 4 + 40px * 3);
    display: flex;
    flex-wrap: wrap;
    gap: 40px;

    .provider-item {
      opacity: 0;
      transition: all 500ms linear;
    }

    .provider-item-show {
      opacity: 1;
    }
  }
}
</style>
