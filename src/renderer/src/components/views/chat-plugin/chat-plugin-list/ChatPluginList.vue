<script setup lang="ts">
import { onMounted, reactive, toRefs } from 'vue'
import { useChatPluginStore } from '@renderer/store/chat-plugin'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { copyObj } from '@renderer/utils/object-util'
import { nowTimestamp } from '@renderer/utils/date-util'
import { randomUUID } from '@renderer/utils/id-util'
import draggable from 'vuedraggable'
import ChatPluginItem from '@renderer/components/views/chat-plugin/chat-plugin-list/ChatPluginItem.vue'
import ChatPluginForm from '@renderer/components/views/chat-plugin/chat-plugin-list/ChatPluginForm.vue'

const chatPluginStore = useChatPluginStore()
const { t } = useI18n()

const newFormDefault = {
  type: 'function',
  name: '',
  code: 'new Promise((resolve, reject) => {\n    // Get the input param from params\n    resolve(JSON.stringify(params))\n})',
  description: '',
  parameters: [
    {
      name: '',
      type: 'string',
      description: ''
    }
  ]
}

const data = reactive({
  newModalVisible: false,
  chatPluginForm: copyObj(newFormDefault) as ChatPlugin,
  keyword: ''
})
const { newModalVisible, chatPluginForm, keyword } = toRefs(data)

const handleNewModalBeforeOk = async () => {
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

    chatPluginStore.chatPluginList.unshift(
      copyObj({
        ...data.chatPluginForm,
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
  data.chatPluginForm = copyObj(newFormDefault)
}

onMounted(() => {
  // 将当前知识库显示到视窗
  document.querySelector('.chat-plugin-item-active')?.scrollIntoView()
})
</script>

<template>
  <div class="chat-plugin-list">
    <div class="chat-plugin-header drag-area">
      <a-input-search
        v-model="keyword"
        :placeholder="$t('chatPlugin.list.search')"
        class="search-input no-drag-area"
      />
      <a-button class="chat-plugin-new-btn no-drag-area" @click="newModalVisible = true">
        <icon-plus :size="16" />
      </a-button>
    </div>
    <a-scrollbar
      v-if="
        chatPluginStore.chatPluginList.filter(
          (kb) => kb.name.includes(keyword) || kb.description.includes(keyword)
        ).length > 0
      "
      outer-class="chat-plugin-list-container arco-scrollbar-small"
      style="height: calc(100vh - 60px); overflow-y: auto"
    >
      <draggable
        v-model="chatPluginStore.chatPluginList"
        group="chat-plugin-list"
        item-key="id"
        class="chat-plugin-list-draggable"
      >
        <template #item="{ element }">
          <ChatPluginItem
            v-show="element.name.includes(keyword) || element.description.includes(keyword)"
            :chat-plugin="element"
            class="chat-plugin-item"
          />
        </template>
      </draggable>
    </a-scrollbar>
    <div v-else class="chat-plugin-list-empty">
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
      <template #title> {{ $t('chatPlugin.list.new') }} </template>
      <div style="height: 60vh; padding: 0 10px; overflow-y: auto">
        <ChatPluginForm v-model:chatPlugin="chatPluginForm" />
      </div>
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
.chat-plugin-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow: hidden;

  .chat-plugin-header {
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

    .chat-plugin-new-btn {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 5px;
      height: 30px;
      width: 30px;
      padding: 0;
    }
  }

  .chat-plugin-list-container {
    .chat-plugin-list-draggable {
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-sizing: border-box;
      padding: 0 15px 15px 15px;
    }
  }

  .chat-plugin-list-empty {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
