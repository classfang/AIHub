<script setup lang="ts">
import { reactive, toRefs } from 'vue'
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'
import KnowledgeBaseWindowHeader from '@renderer/components/views/knowledge-base/knowledge-base-window/KnowledgeBaseWindowHeader.vue'

// store
const knowledgeBaseStore = useKnowledgeBaseStore()

// 数据绑定
const data = reactive({
  // 当前的助手
  currentKnowledgeBase: knowledgeBaseStore.getCurrentKnowledgeBase,
  // 问题
  question: '',
  // 回答
  answer: ''
})
const { currentKnowledgeBase, question, answer } = toRefs(data)

// 提问
const sendQuestion = () => {
  console.log(data.question)
}
</script>

<template>
  <div class="knowledge-base-window">
    <!-- 头部 -->
    <KnowledgeBaseWindowHeader :current-knowledge-base="currentKnowledgeBase" />
    <!-- 检索结果 -->
    <div v-if="answer" class="knowledge-base-search-result"></div>
    <!-- 文件列表 -->
    <div v-else class="knowledge-base-file-list"></div>
    <!-- 输入框 -->
    <div class="knowledge-base-search-input">
      <a-input
        v-model="question"
        size="large"
        :placeholder="$t('knowledgeBase.window.search')"
        class="search-input"
        @press-enter="sendQuestion"
      >
        <template #suffix>
          <icon-search style="cursor: pointer" @click="sendQuestion" />
        </template>
      </a-input>
    </div>
  </div>
</template>

<style scoped lang="less">
.knowledge-base-window {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .knowledge-base-search-result {
    flex: 1;
    min-height: 0;
  }

  .knowledge-base-file-list {
    flex: 1;
    min-height: 0;
  }

  .knowledge-base-search-input {
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 20px;

    .search-input {
      border: none;
      background-color: var(--color-fill-2);
    }
  }
}
</style>
