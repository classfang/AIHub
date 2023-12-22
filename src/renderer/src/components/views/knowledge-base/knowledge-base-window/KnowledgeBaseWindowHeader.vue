<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import { copyObj } from '@renderer/utils/object-util'
import { reactive, toRefs } from 'vue'
import { nowTimestamp } from '@renderer/utils/date-util'
import { useI18n } from 'vue-i18n'
import { useSystemStore } from '@renderer/store/system'
import { copyFields } from '@renderer/utils/object-util'
import KnowledgeBaseForm from '@renderer/components/views/knowledge-base/knowledge-base-list/KnowledgeBaseForm.vue'
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'

const knowledgeBaseStore = useKnowledgeBaseStore()
const systemStore = useSystemStore()
const { t } = useI18n()

const props = defineProps({
  currentKnowledgeBase: {
    type: Object as () => Assistant,
    default: () => {}
  }
})

const data = reactive({
  currentKnowledgeBase: props.currentKnowledgeBase,
  editModalVisible: false,
  knowledgeBaseForm: {} as KnowledgeBase
})
const { editModalVisible, knowledgeBaseForm } = toRefs(data)

const edit = () => {
  if (systemStore.knowledgeBaseWindowLoading) {
    return
  }
  data.knowledgeBaseForm = copyObj(data.currentKnowledgeBase)
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
    if (isNaN(data.knowledgeBaseForm.redisConfig.database)) {
      Message.error(`${t('knowledgeBase.list.redisConfig.database')} ${t('common.required')}`)
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
    (kb) => kb.id != data.currentKnowledgeBase.id
  )
  knowledgeBaseStore.currentKnowledgeBaseId = null
}
</script>

<template>
  <div class="knowledge-base-window-header drag-area">
    <div class="knowledge-base-name">{{ currentKnowledgeBase.name }}</div>
    <div class="knowledge-base-desc"></div>
    <a-popover
      v-if="currentKnowledgeBase"
      position="br"
      trigger="click"
      :content-style="{ padding: '5px' }"
    >
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

    <!-- 编辑助手Modal -->
    <a-modal
      v-model:visible="editModalVisible"
      :ok-text="$t('common.ok')"
      :cancel-text="$t('common.cancel')"
      unmount-on-close
      title-align="start"
      width="80vw"
      :on-before-ok="handleEditModalBeforeOk"
    >
      <template #title> {{ $t('knowledge-baseList.new') }} </template>
      <div style="height: 60vh; overflow-y: auto">
        <KnowledgeBaseForm :knowledge-base="knowledgeBaseForm" />
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
