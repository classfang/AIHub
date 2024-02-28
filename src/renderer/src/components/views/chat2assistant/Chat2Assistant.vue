<script setup lang="ts">
import AssistantList from '@renderer/components/views/chat2assistant/assistant-list/AssistantList.vue'
import ChatWindow from '@renderer/components/views/chat2assistant/chat-window/ChatWindow.vue'
import EmptyChatWindow from '@renderer/components/views/chat2assistant/chat-window/EmptyChatWindow.vue'
import { useAssistantStore } from '@renderer/store/assistant'

const assistantStore = useAssistantStore()
</script>

<template>
  <div class="chat-assistant">
    <div class="chat-assistant-left">
      <AssistantList class="assistant-list" />
    </div>
    <div class="chat-assistant-right">
      <ChatWindow
        v-if="assistantStore.currentAssistantId"
        :key="'chat-window-' + assistantStore.currentAssistantId"
        class="chat-window"
      />
      <EmptyChatWindow v-else />
    </div>
  </div>
</template>

<style lang="less" scoped>
.chat-assistant {
  width: 100%;
  flex-grow: 1;
  display: flex;
  overflow: hidden;

  .chat-assistant-left {
    flex-shrink: 0;
    width: 270px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--color-border-1);
    box-sizing: border-box;

    .assistant-list {
      flex-grow: 1;
    }
  }

  .chat-assistant-right {
    flex-grow: 1;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .chat-window {
      flex-grow: 1;
    }
  }
}
</style>
