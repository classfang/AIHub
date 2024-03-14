<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { useCollectionSetStore } from '@renderer/store/collection-set'
import { nowTimestamp } from '@renderer/utils/date-util'
import { exportTextFile } from '@renderer/utils/download-util'
import { randomUUID } from '@renderer/utils/id-util'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

const assistantStore = useAssistantStore()
const collectionSetStore = useCollectionSetStore()
const { t } = useI18n()

const props = defineProps({
  multipleChoiceList: {
    type: Array,
    default: () => [] as string[]
  }
})

const data = reactive({
  currentAssistant: assistantStore.getCurrentAssistant
})

const emits = defineEmits(['collect', 'delete', 'close'])

const getSelectChatMessageList = () => {
  const chatMessageList = [] as ChatMessage[]
  props.multipleChoiceList.forEach((id) => {
    const chatMessage = data.currentAssistant.chatMessageList.find((msg) => msg.id === id)
    if (chatMessage) {
      chatMessageList.push(chatMessage)
    }
  })
  chatMessageList.sort((m1, m2) => m1.createTime - m2.createTime)
  return chatMessageList
}

const multipleChoiceDelete = () => {
  if (props.multipleChoiceList.length === 0) {
    return
  }
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: t('common.deleteConfirmContent'),
    okText: t('common.ok'),
    cancelText: t('common.cancel'),
    onOk: () => {
      props.multipleChoiceList.forEach((id) => {
        const index = data.currentAssistant.chatMessageList.findIndex((msg) => msg.id === id)
        if (index >= 0) {
          // 如果清除上下文id指向的消息被删除，清除上下文id设置为上一条消息的id
          if (index > 0 && id === data.currentAssistant.clearContextMessageId) {
            data.currentAssistant.clearContextMessageId =
              data.currentAssistant.chatMessageList[index - 1].id
          }
          data.currentAssistant.chatMessageList.splice(index, 1)
        }
      })
      emits('close')
    }
  })
}

const multipleChoiceCollect = () => {
  if (props.multipleChoiceList.length === 0) {
    return
  }

  const selectChatMessageList = getSelectChatMessageList()
  if (selectChatMessageList.length === 0) {
    return
  }

  const chatMessageSet: ChatMessageSet = {
    id: randomUUID(),
    name: assistantStore.getCurrentAssistant.name,
    provider: assistantStore.getCurrentAssistant.provider,
    model: assistantStore.getCurrentAssistant.model,
    chatMessageList: selectChatMessageList,
    createTime: nowTimestamp()
  }
  collectionSetStore.chatMessageSetList.unshift(chatMessageSet)
  emits('close')
  Message.success(t('chatWindow.selectSuccess'))
}

const multipleChoiceDownload = () => {
  if (props.multipleChoiceList.length === 0) {
    return
  }

  const selectChatMessageList = getSelectChatMessageList()
  if (selectChatMessageList.length === 0) {
    return
  }

  const content = selectChatMessageList.map((r) => r.role + ': \n' + r.content).join('\n\n')
  exportTextFile(`records-${nowTimestamp()}.md`, content)
  emits('close')
}
</script>

<template>
  <div class="multiple-choice-console">
    <a-button shape="circle" class="multiple-choice-console-btn" @click="multipleChoiceCollect()">
      <icon-common class="multiple-choice-console-icon" />
    </a-button>
    <a-button shape="circle" class="multiple-choice-console-btn" @click="multipleChoiceDownload()">
      <icon-download class="multiple-choice-console-icon" />
    </a-button>
    <a-button shape="circle" class="multiple-choice-console-btn" @click="multipleChoiceDelete()">
      <icon-delete class="multiple-choice-console-icon" />
    </a-button>
    <a-button shape="circle" class="multiple-choice-console-btn" @click="emits('close')">
      <icon-close class="multiple-choice-console-icon" />
    </a-button>
  </div>
</template>

<style lang="less" scoped>
.multiple-choice-console {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--color-bg-1);
  display: flex;
  align-items: center;
  justify-content: space-evenly;

  .multiple-choice-console-btn {
    height: 50px;
    width: 50px;

    .multiple-choice-console-icon {
      stroke-width: 2;
      font-size: 28px;
    }
  }
}
</style>
