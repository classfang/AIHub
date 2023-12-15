<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import { copyObj } from '@renderer/utils/object-util'
import { reactive, toRefs } from 'vue'
import { nowTimestamp } from '@renderer/utils/date-util'
import { exportTextFile } from '@renderer/utils/download-util'
import { useI18n } from 'vue-i18n'
import { useSystemStore } from '@renderer/store/system'
import { copyFields } from '@renderer/utils/object-util'
import { useAssistantStore } from '@renderer/store/assistant'
import AssistantForm from '@renderer/components/views/chat2assistant/assistant-list/AssistantForm.vue'

const assistantStore = useAssistantStore()
const systemStore = useSystemStore()
const { t } = useI18n()

const props = defineProps({
  currentAssistant: {
    type: Object as () => Assistant,
    default: () => {}
  },
  currentChatMessageSet: {
    type: Object as () => ChatMessageSet,
    default: () => {}
  }
})

const data = reactive({
  currentAssistant: props.currentAssistant,
  editModalVisible: false,
  assistantForm: {} as Assistant
})
const { editModalVisible, assistantForm } = toRefs(data)

const edit = () => {
  if (systemStore.chatWindowLoading) {
    return
  }
  data.assistantForm = copyObj(data.currentAssistant)
  data.editModalVisible = true
}

const handleEditModalBeforeOk = async () => {
  await new Promise<void>((resolve, reject) => {
    if (!data.assistantForm.name) {
      Message.error(`${t('assistantList.name')} ${t('common.required')}`)
      reject()
      return
    }
    if (!data.assistantForm.model) {
      Message.error(`${t('assistantList.model')} ${t('common.required')}`)
      reject()
      return
    }
    // 助手默认值
    if (!data.assistantForm.inputMaxTokens) {
      data.assistantForm.inputMaxTokens = 1024
    }
    if (!data.assistantForm.maxTokens) {
      data.assistantForm.maxTokens = 1024
    }
    if (!data.assistantForm.contextSize) {
      data.assistantForm.contextSize = 1
    }
    data.assistantForm.lastUpdateTime = nowTimestamp()
    assistantUpdate(data.assistantForm)

    resolve()
  })
  return true
}

const clearConfirm = () => {
  if (systemStore.chatWindowLoading) {
    return
  }
  Modal.confirm({
    title: t('common.clearConfirm'),
    content: t('common.clearConfirmContent'),
    okText: t('common.ok'),
    cancelText: t('common.cancel'),
    onOk: () => {
      data.currentAssistant.chatMessageList = []
    }
  })
}

const deleteConfirm = () => {
  if (systemStore.chatWindowLoading) {
    return
  }
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: t('common.deleteConfirmContent'),
    okText: t('common.ok'),
    cancelText: t('common.cancel'),
    onOk: () => {
      assistantDelete()
    }
  })
}

const exportChatMessageList = () => {
  if (systemStore.chatWindowLoading) {
    return
  }
  const content = data.currentAssistant.chatMessageList
    .map((r) => r.role + ': \n' + r.content)
    .join('\n\n')
  exportTextFile(`records-${nowTimestamp()}.md`, content)
}

const assistantUpdate = (newAssistant: Assistant) => {
  const index = assistantStore.assistantList.findIndex((a) => a.id === newAssistant.id)
  if (index < 0) {
    return
  }
  copyFields(newAssistant, assistantStore.assistantList[index])
}

const assistantDelete = () => {
  assistantStore.assistantList = assistantStore.assistantList.filter(
    (a) => a.id != data.currentAssistant.id
  )
  assistantStore.currentAssistantId = null
}
</script>

<template>
  <div class="chat-window-header drag-area">
    <div class="assistant-name">{{ currentAssistant?.name || currentChatMessageSet.name }}</div>
    <div class="assistant-desc">
      <a-space :size="10">
        <a-tag>{{
          $t(`bigModelProvider.${currentAssistant?.provider || currentChatMessageSet.provider}`)
        }}</a-tag>
        <a-tag>{{ currentAssistant?.model || currentChatMessageSet.model }}</a-tag>
      </a-space>
    </div>
    <a-popover
      v-if="currentAssistant"
      position="br"
      trigger="click"
      :content-style="{ padding: '5px' }"
    >
      <icon-more
        :class="{ 'no-drag-area': !systemStore.chatWindowLoading }"
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
            style="width: 100%; color: var(--color-text-1)"
            size="small"
            @click="exportChatMessageList"
            >{{ $t('common.export') }}</a-button
          >
          <a-button
            type="text"
            style="width: 100%"
            status="danger"
            size="small"
            @click="clearConfirm"
            >{{ $t('common.clear') }}</a-button
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
      <template #title> {{ $t('assistantList.new') }} </template>
      <div style="height: 60vh; overflow-y: auto">
        <AssistantForm :assistant="assistantForm" />
      </div>
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
.chat-window-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  border-bottom: 1px solid var(--color-border-1);
  box-sizing: border-box;
  padding: 15px;

  .assistant-name {
    font-size: 16px;
    font-weight: 500;
  }

  .assistant-desc {
    margin-left: auto;
  }
}
</style>
