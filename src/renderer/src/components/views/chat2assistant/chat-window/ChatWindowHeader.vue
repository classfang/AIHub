<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import AssistantForm from '@renderer/components/views/chat2assistant/assistant-list/AssistantForm.vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { useSystemStore } from '@renderer/store/system'
import { nowTimestamp } from '@renderer/utils/date-util'
import { exportTextFile } from '@renderer/utils/download-util'
import { copyObj } from '@renderer/utils/object-util'
import { copyFields } from '@renderer/utils/object-util'
import { reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

const assistantStore = useAssistantStore()
const systemStore = useSystemStore()
const { t } = useI18n()

const props = defineProps({
  // 是否是虚拟助手模式
  isVirtual: {
    type: Boolean,
    default: () => false
  },
  currentAssistant: {
    type: Object as () => Assistant,
    default: () => ({})
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
    if (data.assistantForm.name.trim().length === 0) {
      Message.error(`${t('assistantList.name')} ${t('common.required')}`)
      reject()
      return
    }
    if (data.assistantForm.model.trim().length === 0) {
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
      // 清除上下文id设置为null
      data.currentAssistant.clearContextMessageId = null
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
  const index = props.isVirtual
    ? assistantStore.virtualAssistantList.findIndex((a) => a.id === newAssistant.id)
    : assistantStore.assistantList.findIndex((a) => a.id === newAssistant.id)
  if (index < 0) {
    return
  }
  copyFields(
    newAssistant,
    props.isVirtual
      ? assistantStore.virtualAssistantList[index]
      : assistantStore.assistantList[index]
  )
}

const assistantDelete = () => {
  if (props.isVirtual) {
    assistantStore.virtualAssistantList = assistantStore.virtualAssistantList.filter(
      (a) => a.id != data.currentAssistant.id
    )
    assistantStore.currentVirtualAssistantId = null
  } else {
    assistantStore.assistantList = assistantStore.assistantList.filter(
      (a) => a.id != data.currentAssistant.id
    )
    assistantStore.currentAssistantId = null
  }
}

// 暴露方法
defineExpose({
  edit,
  clearConfirm
})
</script>

<template>
  <div class="chat-window-header drag-area">
    <div class="assistant-name">
      {{ currentAssistant?.name }}
    </div>
    <div class="assistant-desc">
      <a-space :size="10">
        <a-tag>{{ $t(`bigModelProvider.${currentAssistant?.provider}`) }}</a-tag>
        <a-tag>{{ currentAssistant?.model }}</a-tag>
      </a-space>
    </div>
    <a-popover
      v-if="currentAssistant.id"
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
            >{{
              isVirtual ? $t('chatWindow.header.editChat') : $t('chatWindow.header.edit')
            }}</a-button
          >
          <a-button
            type="text"
            style="width: 100%; color: var(--color-text-1)"
            size="small"
            @click="exportChatMessageList"
            >{{ $t('chatWindow.header.export') }}</a-button
          >
          <a-button
            type="text"
            style="width: 100%"
            status="danger"
            size="small"
            @click="clearConfirm"
            >{{ $t('chatWindow.header.clear') }}</a-button
          >
          <a-button
            type="text"
            style="width: 100%"
            status="danger"
            size="small"
            @click="deleteConfirm"
            >{{
              isVirtual ? $t('chatWindow.header.deleteChat') : $t('chatWindow.header.delete')
            }}</a-button
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
      <template #title>
        {{ isVirtual ? $t('chatWindow.header.editChat') : $t('chatWindow.header.edit') }}
      </template>
      <div style="height: 60vh; padding: 0 10px; overflow-y: auto">
        <AssistantForm v-model:assistant="assistantForm" :is-virtual="isVirtual" />
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
    flex-grow: 1;
    font-size: 16px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .assistant-desc {
    flex-shrink: 0;
    margin-left: auto;
  }
}
</style>
