<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import AssistantForm from '@renderer/components/views/chat2assistant/assistant-list/AssistantForm.vue'
import AssistantItem from '@renderer/components/views/chat2assistant/assistant-list/AssistantItem.vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { defaultAssistant } from '@renderer/utils/big-model/base-util'
import { nowTimestamp } from '@renderer/utils/date-util'
import { randomUUID } from '@renderer/utils/id-util'
import { copyObj } from '@renderer/utils/object-util'
import { onMounted, reactive, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'

const assistantStore = useAssistantStore()
const { t } = useI18n()

// 组件传参
const props = defineProps({
  // 是否是虚拟助手模式
  isVirtual: {
    type: Boolean,
    default: () => false
  }
})

const data = reactive({
  newModalVisible: false,
  assistantForm: copyObj(defaultAssistant) as Assistant,
  keyword: ''
})
const { newModalVisible, assistantForm, keyword } = toRefs(data)

const handleNewModalBeforeOk = async () => {
  await new Promise<void>((resolve, reject) => {
    if (data.assistantForm.name.length === 0) {
      Message.error(`${t('assistantList.name')} ${t('common.required')}`)
      reject()
      return
    }
    if (data.assistantForm.model.length === 0) {
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

    if (props.isVirtual) {
      assistantStore.virtualAssistantList.unshift(
        copyObj({
          ...data.assistantForm,
          id: randomUUID(),
          createTime: nowTimestamp(),
          lastUpdateTime: nowTimestamp(),
          chatMessageList: []
        })
      )
    } else {
      assistantStore.assistantList.unshift(
        copyObj({
          ...data.assistantForm,
          id: randomUUID(),
          createTime: nowTimestamp(),
          lastUpdateTime: nowTimestamp(),
          chatMessageList: []
        })
      )
    }

    resolve()
  })
  return true
}

const clearNewModal = () => {
  data.assistantForm = copyObj(defaultAssistant)
}

const newVirtualAssistant = () => {
  const id = randomUUID()
  assistantStore.virtualAssistantList.unshift({
    ...copyObj(
      assistantStore.getCurrentVirtualAssistant.id
        ? assistantStore.getCurrentVirtualAssistant
        : defaultAssistant
    ),
    name: '',
    id: id,
    createTime: nowTimestamp(),
    lastUpdateTime: nowTimestamp(),
    chatMessageList: new Array<ChatMessage>()
  })
  assistantStore.currentVirtualAssistantId = id
}

onMounted(() => {
  // 将当前助手显示到视窗
  document.querySelector('.assistant-item-active')?.scrollIntoView()
})
</script>

<template>
  <div class="assistant-list">
    <div class="assistant-header drag-area">
      <a-input-search
        v-model="keyword"
        :placeholder="isVirtual ? $t('chatList.search') : $t('assistantList.search')"
        class="search-input no-drag-area"
      />
      <a-button
        v-if="isVirtual"
        class="assistant-new-btn no-drag-area"
        @click="newVirtualAssistant()"
      >
        <icon-plus :size="16" />
      </a-button>
      <a-button v-else class="assistant-new-btn no-drag-area" @click="newModalVisible = true">
        <icon-robot-add :size="16" />
      </a-button>
    </div>
    <a-scrollbar
      v-if="
        isVirtual
          ? !keyword ||
            assistantStore.virtualAssistantList.filter(
              (a) => a.chatMessageList.findIndex((m) => m.content.includes(keyword)) > -1
            ).length > 0
          : assistantStore.assistantList.filter((a) => a.name.includes(keyword)).length > 0
      "
      outer-class="assistant-list-container arco-scrollbar-small"
      style="height: calc(100vh - 60px); overflow-y: auto"
    >
      <draggable
        v-if="isVirtual"
        v-model="assistantStore.virtualAssistantList"
        group="assistant-list"
        item-key="id"
        class="assistant-list-draggable"
      >
        <template #item="{ element }">
          <AssistantItem
            v-show="
              !keyword || element.chatMessageList.findIndex((m) => m.content.includes(keyword)) > -1
            "
            :assistant="element"
            class="assistant-item"
            :is-virtual="isVirtual"
          />
        </template>
      </draggable>
      <draggable
        v-else
        v-model="assistantStore.assistantList"
        group="assistant-list"
        item-key="id"
        class="assistant-list-draggable"
      >
        <template #item="{ element }">
          <AssistantItem
            v-show="element.name.includes(keyword)"
            :assistant="element"
            class="assistant-item"
            :is-virtual="isVirtual"
          />
        </template>
      </draggable>
    </a-scrollbar>
    <div v-else class="assistant-list-empty">
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
      <template #title> {{ $t('assistantList.new') }} </template>
      <div style="height: 60vh; padding: 0 10px; overflow-y: auto">
        <AssistantForm
          v-model:assistant="assistantForm"
          :is-virtual="isVirtual"
          :type-change="true"
        />
      </div>
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
.assistant-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow: hidden;

  .assistant-header {
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

    .assistant-new-btn {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 30px;
      width: 30px;
      padding: 0;
    }
  }

  .assistant-list-container {
    .assistant-list-draggable {
      box-sizing: border-box;
      padding: 0 15px 15px 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }

  .assistant-list-empty {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
