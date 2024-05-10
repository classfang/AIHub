<script setup lang="ts">
import AssistantAvatar from '@renderer/components/avatar/AssistantAvatar.vue'
import { useSystemStore } from '@renderer/store/system'
import { useUserStore } from '@renderer/store/user'
import { nowTimestamp } from '@renderer/utils/date-util'
import { simulateThreadWait } from '@renderer/utils/thread-util'
import { nextTick, onMounted, reactive, toRefs } from 'vue'

const userStore = useUserStore()
const systemStore = useSystemStore()

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
    'MoonshotAI',
    'StepFun',
    'DeepSeek'
  ] as BigModelProvider[],
  providerShowIndex: -1
})
const { providers, providerShowIndex } = toRefs(data)

onMounted(() => {
  // 轮流显示提供商Logo
  nextTick(async () => {
    if (
      nowTimestamp() - userStore.lastStartupTime > 24 * 60 * 60 * 1000 ||
      !systemStore.isStartup
    ) {
      for (let i = 0; i < data.providers.length; i++) {
        await simulateThreadWait(200)
        providerShowIndex.value++
      }
      await simulateThreadWait(2000)
    }
    if (systemStore.isStartup) {
      systemStore.isStartup = false
      systemStore.isWelcomeShow = false
      userStore.lastStartupTime = nowTimestamp()
    }
  })
})
</script>

<template>
  <div class="welcome-page z-index-max" @click="systemStore.isWelcomeShow = false">
    <div class="provider-list">
      <div class="provider-list-title">
        <div class="provider-list-title-left">{{ $t('welcomePage.title') }}</div>
        <div class="provider-list-title-right">&copy; 2024 Junki</div>
      </div>
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
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .provider-list {
    width: calc(50px * 5 + 40px * 4);
    display: flex;
    flex-wrap: wrap;
    gap: 40px;

    .provider-list-title {
      width: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;

      .provider-list-title-left {
        font-size: var(--font-size-xl);
        font-weight: 500;
      }

      .provider-list-title-right {
        color: var(--color-text-2);
        font-size: var(--font-size-sm);
      }
    }

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
