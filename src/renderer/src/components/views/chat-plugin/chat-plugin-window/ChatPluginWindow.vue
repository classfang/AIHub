<script setup lang="ts">
import ChatPluginWindowHeader from '@renderer/components/views/chat-plugin/chat-plugin-window/ChatPluginWindowHeader.vue'
import { useChatPluginStore } from '@renderer/store/chat-plugin'
import { executeJavaScript } from '@renderer/utils/ipc-util'
import { reactive, toRefs } from 'vue'

// store
const chatPluginStore = useChatPluginStore()

// 数据绑定
const data = reactive({
  testModalVisible: false,
  testParams: {},
  testResult: ''
})
const { testModalVisible, testParams, testResult } = toRefs(data)

// 删除参数
const deleteParam = (index: number) => {
  chatPluginStore.getCurrentChatPlugin.parameters.splice(index, 1)
  if (chatPluginStore.getCurrentChatPlugin.parameters.length === 0) {
    chatPluginStore.getCurrentChatPlugin.parameters.push({
      name: '',
      type: 'string',
      description: ''
    })
  }
}

// 增加参数
const addParam = (index: number) => {
  chatPluginStore.getCurrentChatPlugin.parameters.splice(index + 1, 0, {
    name: '',
    type: 'string',
    description: ''
  })
}

// 运行测试
const handleTestModalBeforeOk = async () => {
  await new Promise<void>((resolve) => {
    executeJavaScript(
      `var params = ${JSON.stringify(data.testParams)};${chatPluginStore.getCurrentChatPlugin.code}`
    )
      .then((res) => {
        data.testResult = res
      })
      .catch((e) => {
        data.testResult = e
      })
      .finally(() => {
        resolve()
      })
  })
  return false
}

// 测试插件 Modal 关闭
const handleTestModalClose = () => {
  data.testParams = {}
  data.testResult = ''
}
</script>

<template>
  <div class="chat-plugin-window">
    <!-- 头部 -->
    <ChatPluginWindowHeader />

    <!-- 主体 -->
    <div class="chat-plugin-body">
      <a-space direction="vertical" :size="10" fill>
        <div>{{ $t('chatPlugin.window.code') }}</div>
        <a-textarea
          v-model="chatPluginStore.getCurrentChatPlugin.code"
          :placeholder="$t('chatPlugin.window.codePlaceholder')"
          :auto-size="{ minRows: 10, maxRows: 10 }"
          class="code-textarea"
        />
      </a-space>

      <a-space direction="vertical" :size="10" fill>
        <div>{{ $t('chatPlugin.window.param') }}</div>
        <div
          v-for="(p, index) in chatPluginStore.getCurrentChatPlugin.parameters"
          :key="index"
          class="param-item"
        >
          <a-input v-model="p.name" size="small" :placeholder="$t('chatPlugin.window.paramName')" />
          <a-select v-model="p.type" size="small" :placeholder="$t('chatPlugin.window.paramType')">
            <a-option value="string">string</a-option>
            <a-option value="number">number</a-option>
            <a-option value="integer">integer</a-option>
            <a-option value="object">object</a-option>
            <a-option value="array">array</a-option>
            <a-option value="boolean">boolean</a-option>
          </a-select>
          <a-input
            v-model="p.description"
            size="small"
            :placeholder="$t('chatPlugin.window.paramDesc')"
          />
          <a-button class="param-delete-btn" @click="deleteParam(index)">
            <icon-minus :size="16" />
          </a-button>
          <a-button class="param-new-btn" @click="addParam(index)">
            <icon-plus :size="16" />
          </a-button>
        </div>
      </a-space>
    </div>
    <div class="chat-plugin-footer">
      <a-button type="primary" size="small" @click="testModalVisible = true">
        <template #icon>
          <icon-play-arrow />
        </template>
        {{ $t('chatPlugin.window.test') }}
      </a-button>
    </div>

    <!-- 测试插件Modal -->
    <a-modal
      v-model:visible="testModalVisible"
      :ok-text="$t('common.run')"
      :cancel-text="$t('common.cancel')"
      unmount-on-close
      title-align="start"
      width="80vw"
      :on-before-ok="handleTestModalBeforeOk"
      @close="handleTestModalClose"
    >
      <template #title> {{ $t('chatPlugin.window.test') }}</template>
      <div class="test-plugin-modal">
        <div class="test-params">
          <a-form :model="testParams">
            <a-form-item
              v-for="(p, index) in chatPluginStore.getCurrentChatPlugin.parameters.filter(
                (param) => param.name.trim().length > 0
              )"
              :key="index"
              :label="p.name"
            >
              <a-input v-model="testParams[p.name]" size="small" :placeholder="p.description" />
            </a-form-item>
          </a-form>
        </div>
        <a-textarea
          v-model="testResult"
          :placeholder="$t('chatPlugin.window.testResult')"
          :auto-size="{ minRows: 3, maxRows: 3 }"
          class="test-result-textarea"
        />
      </div>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.chat-plugin-window {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 15px;

  .chat-plugin-body {
    flex: 1;
    min-height: 0;
    padding: 0 15px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;

    .code-textarea {
      border: none;
      background-color: var(--color-fill-2);
    }

    .param-item {
      display: flex;
      gap: 5px;
      align-items: center;

      .param-new-btn,
      .param-delete-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        height: 28px;
        width: 28px;
        padding: 0;
        flex-shrink: 0;
      }
    }
  }

  .chat-plugin-footer {
    padding: 0 15px 15px 15px;
    display: flex;
    flex-direction: row-reverse;
  }
}

.test-plugin-modal {
  height: 60vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;

  .test-params {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .test-result-textarea {
    flex-shrink: 0;
    border: none;
    background-color: var(--color-fill-2);
  }
}
</style>
