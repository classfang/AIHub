<script setup lang="ts">
import { useSystemStore } from '@renderer/store/system'
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'

const systemStore = useSystemStore()
const knowledgeBaseStore = useKnowledgeBaseStore()

const props = defineProps({
  knowledgeBase: {
    type: Object as () => KnowledgeBase,
    default: () => {}
  }
})

const itemActive = () => {
  if (systemStore.knowledgeBaseWindowLoading) {
    return
  }
  knowledgeBaseStore.currentKnowledgeBaseId = props.knowledgeBase.id
}
</script>

<template>
  <div
    class="knowledge-base-item"
    :class="{
      'knowledge-base-item-active': knowledgeBaseStore.currentKnowledgeBaseId === knowledgeBase.id
    }"
    @click="itemActive"
  >
    <div class="knowledge-base-item-body">
      <div class="knowledge-base-item-header">
        <div class="knowledge-base-item-name">{{ knowledgeBase.name }}</div>
      </div>
      <div class="knowledge-base-item-content">{{ knowledgeBase.description }}</div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.knowledge-base-item {
  width: 100%;
  box-sizing: border-box;
  padding: 15px;
  background-color: var(--color-fill-1);
  border-radius: var(--border-radius-small);
  display: flex;
  align-items: center;
  gap: 10px;

  .knowledge-base-item-body {
    height: 40px;
    flex-grow: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .knowledge-base-item-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;

      .knowledge-base-item-name {
        flex-grow: 1;
        font-size: 15px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .knowledge-base-item-content {
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--color-text-3);
    }
  }
}

.knowledge-base-item-active {
  background-color: var(--color-fill-3);
}
</style>
