<script setup lang="ts">
import chatModels from '@renderer/assets/json/chat-models.json'
import {
  isSupportImage,
  isSupportNetwork,
  isSupportPlugin
} from '@renderer/utils/big-model/base-util'
import { watch } from 'vue'

defineProps({
  // 是否是虚拟助手模式
  isVirtual: {
    type: Boolean,
    default: () => false
  },
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

    // 发音参数
    if (value === 'OpenAI') {
      assistant.value.speechModel = 'tts-1'
      assistant.value.speechVoice = 'alloy'
      assistant.value.speechSpeed = 1.0
    } else {
      assistant.value.speechModel = undefined
      assistant.value.speechVoice = undefined
      assistant.value.speechSpeed = undefined
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
    <a-form-item
      field="name"
      :label="isVirtual ? $t('assistantList.title') : $t('assistantList.name')"
    >
      <a-input
        v-model="assistant.name"
        :placeholder="
          $t('common.pleaseEnter') +
          ' ' +
          (isVirtual ? $t('assistantList.title') : $t('assistantList.name'))
        "
        :max-length="30"
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
          :auto-size="{ minRows: 3, maxRows: 10 }"
        />
      </a-form-item>
      <!-- 提供商 -->
      <a-form-item field="provider" :label="$t('assistantList.provider')">
        <a-select v-model="assistant.provider" :fallback-option="false">
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
            <a-select v-model="assistant.model" allow-search :fallback-option="false">
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
              <a-tag v-else color="gray" bordered>
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
              <a-tag v-else color="gray" bordered>
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
              <a-tag v-else color="gray" bordered>
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

      <!-- 发音 -->
      <template v-if="assistant.provider === 'OpenAI'">
        <!-- 发音模型 -->
        <a-form-item field="speechModel" :label="$t('assistantList.speechModel')">
          <a-select
            v-model="assistant.speechModel"
            :fallback-option="false"
            :placeholder="$t('common.pleaseSelect') + ' ' + $t('assistantList.speechModel')"
          >
            <a-option value="tts-1">tts-1</a-option>
            <a-option value="tts-1-hd">tts-1-hd</a-option>
          </a-select>
        </a-form-item>
        <!-- 发音人 -->
        <a-form-item field="speechVoice" :label="$t('assistantList.speechVoice')">
          <a-select
            v-model="assistant.speechVoice"
            :fallback-option="false"
            :placeholder="$t('common.pleaseSelect') + ' ' + $t('assistantList.speechVoice')"
          >
            <a-option value="alloy">alloy</a-option>
            <a-option value="echo">echo</a-option>
            <a-option value="fable">fable</a-option>
            <a-option value="onyx">onyx</a-option>
            <a-option value="nova">nova</a-option>
            <a-option value="shimmer">shimmer</a-option>
          </a-select>
        </a-form-item>
        <!-- 发音语速 -->
        <a-form-item field="speechSpeed" :label="$t('assistantList.speechSpeed')">
          <a-input-number
            v-model="assistant.speechSpeed"
            :min="0.25"
            :max="4.0"
            :placeholder="$t('common.pleaseEnter') + ' ' + $t('assistantList.speechSpeed')"
          />
        </a-form-item>
      </template>
    </template>
  </a-form>
</template>

<style scoped lang="less"></style>
