<script setup lang="ts">
import AssistantAvatar from '@renderer/components/avatar/AssistantAvatar.vue'
import { simulateThreadWait } from '@renderer/utils/thread-util'
import { nextTick, onMounted, reactive, toRefs } from 'vue'

const finish = defineModel<boolean>('finish', { default: () => false })

const data = reactive({
  providers: [
    'OpenAI',
    'Ollama',
    'Gemini',
    'ZhipuAI',
    'Tongyi',
    'ERNIE',
    'Spark',
    'Tiangong',
    'MoonshotAI'
  ],
  providerShowIndex: -1
})
const { providers, providerShowIndex } = toRefs(data)

onMounted(() => {
  // 轮流显示提供商Logo
  nextTick(async () => {
    for (let i = 0; i < data.providers.length; i++) {
      await simulateThreadWait(200)
      providerShowIndex.value++
    }
    await simulateThreadWait(2000)
    finish.value = true
  })
})
</script>

<template>
  <div class="welcome-page z-index-max">
    <div class="provider-list">
      <AssistantAvatar
        v-for="(p, index) in providers"
        :key="p"
        class="provider-item"
        :class="{ 'provider-item-show': index <= providerShowIndex }"
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
    width: calc(50px * 5 + 40px * 4);
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
