<script setup lang="ts">
import ChatPluginWindowHeader from '@renderer/components/views/chat-plugin/chat-plugin-window/ChatPluginWindowHeader.vue'
import { useChatPluginStore } from '@renderer/store/chat-plugin'
import { onMounted } from 'vue'
import { executeJavaScript } from '@renderer/utils/ipc-util'

// store
const chatPluginStore = useChatPluginStore()

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
          allow-clear
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
  </div>
</template>

<style scoped lang="less">
.chat-plugin-window {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .chat-plugin-body {
    flex: 1;
    min-height: 0;
    padding: 15px;
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
}
</style>
