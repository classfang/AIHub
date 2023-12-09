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
  editForm: {} as Assistant
})
const { editModalVisible, editForm } = toRefs(data)

const edit = () => {
  if (systemStore.chatWindowLoading) {
    return
  }
  data.editForm = copyObj(data.currentAssistant)
  data.editModalVisible = true
}

const handleEditModalBeforeOk = async () => {
  await new Promise<void>((resolve, reject) => {
    if (!data.editForm.name) {
      Message.error(`${t('assistantList.name')} ${t('common.required')}`)
      reject()
      return
    }
    if (!data.editForm.model) {
      Message.error(`${t('assistantList.model')} ${t('common.required')}`)
      reject()
      return
    }
    data.editForm.lastUpdateTime = nowTimestamp()
    assistantUpdate(data.editForm)

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
        <a-form :model="editForm" layout="vertical">
          <a-form-item field="name" :label="$t('assistantList.name')">
            <a-input
              v-model="editForm.name"
              :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.name')"
              :max-length="20"
            />
          </a-form-item>
          <!-- 对话助手参数 -->
          <template v-if="currentAssistant.type === 'chat'">
            <a-form-item field="instruction" :label="$t('assistantList.instruction')">
              <a-textarea
                v-model="editForm.instruction"
                :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.instruction')"
                allow-clear
              />
            </a-form-item>
            <a-form-item field="provider" :label="$t('assistantList.provider')">
              <a-select v-model="editForm.provider">
                <a-option value="OpenAI" @click="() => (editForm.model = '')">{{
                  $t('bigModelProvider.OpenAI')
                }}</a-option>
                <a-option value="Spark" @click="() => (editForm.model = '')">{{
                  $t('bigModelProvider.Spark')
                }}</a-option>
                <a-option value="ERNIEBot" @click="() => (editForm.model = '')">{{
                  $t('bigModelProvider.ERNIEBot')
                }}</a-option>
                <a-option value="Tongyi" @click="() => (editForm.model = '')">{{
                  $t('bigModelProvider.Tongyi')
                }}</a-option>
              </a-select>
            </a-form-item>
            <a-form-item field="model" :label="$t('assistantList.model')">
              <a-select v-if="editForm.provider === 'OpenAI'" v-model="editForm.model">
                <a-option value="gpt-4-vision-preview">gpt-4-vision-preview</a-option>
                <a-option value="gpt-4-1106-preview">gpt-4-1106-preview</a-option>
                <a-option value="gpt-4">gpt-4</a-option>
                <a-option value="gpt-4-32k">gpt-4-32k</a-option>
                <a-option value="gpt-3.5-turbo">gpt-3.5-turbo</a-option>
                <a-option value="gpt-3.5-turbo-16k">gpt-3.5-turbo-16k</a-option>
              </a-select>
              <a-select v-else-if="editForm.provider === 'Spark'" v-model="editForm.model">
                <a-option value="v1.1">spark-v1.5</a-option>
                <a-option value="v2.1">spark-v2.0</a-option>
                <a-option value="v3.1">spark-v3.0</a-option>
              </a-select>
              <a-select v-else-if="editForm.provider === 'ERNIEBot'" v-model="editForm.model">
                <a-option value="ERNIE-Bot 4.0">ERNIE-Bot 4.0</a-option>
                <a-option value="ERNIE-Bot-8K">ERNIE-Bot-8K</a-option>
                <a-option value="ERNIE-Bot">ERNIE-Bot</a-option>
                <a-option value="ERNIE-Bot-turbo">ERNIE-Bot-turbo</a-option>
              </a-select>
              <a-select v-else-if="editForm.provider === 'Tongyi'" v-model="editForm.model">
                <a-option value="qwen-turbo">qwen-turbo</a-option>
                <a-option value="qwen-plus">qwen-plus</a-option>
                <a-option value="qwen-max">qwen-max</a-option>
                <a-option value="qwen-vl-plus">qwen-vl-plus</a-option>
              </a-select>
            </a-form-item>
            <a-form-item
              v-if="editForm.provider === 'OpenAI'"
              field="maxTokens"
              :label="$t('assistantList.maxTokens')"
            >
              <a-input-number
                v-model="editForm.maxTokens"
                :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.maxTokens')"
                :min="1"
              />
            </a-form-item>
            <a-form-item field="inputMaxTokens" :label="$t('assistantList.inputMaxTokens')">
              <a-input-number
                v-model="editForm.inputMaxTokens"
                :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.inputMaxTokens')"
                :min="1"
              />
            </a-form-item>
            <a-form-item field="contextSize" :label="$t('assistantList.contextSize')">
              <a-input-number
                v-model="editForm.contextSize"
                :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.contextSize')"
                :min="0"
              />
            </a-form-item>
          </template>
          <!-- 绘画助手参数 -->
          <template v-if="currentAssistant.type === 'drawing'">
            <!-- 提供商 -->
            <a-form-item field="provider" :label="$t('assistantList.provider')">
              <a-select v-model="editForm.provider">
                <a-option value="OpenAI">{{ $t('bigModelProvider.OpenAI') }}</a-option>
              </a-select>
            </a-form-item>
            <!-- 模型 -->
            <a-form-item field="model" :label="$t('assistantList.model')">
              <a-select v-if="editForm.provider === 'OpenAI'" v-model="editForm.model">
                <a-option value="dall-e-2" @click="() => (editForm.imageSize = '1024x1024')"
                  >dall-e-2</a-option
                >
                <a-option value="dall-e-3" @click="() => (editForm.imageSize = '1024x1024')"
                  >dall-e-3</a-option
                >
              </a-select>
            </a-form-item>
            <!-- 图片大小 -->
            <a-form-item field="model" :label="$t('assistantList.imageSize')">
              <a-select v-if="editForm.provider === 'OpenAI'" v-model="editForm.imageSize">
                <a-option v-if="editForm.model === 'dall-e-2'" value="256x256">256x256</a-option>
                <a-option v-if="editForm.model === 'dall-e-2'" value="512x512">512x512</a-option>
                <a-option value="1024x1024">1024x1024</a-option>
                <a-option v-if="editForm.model === 'dall-e-3'" value="1792x1024"
                  >1792x1024</a-option
                >
                <a-option v-if="editForm.model === 'dall-e-3'" value="1024x1792"
                  >1024x1792</a-option
                >
              </a-select>
            </a-form-item>
          </template>
        </a-form>
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
