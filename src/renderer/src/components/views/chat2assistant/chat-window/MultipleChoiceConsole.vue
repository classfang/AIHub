<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import AssistantAvatar from '@renderer/components/avatar/AssistantAvatar.vue'
import UserAvatar from '@renderer/components/avatar/UserAvatar.vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { useCollectionSetStore } from '@renderer/store/collection-set'
import { nowTimestamp } from '@renderer/utils/date-util'
import { downloadFile, exportTextFile } from '@renderer/utils/download-util'
import { randomUUID } from '@renderer/utils/id-util'
import { renderMarkdown } from '@renderer/utils/markdown-util'
import { copyObj } from '@renderer/utils/object-util'
import html2canvas from 'html2canvas'
import { reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'

const assistantStore = useAssistantStore()
const collectionSetStore = useCollectionSetStore()
const { t } = useI18n()

const props = defineProps({
  // 是否是虚拟助手模式
  isVirtual: {
    type: Boolean,
    default: () => false
  },
  multipleChoiceList: {
    type: Array,
    default: () => [] as string[]
  }
})

const data = reactive({
  currentAssistant: props.isVirtual
    ? assistantStore.getCurrentVirtualAssistant
    : assistantStore.getCurrentAssistant,
  shareModalVisible: false
})
const { currentAssistant, shareModalVisible } = toRefs(data)

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

  const collectionItem: CollectionItem = {
    id: randomUUID(),
    type: 'chat',
    chat: {
      ...copyObj(
        props.isVirtual
          ? assistantStore.getCurrentVirtualAssistant
          : assistantStore.getCurrentAssistant
      ),
      chatMessageList: selectChatMessageList
    },
    createTime: nowTimestamp()
  }
  collectionSetStore.collectionItemList.unshift(collectionItem)
  emits('close')
  Message.success(t('chatWindow.collectSuccess'))
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

const multipleChoiceShare = () => {
  if (props.multipleChoiceList.length === 0) {
    return
  }
  data.shareModalVisible = true
}

const shareModalBeforeOk = async () => {
  await new Promise<void>((resolve, reject) => {
    const el = document.getElementById('share-chat-message-list')
    if (el) {
      html2canvas(el, {
        scale: 2, // 缩放比例,默认为1
        allowTaint: true, // 是否允许跨域图像污染画布
        useCORS: true // 是否尝试使用CORS从服务器加载图像
      })
        .then((canvas) => {
          // 将图片下载到本地
          const a = document.createElement('a') // 生成一个a元素
          a.download = `share-${nowTimestamp()}` // 设置图片名称没有设置则为默认
          a.href = canvas.toDataURL('image/png') // 将生成的URL设置为a.href属性
          a.dispatchEvent(new MouseEvent('click')) // 触发a的单击事件

          emits('close')
          resolve()
        })
        .catch((error) => {
          Message.error(error)
          reject()
        })
    }
  })
  return true
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
    <a-button shape="circle" class="multiple-choice-console-btn" @click="multipleChoiceShare()">
      <icon-share-external class="multiple-choice-console-icon" />
    </a-button>
    <a-button shape="circle" class="multiple-choice-console-btn" @click="multipleChoiceDelete()">
      <icon-delete class="multiple-choice-console-icon" />
    </a-button>
    <a-button shape="circle" class="multiple-choice-console-btn" @click="emits('close')">
      <icon-close class="multiple-choice-console-icon" />
    </a-button>

    <!-- 分享预览Modal -->
    <a-modal
      v-model:visible="shareModalVisible"
      :ok-text="$t('chatWindow.shareDownload')"
      :cancel-text="$t('common.cancel')"
      unmount-on-close
      title-align="start"
      width="80vw"
      :on-before-ok="shareModalBeforeOk"
    >
      <template #title> {{ $t('chatWindow.sharePreview') }} </template>
      <div
        class="chat-message-list-container"
        style="height: 60vh; padding: 0 10px; overflow-y: auto"
      >
        <div id="share-chat-message-list" class="chat-message-list">
          <div v-for="msg in getSelectChatMessageList()" :key="msg.id" class="chat-message">
            <div class="chat-message-avatar">
              <UserAvatar v-if="msg.role === 'user'" :size="30" />
              <AssistantAvatar
                v-else-if="msg.role === 'assistant'"
                :provider="currentAssistant.provider"
                :size="30"
              />
            </div>
            <div class="chat-message-content select-text">
              <div v-if="msg.role === 'user'">{{ msg.content }}</div>
              <div
                v-else-if="msg.role === 'assistant'"
                class="chat-message-md"
                v-html="renderMarkdown(msg.content, false)"
              ></div>
              <a-image
                v-if="msg.image"
                width="300"
                height="300"
                :src="`file://${msg.image}`"
                show-loader
                fit="cover"
              >
                <template #preview-actions>
                  <a-image-preview-action
                    :name="$t('common.download')"
                    @click="downloadFile(`file://${msg.image}`, `img-${msg.id}.png`)"
                    ><icon-download
                  /></a-image-preview-action>
                </template>
              </a-image>
            </div>
          </div>
          <div class="share-image-footer">
            <div>{{ currentAssistant.provider }}</div>
            <div>{{ currentAssistant.model }}</div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
@import '../../../../assets/css/chat-window.less';

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

#share-chat-message-list {
  background-color: var(--color-bg-1);

  .share-image-footer {
    border-top: 1px solid var(--color-fill-3);
    padding: 5px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
  }
}
</style>
