<script setup lang="ts">
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'
import EmptyKnowledgeBaseWindow from '@renderer/components/views/knowledge-base/knowledge-base-window/EmptyKnowledgeBaseWindow.vue'
import KnowledgeBaseWindow from '@renderer/components/views/knowledge-base/knowledge-base-window/KnowledgeBaseWindow.vue'
import KnowledgeBaseList from '@renderer/components/views/knowledge-base/knowledge-base-list/KnowledgeBaseList.vue'
import { ref } from 'vue'

const knowledgeBaseStore = useKnowledgeBaseStore()

const knowledgeBaseWindowRef = ref()
</script>

<template>
  <div class="knowledge-base">
    <div class="knowledge-base-left">
      <KnowledgeBaseList class="knowledge-base-list" />
    </div>
    <div class="knowledge-base-right">
      <KnowledgeBaseWindow
        v-if="knowledgeBaseStore.currentKnowledgeBaseId"
        ref="knowledgeBaseWindowRef"
        class="knowledge-base-window"
      />
      <EmptyKnowledgeBaseWindow v-else />
    </div>
  </div>
</template>

<style lang="less" scoped>
.knowledge-base {
  width: 100%;
  flex-grow: 1;
  display: flex;
  overflow: hidden;

  .knowledge-base-left {
    flex-shrink: 0;
    width: 270px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--color-border-1);
    box-sizing: border-box;

    .knowledge-base-list {
      flex-grow: 1;
    }
  }

  .knowledge-base-right {
    flex-grow: 1;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .knowledge-base-window {
      flex-grow: 1;
    }
  }
}
</style>
