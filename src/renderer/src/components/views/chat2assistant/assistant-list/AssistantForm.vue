<script setup lang="ts">
import chatModels from '@renderer/assets/json/chat-models.json'
import {
  isSupportImage,
  isSupportNetwork,
  isSupportPlugin
} from '@renderer/utils/big-model/base-util'
import { watch } from 'vue'

defineProps({
  typeChange: {
    type: Boolean,
    default: () => false
  }
})
const assistant = defineModel<Assistant>('assistant', { default: () => ({}) })

watch(
  () => assistant.value.provider,
  (value) => {
    switch (value) {
      case 'OpenAI':
        assistant.value.model = 'gpt-4-vision-preview'
        break
      case 'Ollama':
        assistant.value.model = ''
        break
      case 'Gemini':
        assistant.value.model = 'gemini-pro-vision'
        break
      case 'Spark':
        assistant.value.model = 'chat-v3.1'
        break
      case 'ERNIE':
        assistant.value.model = 'ERNIE-Bot 4.0'
        break
      case 'Tongyi':
        assistant.value.model = 'qwen-vl-plus'
        break
      case 'Tiangong':
        assistant.value.model = 'SkyChat-MegaVerse'
        break
      case 'MoonshotAI':
        assistant.value.model = 'moonshot-v1-128k'
        break
    }
  }
)
</script>

<template>
  <a-form :model="assistant" layout="vertical">
    <!-- 助手类型选择器（暂时弃用） -->
    <!--    <a-form-item v-if="typeChange" field="type" :label="$t('assistantList.type')">-->
    <!--      <a-radio-group v-model="assistant.type">-->
    <!--        <a-radio value="chat">{{ $t('assistantList.chat') }}</a-radio>-->
    <!--        <a-radio value="drawing">{{ $t('assistantList.drawing') }}</a-radio>-->
    <!--      </a-radio-group>-->
    <!--    </a-form-item>-->
    <!-- 助手名称 -->
    <a-form-item field="name" :label="$t('assistantList.name')">
      <a-input
        v-model="assistant.name"
        :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.name')"
        :max-length="20"
      />
    </a-form-item>
    <!-- 对话助手参数 -->
    <template v-if="assistant.type === 'chat'">
      <!-- 指令 -->
      <a-form-item field="instruction" :label="$t('assistantList.instruction')">
        <a-textarea
          v-model="assistant.instruction"
          :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.instruction')"
          allow-clear
        />
      </a-form-item>
      <!-- 提供商 -->
      <a-form-item field="provider" :label="$t('assistantList.provider')">
        <a-select v-model="assistant.provider">
          <a-option v-for="p in Object.keys(chatModels)" :key="p" :value="p">{{
            $t(`bigModelProvider.${p}`)
          }}</a-option>
        </a-select>
      </a-form-item>
      <!-- 模型 -->
      <a-form-item field="model" :label="$t('assistantList.model')">
        <a-space direction="vertical" style="width: 100%">
          <template v-if="assistant.provider === 'Ollama'">
            <a-input
              v-model="assistant.model"
              :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.model')"
            />
          </template>
          <template v-else>
            <a-select v-model="assistant.model" allow-search>
              <a-option
                v-for="m in chatModels[assistant.provider]"
                :key="m.name"
                :value="m.value"
                >{{ m['name'] }}</a-option
              >
            </a-select>
            <a-space>
              <a-tag
                v-if="isSupportImage(assistant.provider, assistant.model)"
                color="green"
                bordered
              >
                <template #icon>
                  <icon-check />
                </template>
                {{ $t('assistantList.imageSupported') }}
              </a-tag>
              <a-tag v-else color="red" bordered>
                <template #icon>
                  <icon-close />
                </template>
                {{ $t('assistantList.imageNotSupported') }}
              </a-tag>
              <a-tag
                v-if="isSupportPlugin(assistant.provider, assistant.model)"
                color="green"
                bordered
              >
                <template #icon>
                  <icon-check />
                </template>
                {{ $t('assistantList.pluginSupported') }}
              </a-tag>
              <a-tag v-else color="red" bordered>
                <template #icon>
                  <icon-close />
                </template>
                {{ $t('assistantList.pluginNotSupported') }}
              </a-tag>
              <a-tag
                v-if="isSupportNetwork(assistant.provider, assistant.model)"
                color="green"
                bordered
              >
                <template #icon>
                  <icon-check />
                </template>
                {{ $t('assistantList.networkSupported') }}
              </a-tag>
              <a-tag v-else color="red" bordered>
                <template #icon>
                  <icon-close />
                </template>
                {{ $t('assistantList.networkNotSupported') }}
              </a-tag>
            </a-space>
          </template>
        </a-space>
      </a-form-item>
      <!-- 生成token限制 -->
      <a-form-item
        v-if="assistant.provider != 'Ollama'"
        field="maxTokens"
        :label="$t('assistantList.maxTokens')"
      >
        <a-input-number
          v-model="assistant.maxTokens"
          :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.maxTokens')"
          :min="1"
        />
      </a-form-item>
      <!-- 输入token限制 -->
      <a-form-item field="inputMaxTokens" :label="$t('assistantList.inputMaxTokens')">
        <a-input-number
          v-model="assistant.inputMaxTokens"
          :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.inputMaxTokens')"
          :min="1"
        />
      </a-form-item>
      <!-- 上下文条数 -->
      <a-form-item field="contextSize" :label="$t('assistantList.contextSize')">
        <a-input-number
          v-model="assistant.contextSize"
          :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.contextSize')"
          :min="0"
          :max="100"
        />
      </a-form-item>
    </template>
  </a-form>
</template>

<style scoped lang="less"></style>
