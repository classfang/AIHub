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
  const questionText = data.question.trim()
  data.question = ''
  if (questionText.length === 0) {
    return
  }
  systemStore.knowledgeBaseWindowLoading = true
  setTimeout(() => {
    data.answer = questionText
    systemStore.knowledgeBaseWindowLoading = false
  }, 3000)
}

// 返回文件列表
const backFileList = () => {
  if (systemStore.knowledgeBaseWindowLoading) {
    return
  }
  data.answer = ''
}
</script>

<template>
  <div class="knowledge-base-window">
    <!-- 头部 -->
    <KnowledgeBaseWindowHeader :current-knowledge-base="currentKnowledgeBase" />
    <div class="knowledge-base-body">
      <!-- 检索结果 -->
      <template v-if="answer">
        <div>
          <a-button size="mini" @click="backFileList">
            <template #icon>
              <icon-arrow-left />
            </template>
            <template #default>{{ $t('knowledgeBase.window.backFileList') }}</template>
          </a-button>
        </div>
        <a-spin
          :loading="systemStore.knowledgeBaseWindowLoading"
          class="knowledge-base-answer"
          tip=""
        >
          <div class="select-text">{{ answer }}</div>
        </a-spin>
      </template>
      <!-- 文件列表 -->
      <template v-else>
        <div>
          <a-button size="mini" @click="">
            <template #icon>
              <icon-plus />
            </template>
            <template #default>{{ $t('knowledgeBase.window.newFile') }}</template>
          </a-button>
        </div>
        <a-spin
          :loading="systemStore.knowledgeBaseWindowLoading"
          class="knowledge-base-file-list"
          tip=""
        >
          <div></div>
        </a-spin>
      </template>
    </div>
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

  .knowledge-base-body {
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
    padding: 0 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;

    .knowledge-base-answer {
      flex: 1;
      overflow-y: auto;
      background-color: var(--color-fill-1);
      padding: 10px;
      border-radius: var(--border-radius-small);
      white-space: pre-wrap;
      line-break: anywhere;
      cursor: text;
      line-height: 1.3rem;
    }

    .knowledge-base-file-list {
      flex: 1;
      overflow-y: auto;
      background-color: var(--color-fill-1);
      padding: 10px;
      border-radius: var(--border-radius-small);
    }
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
