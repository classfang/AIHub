<script setup lang="ts">
import { reactive, toRefs } from 'vue'
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'
import KnowledgeBaseWindowHeader from '@renderer/components/views/knowledge-base/knowledge-base-window/KnowledgeBaseWindowHeader.vue'

const knowledgeBaseStore = useKnowledgeBaseStore()

const data = reactive({
  // 当前的助手
  currentKnowledgeBase: knowledgeBaseStore.getCurrentKnowledgeBase
})
const { currentKnowledgeBase } = toRefs(data)
</script>

<template>
  <div class="knowledge-base-window">
    <!-- 头部 -->
    <KnowledgeBaseWindowHeader :current-knowledge-base="currentKnowledgeBase" />
  </div>
</template>

<style scoped lang="less">
.knowledge-base-window {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
