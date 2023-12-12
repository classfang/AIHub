<script setup lang="ts">
import { reactive, toRefs } from 'vue'
import { useAssistantStore } from '@renderer/store/assistant'
import { Message } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { copyObj } from '@renderer/utils/object-util'
import AssistantItem from '@renderer/components/views/chat2assistant/assistant-list/AssistantItem.vue'
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

const newFormTypeChange = (value: string | number | boolean) => {
  data.assistantForm.provider = 'OpenAI'
  switch (value) {
    case 'chat':
      data.assistantForm.model = 'gpt-4-vision-preview'
      break
    case 'drawing':
      data.assistantForm.model = 'dall-e-3'
      break
  }
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
        <a-form :model="assistantForm" layout="vertical">
          <!-- 助手类型选择器 -->
          <a-form-item field="type" :label="$t('assistantList.type')">
            <a-radio-group v-model="assistantForm.type" @change="newFormTypeChange">
              <a-radio value="chat">{{ $t('assistantList.chat') }}</a-radio>
              <a-radio value="drawing">{{ $t('assistantList.drawing') }}</a-radio>
            </a-radio-group>
          </a-form-item>
          <!-- 助手名称 -->
          <a-form-item field="name" :label="$t('assistantList.name')">
            <a-input
              v-model="assistantForm.name"
              :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.name')"
              :max-length="20"
            />
          </a-form-item>
          <!-- 对话助手参数 -->
          <template v-if="assistantForm.type === 'chat'">
            <!-- 指令 -->
            <a-form-item field="instruction" :label="$t('assistantList.instruction')">
              <a-textarea
                v-model="assistantForm.instruction"
                :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.instruction')"
                allow-clear
              />
            </a-form-item>
            <!-- 提供商 -->
            <a-form-item field="provider" :label="$t('assistantList.provider')">
              <a-select v-model="assistantForm.provider">
                <a-option
                  value="OpenAI"
                  @click="() => (assistantForm.model = 'gpt-4-vision-preview')"
                  >{{ $t('bigModelProvider.OpenAI') }}</a-option
                >
                <a-option value="Spark" @click="() => (assistantForm.model = 'v3.1')">{{
                  $t('bigModelProvider.Spark')
                }}</a-option>
                <a-option value="ERNIEBot" @click="() => (assistantForm.model = 'ERNIE-Bot 4.0')">{{
                  $t('bigModelProvider.ERNIEBot')
                }}</a-option>
                <a-option value="Tongyi" @click="() => (assistantForm.model = 'qwen-vl-plus')">{{
                  $t('bigModelProvider.Tongyi')
                }}</a-option>
              </a-select>
            </a-form-item>
            <!-- 模型 -->
            <a-form-item field="model" :label="$t('assistantList.model')">
              <a-select v-if="assistantForm.provider === 'OpenAI'" v-model="assistantForm.model">
                <a-option value="gpt-4-vision-preview">gpt-4-vision-preview</a-option>
                <a-option value="gpt-4-1106-preview">gpt-4-1106-preview</a-option>
                <a-option value="gpt-4-32k">gpt-4-32k</a-option>
                <a-option value="gpt-4">gpt-4</a-option>
                <a-option value="gpt-3.5-turbo-16k">gpt-3.5-turbo-16k</a-option>
                <a-option value="gpt-3.5-turbo">gpt-3.5-turbo</a-option>
              </a-select>
              <a-select
                v-else-if="assistantForm.provider === 'Spark'"
                v-model="assistantForm.model"
              >
                <a-option value="v3.1">spark-v3.0</a-option>
                <a-option value="v2.1">spark-v2.0</a-option>
                <a-option value="v1.1">spark-v1.5</a-option>
              </a-select>
              <a-select
                v-else-if="assistantForm.provider === 'ERNIEBot'"
                v-model="assistantForm.model"
              >
                <a-option value="ERNIE-Bot 4.0">ERNIE-Bot 4.0</a-option>
                <a-option value="ERNIE-Bot-8K">ERNIE-Bot-8K</a-option>
                <a-option value="ERNIE-Bot-turbo">ERNIE-Bot-turbo</a-option>
                <a-option value="ERNIE-Bot">ERNIE-Bot</a-option>
              </a-select>
              <a-select
                v-else-if="assistantForm.provider === 'Tongyi'"
                v-model="assistantForm.model"
              >
                <a-option value="qwen-vl-plus">qwen-vl-plus</a-option>
                <a-option value="qwen-max">qwen-max</a-option>
                <a-option value="qwen-plus">qwen-plus</a-option>
                <a-option value="qwen-turbo">qwen-turbo</a-option>
              </a-select>
            </a-form-item>
            <!-- 生成token限制 -->
            <a-form-item
              v-if="assistantForm.provider === 'OpenAI'"
              field="maxTokens"
              :label="$t('assistantList.maxTokens')"
            >
              <a-input-number
                v-model="assistantForm.maxTokens"
                :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.maxTokens')"
                :min="1"
              />
            </a-form-item>
            <!-- 输入token限制 -->
            <a-form-item field="inputMaxTokens" :label="$t('assistantList.inputMaxTokens')">
              <a-input-number
                v-model="assistantForm.inputMaxTokens"
                :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.inputMaxTokens')"
                :min="1"
              />
            </a-form-item>
            <!-- 上下文条数 -->
            <a-form-item field="contextSize" :label="$t('assistantList.contextSize')">
              <a-input-number
                v-model="assistantForm.contextSize"
                :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.contextSize')"
                :min="0"
              />
            </a-form-item>
          </template>
          <!-- 绘画助手参数 -->
          <template v-if="assistantForm.type === 'drawing'">
            <!-- 提供商 -->
            <a-form-item field="provider" :label="$t('assistantList.provider')">
              <a-select v-model="assistantForm.provider">
                <a-option value="OpenAI">{{ $t('bigModelProvider.OpenAI') }}</a-option>
              </a-select>
            </a-form-item>
            <!-- 模型 -->
            <a-form-item field="model" :label="$t('assistantList.model')">
              <a-select v-if="assistantForm.provider === 'OpenAI'" v-model="assistantForm.model">
                <a-option value="dall-e-3" @click="() => (assistantForm.imageSize = '1024x1024')"
                  >dall-e-3</a-option
                >
                <a-option value="dall-e-2" @click="() => (assistantForm.imageSize = '1024x1024')"
                  >dall-e-2</a-option
                >
              </a-select>
            </a-form-item>
            <!-- 图片大小 -->
            <a-form-item field="model" :label="$t('assistantList.imageSize')">
              <a-select
                v-if="assistantForm.provider === 'OpenAI'"
                v-model="assistantForm.imageSize"
              >
                <a-option v-if="assistantForm.model === 'dall-e-2'" value="256x256"
                  >256x256</a-option
                >
                <a-option v-if="assistantForm.model === 'dall-e-2'" value="512x512"
                  >512x512</a-option
                >
                <a-option value="1024x1024">1024x1024</a-option>
                <a-option v-if="assistantForm.model === 'dall-e-3'" value="1792x1024"
                  >1792x1024</a-option
                >
                <a-option v-if="assistantForm.model === 'dall-e-3'" value="1024x1792"
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
