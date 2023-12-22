<script setup lang="ts"></script>

<template>
  <div class="knowledge-base-window drag-area">
    <div class="knowledge-base-window-empty">
      <a-empty>
        <template #image>
          <icon-message />
        </template>
        {{ $t('knowledgeBase.slogan') }}
      </a-empty>
    </div>
  </div>
</template>

<style lang="less" scoped>
.knowledge-base-window {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .knowledge-base-window-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
