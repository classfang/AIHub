<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import ChatPluginForm from '@renderer/components/views/chat-plugin/chat-plugin-list/ChatPluginForm.vue'
import { useChatPluginStore } from '@renderer/store/chat-plugin'
import { nowTimestamp } from '@renderer/utils/date-util'
import { copyObj } from '@renderer/utils/object-util'
import { copyFields } from '@renderer/utils/object-util'
import { reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

const chatPluginStore = useChatPluginStore()
const { t } = useI18n()

const data = reactive({
  editModalVisible: false,
  chatPluginForm: {} as ChatPlugin
})
const { editModalVisible, chatPluginForm } = toRefs(data)

const edit = () => {
  data.chatPluginForm = copyObj(chatPluginStore.getCurrentChatPlugin)
  data.editModalVisible = true
}

const handleEditModalBeforeOk = async () => {
  await new Promise<void>((resolve, reject) => {
    if (data.chatPluginForm.name.length === 0) {
      Message.error(`${t('chatPlugin.list.name')} ${t('common.required')}`)
      reject()
      return
    }
    if (data.chatPluginForm.description.length === 0) {
      Message.error(`${t('chatPlugin.list.description')} ${t('common.required')}`)
      reject()
      return
    }

    data.chatPluginForm.lastUpdateTime = nowTimestamp()
    chatPluginUpdate(data.chatPluginForm)

    resolve()
  })
  return true
}

const deleteConfirm = () => {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: t('common.deleteConfirmContent'),
    okText: t('common.ok'),
    cancelText: t('common.cancel'),
    onOk: () => {
      chatPluginDelete()
    }
  })
}

const chatPluginUpdate = (newChatPlugin: ChatPlugin) => {
  const index = chatPluginStore.chatPluginList.findIndex((kb) => kb.id === newChatPlugin.id)
  if (index < 0) {
    return
  }
  copyFields(newChatPlugin, chatPluginStore.chatPluginList[index])
}

const chatPluginDelete = () => {
  chatPluginStore.chatPluginList = chatPluginStore.chatPluginList.filter(
    (kb) => kb.id != chatPluginStore.currentChatPluginId
  )
  chatPluginStore.currentChatPluginId = null
}
</script>

<template>
  <div class="chat-plugin-window-header drag-area">
    <div class="chat-plugin-name">
      {{ $t('chatPlugin.window.design') }} - {{ chatPluginStore.getCurrentChatPlugin.name }}
    </div>
    <a-popover position="br" trigger="click" :content-style="{ padding: '5px' }">
      <icon-more class="no-drag-area" style="font-size: 24px; flex-shrink: 0" />
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
      <template #title> {{ $t('chatPlugin.list.edit') }} </template>
      <div style="height: 60vh; overflow-y: auto">
        <ChatPluginForm v-model:chatPlugin="chatPluginForm" />
      </div>
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
.chat-plugin-window-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  border-bottom: 1px solid var(--color-border-1);
  box-sizing: border-box;
  padding: 15px;

  .chat-plugin-name {
    font-size: 16px;
    font-weight: 500;
  }
}
</style>
