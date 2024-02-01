<script setup lang="ts">
import { watch } from 'vue'
import chatModels from '@renderer/assets/json/chat-models.json'
import drawingModels from '@renderer/assets/json/drawing-models.json'

defineProps({
  typeChange: {
    type: Boolean,
    default: () => false
  }
})
const assistant = defineModel<Assistant>('assistant', { default: () => ({}) })

watch(
  () => assistant.value.type,
  (value) => {
    assistant.value.provider = 'OpenAI'
    switch (value) {
      case 'chat':
        assistant.value.model = 'gpt-4-vision-preview'
        break
      case 'drawing':
        assistant.value.model = 'dall-e-3'
        break
    }
  }
)

watch(
  () => assistant.value.provider,
  (value) => {
    switch (value) {
      case 'OpenAI':
        assistant.value.model =
          assistant.value.type === 'chat' ? 'gpt-4-vision-preview' : 'dall-e-3'
        break
      case 'Gemini':
        assistant.value.model = 'gemini-pro-vision'
        break
      case 'Spark':
        assistant.value.model = assistant.value.type === 'chat' ? 'chat-v3.1' : 'tti-v2.1'
        break
      case 'ERNIEBot':
        assistant.value.model = 'ERNIE-Bot 4.0'
        break
      case 'Tongyi':
        assistant.value.model = assistant.value.type === 'chat' ? 'qwen-vl-plus' : 'wanx-v1'
        break
      case 'Tiangong':
        assistant.value.model = 'SkyChat-MegaVerse'
        break
    }
  }
)

watch(
  () => assistant.value.model,
  () => {
    if (assistant.value.type === 'drawing') {
      assistant.value.imageSize = '1024x1024'
      switch (assistant.value.provider) {
        case 'OpenAI':
          assistant.value.imageStyle = 'vivid'
          break
        case 'Tongyi':
          assistant.value.imageStyle = '<auto>'
          break
      }
    }
  }
)
</script>

<template>
  <a-form :model="assistant" layout="vertical">
    <!-- 助手类型选择器 -->
    <a-form-item v-if="typeChange" field="type" :label="$t('assistantList.type')">
      <a-radio-group v-model="assistant.type">
        <a-radio value="chat">{{ $t('assistantList.chat') }}</a-radio>
        <a-radio value="drawing">{{ $t('assistantList.drawing') }}</a-radio>
      </a-radio-group>
    </a-form-item>
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
        <a-select v-model="assistant.model" allow-search>
          <a-option v-for="m in chatModels[assistant.provider]" :key="m.name" :value="m.value">{{
            m['name']
          }}</a-option>
        </a-select>
      </a-form-item>
      <!-- 生成token限制 -->
      <a-form-item field="maxTokens" :label="$t('assistantList.maxTokens')">
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
    <!-- 绘画助手参数 -->
    <template v-if="assistant.type === 'drawing'">
      <!-- 提供商 -->
      <a-form-item field="provider" :label="$t('assistantList.provider')">
        <a-select v-model="assistant.provider">
          <a-option v-for="p in Object.keys(drawingModels)" :key="p" :value="p">{{
            $t(`bigModelProvider.${p}`)
          }}</a-option>
        </a-select>
      </a-form-item>
      <!-- 模型 -->
      <a-form-item field="model" :label="$t('assistantList.model')">
        <a-select v-model="assistant.model" allow-search>
          <a-option v-for="m in drawingModels[assistant.provider]" :key="m.name" :value="m.value">{{
            m['name']
          }}</a-option>
        </a-select>
      </a-form-item>
      <!-- 图片大小 -->
      <a-form-item field="imageSize" :label="$t('assistantList.imageSize')">
        <a-select v-model="assistant.imageSize">
          <template v-if="assistant.model === 'dall-e-2'">
            <a-option value="256x256">256x256</a-option>
            <a-option value="512x512">512x512</a-option>
            <a-option value="1024x1024">1024x1024</a-option>
          </template>
          <template v-if="assistant.model === 'dall-e-3'">
            <a-option value="1024x1024">1024x1024</a-option>
            <a-option value="1792x1024">1792x1024</a-option>
            <a-option value="1024x1792">1024x1792</a-option>
          </template>
          <template v-if="assistant.provider === 'Tongyi'">
            <a-option value="720x1280">720x1280</a-option>
            <a-option value="1280x720">1280x720</a-option>
          </template>
          <template v-if="assistant.provider === 'Spark'">
            <a-option value="512x512">512x512</a-option>
            <a-option value="640x360">640x360</a-option>
            <a-option value="640x480">640x480</a-option>
            <a-option value="640x640">640x640</a-option>
            <a-option value="680x512">680x512</a-option>
            <a-option value="512x680">512x680</a-option>
            <a-option value="768x768">768x768</a-option>
            <a-option value="720x1280">720x1280</a-option>
            <a-option value="1280x720">1280x720</a-option>
            <a-option value="1024x1024">1024x1024</a-option>
          </template>
        </a-select>
      </a-form-item>
      <!-- 图片风格 -->
      <a-form-item
        v-if="assistant.model === 'dall-e-3'"
        field="imageStyle"
        :label="$t('assistantList.imageStyle')"
      >
        <a-select v-model="assistant.imageStyle">
          <a-option value="vivid">vivid</a-option>
          <a-option value="natural">natural</a-option>
        </a-select>
      </a-form-item>
      <a-form-item
        v-if="assistant.provider === 'Tongyi'"
        field="imageStyle"
        :label="$t('assistantList.imageStyle')"
      >
        <a-select v-model="assistant.imageStyle">
          <a-option value="<auto>">{{ $t('assistantList.imageStyleOption.auto') }}</a-option>
          <a-option value="<3d cartoon>">{{
            $t('assistantList.imageStyleOption.3dCartoon')
          }}</a-option>
          <a-option value="<anime>">{{ $t('assistantList.imageStyleOption.anime') }}</a-option>
          <a-option value="<oil painting>">{{
            $t('assistantList.imageStyleOption.oilPainting')
          }}</a-option>
          <a-option value="<watercolor>">{{
            $t('assistantList.imageStyleOption.watercolor')
          }}</a-option>
          <a-option value="<sketch>">{{ $t('assistantList.imageStyleOption.sketch') }}</a-option>
          <a-option value="<chinese painting>">{{
            $t('assistantList.imageStyleOption.chinesePainting')
          }}</a-option>
          <a-option value="<flat illustration>">{{
            $t('assistantList.imageStyleOption.flatIllustration')
          }}</a-option>
        </a-select>
      </a-form-item>
      <!-- 图片质量 -->
      <a-form-item
        v-if="assistant.provider === 'OpenAI' && assistant.model === 'dall-e-3'"
        field="imageQuality"
        :label="$t('assistantList.imageQuality')"
      >
        <a-select v-model="assistant.imageQuality">
          <a-option value="standard">standard</a-option>
          <a-option value="hd">hd</a-option>
        </a-select>
      </a-form-item>
    </template>
  </a-form>
</template>

<style scoped lang="less"></style>
