<script setup lang="ts">
import { onMounted, reactive, toRefs } from 'vue'
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { copyObj } from '@renderer/utils/object-util'
import { nowTimestamp } from '@renderer/utils/date-util'
import { randomUUID } from '@renderer/utils/id-util'
import draggable from 'vuedraggable'
import KnowledgeBaseItem from '@renderer/components/views/knowledge-base/knowledge-base-list/KnowledgeBaseItem.vue'
import KnowledgeBaseForm from '@renderer/components/views/knowledge-base/knowledge-base-list/KnowledgeBaseForm.vue'

const knowledgeBaseStore = useKnowledgeBaseStore()
const { t } = useI18n()

const newFormDefault = {
  name: '',
  description: '',
  redisConfig: {
    url: 'redis://localhost:6379',
    username: '',
    password: ''
  },
  indexName: ''
}

const data = reactive({
  newModalVisible: false,
  knowledgeBaseForm: copyObj(newFormDefault) as KnowledgeBase,
  keyword: ''
})
const { newModalVisible, knowledgeBaseForm, keyword } = toRefs(data)

const handleNewModalBeforeOk = async () => {
  await new Promise<void>((resolve, reject) => {
    if (data.knowledgeBaseForm.name.length === 0) {
      Message.error(`${t('knowledgeBase.list.name')} ${t('common.required')}`)
      reject()
      return
    }
    if (data.knowledgeBaseForm.indexName.length === 0) {
      Message.error(`${t('knowledgeBase.list.indexName')} ${t('common.required')}`)
      reject()
      return
    }
    if (data.knowledgeBaseForm.redisConfig.url.length === 0) {
      Message.error(`${t('knowledgeBase.list.redisConfig.url')} ${t('common.required')}`)
      reject()
      return
    }

    knowledgeBaseStore.knowledgeBaseList.unshift(
      copyObj({
        ...data.knowledgeBaseForm,
        id: randomUUID(),
        createTime: nowTimestamp(),
        lastUpdateTime: nowTimestamp()
      })
    )
    resolve()
  })
  return true
}

const clearNewModal = () => {
  data.knowledgeBaseForm = copyObj(newFormDefault)
}

onMounted(() => {
  // 将当前知识库显示到视窗
  document.querySelector('.knowledge-base-item-active')?.scrollIntoView()
})
</script>

<template>
  <div class="knowledge-base-list">
    <div class="knowledge-base-header drag-area">
      <a-input-search
        v-model="keyword"
        :placeholder="$t('knowledgeBase.list.search')"
        class="search-input no-drag-area"
      />
      <a-button class="knowledge-base-new-btn no-drag-area" @click="newModalVisible = true">
        <icon-plus :size="16" />
      </a-button>
    </div>
    <a-scrollbar
      v-if="
        knowledgeBaseStore.knowledgeBaseList.filter(
          (kb) => kb.name.includes(keyword) || kb.description.includes(keyword)
        ).length > 0
      "
      outer-class="knowledge-base-list-container arco-scrollbar-small"
      style="height: calc(100vh - 75px); overflow-y: auto"
    >
      <draggable
        v-model="knowledgeBaseStore.knowledgeBaseList"
        group="knowledge-base-list"
        item-key="id"
        class="knowledge-base-list-draggable"
      >
        <template #item="{ element }">
          <KnowledgeBaseItem
            v-show="element.name.includes(keyword) || element.description.includes(keyword)"
            :knowledge-base="element"
            class="knowledge-base-item"
          />
        </template>
      </draggable>
    </a-scrollbar>
    <div v-else class="knowledge-base-list-empty">
      <a-empty description=" " />
    </div>

    <!-- 新增助手Modal -->
    <a-modal
      v-model:visible="newModalVisible"
      :ok-text="$t('common.ok')"
      :cancel-text="$t('common.cancel')"
      unmount-on-close
      title-align="start"
      width="80vw"
      :on-before-ok="handleNewModalBeforeOk"
      @close="clearNewModal"
    >
      <template #title> {{ $t('knowledgeBase.list.new') }} </template>
      <div style="height: 60vh; overflow-y: auto">
        <KnowledgeBaseForm :knowledge-base="knowledgeBaseForm" :type-change="true" />
      </div>
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
.knowledge-base-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow: hidden;
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

  .knowledge-base-list-container {
    .knowledge-base-list-draggable {
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-sizing: border-box;
      padding: 0 15px;
    }
  }

  .knowledge-base-list-empty {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
