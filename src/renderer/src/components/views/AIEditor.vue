<script setup lang="ts"></script>

<template>
  <div class="ai-editor">
    <!-- 头部 -->
    <div class="ai-editor-header drag-area"></div>
    <!-- 主体 -->
    <div class="ai-editor-body"></div>
  </div>
</template>

<style scoped lang="less">
.ai-editor {
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  .ai-editor-header {
    flex-shrink: 0;
    height: 40px;
  }

  .ai-editor-body {
    flex-grow: 1;
    min-height: 0;
    display: flex;
    gap: 10px;
    box-sizing: border-box;
    padding: 15px;
  }
}
</style>
