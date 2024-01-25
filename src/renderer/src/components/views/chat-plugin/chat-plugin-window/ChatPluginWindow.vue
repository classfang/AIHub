<script setup lang="ts">
import ChatPluginWindowHeader from '@renderer/components/views/chat-plugin/chat-plugin-window/ChatPluginWindowHeader.vue'
</script>

<template>
  <div class="chat-plugin-window">
    <!-- 头部 -->
    <ChatPluginWindowHeader />
    <div class="chat-plugin-body"></div>
  </div>
</template>

<style scoped lang="less">
.chat-plugin-window {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 15px;

  .chat-plugin-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 15px;
    position: relative;
  }
}
</style>
