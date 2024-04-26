<script setup lang="ts">
import { useChatPluginStore } from '@renderer/store/chat-plugin'

const chatPluginStore = useChatPluginStore()

const props = defineProps({
  chatPlugin: {
    type: Object as () => ChatPlugin,
    default: () => ({})
  }
})

const itemActive = () => {
  chatPluginStore.currentChatPluginId = props.chatPlugin.id
}
</script>

<template>
  <div
    class="chat-plugin-item"
    :class="{
      'item-active': chatPluginStore.currentChatPluginId === chatPlugin.id
    }"
    @click="itemActive"
  >
    <div class="chat-plugin-item-body">
      <div class="chat-plugin-item-header">
        <div class="chat-plugin-item-name">{{ chatPlugin.name }}</div>
      </div>
      <div class="chat-plugin-item-content">{{ chatPlugin.description }}</div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.chat-plugin-item {
  width: 100%;
  box-sizing: border-box;
  padding: 15px;
  background-color: var(--color-fill-1);
  border-radius: var(--border-radius-small);
  display: flex;
  align-items: center;
  gap: 10px;

  .chat-plugin-item-body {
    height: 40px;
    flex-grow: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .chat-plugin-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;

      .chat-plugin-item-name {
        flex-grow: 1;
        font-size: 15px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .chat-plugin-item-content {
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--color-text-3);
    }
  }
}
</style>
