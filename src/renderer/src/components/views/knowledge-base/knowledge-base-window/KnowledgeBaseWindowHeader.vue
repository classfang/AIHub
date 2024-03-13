<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import KnowledgeBaseForm from '@renderer/components/views/knowledge-base/knowledge-base-list/KnowledgeBaseForm.vue'
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'
import { useSystemStore } from '@renderer/store/system'
import { nowTimestamp } from '@renderer/utils/date-util'
import { copyObj } from '@renderer/utils/object-util'
import { copyFields } from '@renderer/utils/object-util'
import { reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

const knowledgeBaseStore = useKnowledgeBaseStore()
const systemStore = useSystemStore()
const { t } = useI18n()

defineProps({
  fileCount: {
    type: Number,
    default: 0
  },
  docCount: {
    type: Number,
    default: 0
  }
})

const data = reactive({
  editModalVisible: false,
  knowledgeBaseForm: {} as KnowledgeBase
})
const { editModalVisible, knowledgeBaseForm } = toRefs(data)

const edit = () => {
  if (systemStore.knowledgeBaseWindowLoading) {
    return
  }
  data.knowledgeBaseForm = copyObj(knowledgeBaseStore.getCurrentKnowledgeBase)
  data.editModalVisible = true
}

const handleEditModalBeforeOk = async () => {
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

    data.knowledgeBaseForm.lastUpdateTime = nowTimestamp()
    knowledgeBaseUpdate(data.knowledgeBaseForm)

    resolve()
  })
  return true
}

const deleteConfirm = () => {
  if (systemStore.knowledgeBaseWindowLoading) {
    return
  }
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: t('common.deleteConfirmContent'),
    okText: t('common.ok'),
    cancelText: t('common.cancel'),
    onOk: () => {
      knowledgeBaseDelete()
    }
  })
}

const knowledgeBaseUpdate = (newKnowledgeBase: KnowledgeBase) => {
  const index = knowledgeBaseStore.knowledgeBaseList.findIndex(
    (kb) => kb.id === newKnowledgeBase.id
  )
  if (index < 0) {
    return
  }
  copyFields(newKnowledgeBase, knowledgeBaseStore.knowledgeBaseList[index])
}

const knowledgeBaseDelete = () => {
  knowledgeBaseStore.knowledgeBaseList = knowledgeBaseStore.knowledgeBaseList.filter(
    (kb) => kb.id != knowledgeBaseStore.currentKnowledgeBaseId
  )
  knowledgeBaseStore.currentKnowledgeBaseId = null
}
</script>

<template>
  <div class="knowledge-base-window-header drag-area">
    <div class="knowledge-base-name">{{ knowledgeBaseStore.getCurrentKnowledgeBase.name }}</div>
    <div class="knowledge-base-desc">
      <transition name="fadein">
        <a-space v-if="!systemStore.knowledgeBaseWindowLoading" :size="10">
          <a-tag>{{ fileCount }} {{ $t('knowledgeBase.window.knowledgeFile') }}</a-tag>
          <a-tag>{{ docCount }} {{ $t('knowledgeBase.window.knowledgeDoc') }}</a-tag>
        </a-space>
      </transition>
    </div>
    <a-popover position="br" trigger="click" :content-style="{ padding: '5px' }">
      <icon-more
        :class="{ 'no-drag-area': !systemStore.knowledgeBaseWindowLoading }"
        style="font-size: 24px; flex-shrink: 0"
      />
      <template #content>
        <a-space direction="vertical" fill>
          <a-button
            type="text"
            style="width: 100%; color: var(--color-text-1)"
            size="small"
            @click="edit"
            >{{ $t('common.edit') }}</a-button
          >
          <a-button
            type="text"
            style="width: 100%"
            status="danger"
            size="small"
            @click="deleteConfirm"
            >{{ $t('common.delete') }}</a-button
          >
        </a-space>
      </template>
    </a-popover>

    <!-- 编辑Modal -->
    <a-modal
      v-model:visible="editModalVisible"
      :ok-text="$t('common.ok')"
      :cancel-text="$t('common.cancel')"
      unmount-on-close
      title-align="start"
      width="80vw"
      :on-before-ok="handleEditModalBeforeOk"
    >
      <template #title> {{ $t('knowledgeBase.list.edit') }} </template>
      <div style="height: 60vh; padding: 0 10px; overflow-y: auto">
        <KnowledgeBaseForm v-model:knowledgeBase="knowledgeBaseForm" />
      </div>
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
.knowledge-base-window-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  border-bottom: 1px solid var(--color-border-1);
  box-sizing: border-box;
  padding: 15px;

  .knowledge-base-name {
    font-size: 16px;
    font-weight: 500;
  }

  .knowledge-base-desc {
    margin-left: auto;
  }
}
</style>
