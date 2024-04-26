<script setup lang="ts">
import AssistantAvatar from '@renderer/components/avatar/AssistantAvatar.vue'
import {
  isSupportImage,
  isSupportNetwork,
  isSupportPlugin
} from '@renderer/utils/big-model/base-util'

defineProps({
  assistant: {
    type: Object as () => Assistant,
    default: () => ({})
  }
})
</script>

<template>
  <div class="chat-window-welcome">
    <a-space :size="10">
      <AssistantAvatar :provider="assistant.provider" :size="30" />
      <div class="provider-name">{{ assistant.provider }}</div>
    </a-space>
    <div class="model-name">{{ assistant.model }}</div>
    <a-space :size="10">
      <a-tag v-if="isSupportImage(assistant.provider, assistant.model)" color="green">
        <template #icon>
          <icon-check />
        </template>
        {{ $t('assistantList.imageSupported') }}
      </a-tag>
      <a-tag v-else color="gray">
        <template #icon>
          <icon-close />
        </template>
        {{ $t('assistantList.imageNotSupported') }}
      </a-tag>
      <a-tag v-if="isSupportPlugin(assistant.provider, assistant.model)" color="green">
        <template #icon>
          <icon-check />
        </template>
        {{ $t('assistantList.pluginSupported') }}
      </a-tag>
      <a-tag v-else color="gray">
        <template #icon>
          <icon-close />
        </template>
        {{ $t('assistantList.pluginNotSupported') }}
      </a-tag>
      <a-tag v-if="isSupportNetwork(assistant.provider, assistant.model)" color="green">
        <template #icon>
          <icon-check />
        </template>
        {{ $t('assistantList.networkSupported') }}
      </a-tag>
      <a-tag v-else color="gray">
        <template #icon>
          <icon-close />
        </template>
        {{ $t('assistantList.networkNotSupported') }}
      </a-tag>
    </a-space>
  </div>
</template>

<style scoped lang="less">
.chat-window-welcome {
  box-sizing: border-box;
  padding: 15px;
  background-color: var(--color-fill-1);
  border-radius: var(--border-radius-small);
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;

  .provider-name {
    font-size: 24px;
    font-weight: 500;
    color: var(--color-text-1);
    line-height: 30px;
  }

  .model-name {
    font-size: 14px;
    color: var(--color-text-2);
    padding-bottom: 5px;
    border-bottom: 1px solid var(--color-text-3);
  }
}
</style>
