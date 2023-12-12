<script setup lang="ts">
import { reactive, toRefs } from 'vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { copyObj } from '@renderer/utils/object-util'
import AssistantItem from '@renderer/components/views/chat2assistant/assistant-list/AssistantItem.vue'
import AssistantForm from '@renderer/components/views/chat2assistant/assistant-list/AssistantForm.vue'
import { nowTimestamp } from '@renderer/utils/date-util'
import { randomUUID } from '@renderer/utils/id-util'
import draggable from 'vuedraggable'

const assistantStore = useAssistantStore()
const { t } = useI18n()

const newFormDefault = {
  name: '',
  type: 'chat',
  instruction: '',
  provider: 'OpenAI',
  model: 'gpt-4-vision-preview',
  maxTokens: 1024,
  inputMaxTokens: 1024,
  contextSize: 1,
  imageSize: '1024x1024'
}

const data = reactive({
  newModalVisible: false,
  assistantForm: copyObj(newFormDefault),
  keyword: ''
})
const { newModalVisible, assistantForm, keyword } = toRefs(data)

const handleNewModalBeforeOk = async () => {
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
    assistantStore.assistantList.unshift(
      copyObj({
        ...data.assistantForm,
        id: randomUUID(),
        createTime: nowTimestamp(),
        lastUpdateTime: nowTimestamp(),
        chatMessageList: []
      })
    )
    resolve()
  })
  return true
}

const clearNewModal = () => {
  data.assistantForm = copyObj(newFormDefault)
}
</script>

<template>
  <div class="assistant-list">
    <div class="assistant-header drag-area">
      <a-input-search
        v-model="keyword"
        :placeholder="$t('assistantList.search')"
        class="search-input no-drag-area"
      />
      <a-button class="assistant-new-btn no-drag-area" @click="newModalVisible = true">
        <icon-robot-add :size="16" />
      </a-button>
    </div>
    <draggable
      v-if="assistantStore.assistantList.filter((a) => a.name.includes(keyword)).length > 0"
      v-model="assistantStore.assistantList"
      group="people"
      item-key="id"
      class="assistant-list-container"
    >
      <template #item="{ element }">
        <AssistantItem
          v-show="element.name.includes(keyword)"
          :assistant="element"
          class="assistant-item"
        />
      </template>
    </draggable>
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
      <div style="height: 60vh; overflow-y: auto">
        <AssistantForm :assistant="assistantForm" :type-change="true" />
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
  box-sizing: border-box;
  padding-bottom: 15px;

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
      gap: 5px;
      height: 30px;
      width: 30px;
      padding: 0;
    }
  }

  .assistant-list-container {
    flex-grow: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-sizing: border-box;
    padding: 0 15px;
  }

  .assistant-list-empty {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
