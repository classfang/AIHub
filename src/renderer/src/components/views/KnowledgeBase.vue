<!-- https://js.langchain.com/docs/use_cases/question_answering/ -->
<script setup lang="ts">
import { useSettingStore } from '@renderer/store/setting'
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'
import { useI18n } from 'vue-i18n'
import { computed, reactive, toRefs } from 'vue'
import AssistantItem from '@renderer/components/views/chat2assistant/assistant-list/AssistantItem.vue'
import draggable from 'vuedraggable'

const settingStore = useSettingStore()
const knowledgeBaseStore = useKnowledgeBaseStore()
const { t } = useI18n()

const data = reactive({
  keyword: ''
})
const { keyword } = toRefs(data)
</script>

<template>
  <div class="knowledge-base-page">
    <div class="knowledge-base-left">
      <div class="knowledge-base-header drag-area">
        <a-input-search
          v-model="keyword"
          :placeholder="$t('knowledgeBase.search')"
          class="search-input no-drag-area"
        />
        <a-button class="knowledge-base-new-btn no-drag-area" @click="newModalVisible = true">
          <icon-plus :size="16" />
        </a-button>
      </div>
      <draggable
        v-if="
          knowledgeBaseStore.knowledgeBaseList.filter((a) => a.name.includes(keyword)).length > 0
        "
        v-model="knowledgeBaseStore.knowledgeBaseList"
        group="knowledge-base-list"
        item-key="id"
        class="knowledge-base-list"
      >
        <template #item="{ element }">
          {{ element.name }}
        </template>
      </draggable>
      <div
        v-if="knowledgeBaseStore.knowledgeBaseList.length === 0"
        class="knowledge-base-list-empty"
      >
        <a-empty description=" " />
      </div>
    </div>
    <div class="knowledge-base-right">
      <template v-if="knowledgeBaseStore.currentKnowledgeBaseId"> </template>
      <div v-else class="knowledge-base-window-empty drag-area">
        <a-empty>
          <template #image>
            <icon-book />
          </template>
          {{ $t('knowledgeBase.empty') }}
        </a-empty>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.knowledge-base-page {
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
    gap: 15px;
    border-right: 1px solid var(--color-border-1);
    box-sizing: border-box;
    padding-bottom: 15px;

    .knowledge-base-header {
      flex-shrink: 0;
      box-sizing: border-box;
      padding: 15px 15px 0 15px;
      display: flex;
      gap: 5px;
      align-items: center;

      .search-input {
        flex-grow: 1;
        border: none;
        background-color: var(--color-fill-2);
      }

      .knowledge-base-new-btn {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 5px;
        height: 30px;
        width: 30px;
        padding: 0;
      }
    }

    .knowledge-base-list {
      flex-grow: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .knowledge-base-list-empty {
        flex-grow: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .knowledge-base {
        margin: 0 15px;
        box-sizing: border-box;
        padding: 15px;
        background-color: var(--color-fill-1);
        border-radius: var(--border-radius-small);
        display: flex;
        flex-direction: column;
        gap: 15px;

        .knowledge-base-body {
          flex-grow: 1;
          display: flex;
          gap: 10px;
        }

        .knowledge-base-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      }

      .knowledge-base-active {
        background-color: var(--color-fill-3);
      }
    }
  }

  .knowledge-base-right {
    flex-grow: 1;
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
}
</style>
