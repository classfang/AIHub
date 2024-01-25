<script setup lang="ts"></script>

<template>
  <div class="chat-plugin-window drag-area">
    <div class="chat-plugin-window-empty">
      <a-empty>
        <template #image>
          <icon-code />
        </template>
        {{ $t('chatPlugin.slogan') }}
      </a-empty>
    </div>
  </div>
</template>

<style lang="less" scoped>
.chat-plugin-window {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .chat-plugin-window-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
