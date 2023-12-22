<script setup lang="ts">
import { reactive, toRefs } from 'vue'
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'
import KnowledgeBaseWindowHeader from '@renderer/components/views/knowledge-base/knowledge-base-window/KnowledgeBaseWindowHeader.vue'
import { useSystemStore } from '@renderer/store/system'

// store
const systemStore = useSystemStore()
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
  if (systemStore.knowledgeBaseWindowLoading) {
    return
  }
  systemStore.knowledgeBaseWindowLoading = true
  setTimeout(() => {
    data.answer = data.question
    systemStore.knowledgeBaseWindowLoading = false
  })
}
</script>

<template>
  <div class="knowledge-base-window">
    <!-- 头部 -->
    <KnowledgeBaseWindowHeader :current-knowledge-base="currentKnowledgeBase" />
    <!-- 检索结果 -->
    <div v-if="answer" class="knowledge-base-result">
      <div class="knowledge-base-answer select-text">{{ answer }}</div>
    </div>
    <!-- 文件列表 -->
    <div v-else class="knowledge-base-file-list"></div>
    <!-- 输入框 -->
    <div class="knowledge-base-search-input">
      <a-input
        v-model="question"
        size="large"
        allow-clear
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
  gap: 15px;

  .knowledge-base-result {
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
    padding: 0 15px;
    display: flex;
    flex-direction: column;

    .knowledge-base-answer {
      flex: 1;
      overflow-y: auto;
      white-space: pre-wrap;
      line-break: anywhere;
      background-color: var(--color-fill-1);
      padding: 10px;
      border-radius: var(--border-radius-small);
      cursor: text;
    }
  }

  .knowledge-base-file-list {
    flex: 1;
    min-height: 0;
  }

  .knowledge-base-search-input {
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 0 15px 15px 15px;

    .search-input {
      border: none;
      background-color: var(--color-fill-2);
    }
  }
}
</style>
