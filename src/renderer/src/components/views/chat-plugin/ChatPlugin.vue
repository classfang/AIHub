<script setup lang="ts">
import { useChatPluginStore } from '@renderer/store/chat-plugin'
import EmptyChatPluginWindow from '@renderer/components/views/chat-plugin/chat-plugin-window/EmptyChatPluginWindow.vue'
import ChatPluginWindow from '@renderer/components/views/chat-plugin/chat-plugin-window/ChatPluginWindow.vue'
import ChatPluginList from '@renderer/components/views/chat-plugin/chat-plugin-list/ChatPluginList.vue'
import { ref } from 'vue'

const chatPluginStore = useChatPluginStore()

const chatPluginWindowRef = ref()
</script>

<template>
  <div class="chat-plugin">
    <div class="chat-plugin-left">
      <ChatPluginList class="chat-plugin-list" />
    </div>
    <div class="chat-plugin-right">
      <ChatPluginWindow
        v-if="chatPluginStore.currentChatPluginId"
        ref="chatPluginWindowRef"
        class="chat-plugin-window"
      />
      <EmptyChatPluginWindow v-else />
    </div>
  </div>
</template>

<style lang="less" scoped>
.chat-plugin {
  width: 100%;
  flex-grow: 1;
  display: flex;
  overflow: hidden;

  .chat-plugin-left {
    flex-shrink: 0;
    width: 270px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--color-border-1);
    box-sizing: border-box;

    .chat-plugin-list {
      flex-grow: 1;
    }
  }

  .chat-plugin-right {
    flex-grow: 1;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .chat-plugin-window {
      flex-grow: 1;
    }
  }
}
</style>
