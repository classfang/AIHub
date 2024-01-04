<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue'

const props = defineProps({
  assistant: {
    type: Object as () => Assistant,
    default: () => {}
  },
  typeChange: {
    type: Boolean,
    default: () => false
  }
})

const assistantForm = ref(props.assistant)

const emit = defineEmits(['update:assistant'])

watchEffect(() => {
  emit('update:assistant', assistantForm.value)
})

watch(
  () => assistantForm.value.type,
  (value) => {
    assistantForm.value.provider = 'OpenAI'
    switch (value) {
      case 'chat':
        assistantForm.value.model = 'gpt-4-vision-preview'
        break
      case 'drawing':
        assistantForm.value.model = 'dall-e-3'
        break
    }
  }
)

watch(
  () => assistantForm.value.provider,
  (value) => {
    switch (value) {
      case 'OpenAI':
        assistantForm.value.model =
          assistantForm.value.type === 'chat' ? 'gpt-4-vision-preview' : 'dall-e-3'
        break
      case 'Gemini':
        assistantForm.value.model = 'gemini-pro-vision'
        break
      case 'Spark':
        assistantForm.value.model = 'v3.1'
        break
      case 'ERNIEBot':
        assistantForm.value.model = 'ERNIE-Bot 4.0'
        break
      case 'Tongyi':
        assistantForm.value.model = assistantForm.value.type === 'chat' ? 'qwen-vl-plus' : 'wanx-v1'
        break
    }
  }
)

watch(
  () => assistantForm.value.model,
  () => {
    if (assistantForm.value.type === 'drawing') {
      assistantForm.value.imageSize = '1024x1024'
      switch (assistantForm.value.provider) {
        case 'OpenAI':
          assistantForm.value.imageStyle = 'vivid'
          break
        case 'Tongyi':
          assistantForm.value.imageStyle = '<auto>'
          break
      }
    }
  }
)
</script>

<template>
  <a-form :model="assistantForm" layout="vertical">
    <!-- 助手类型选择器 -->
    <a-form-item v-if="typeChange" field="type" :label="$t('assistantList.type')">
      <a-radio-group v-model="assistantForm.type">
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
          <a-option value="OpenAI">{{ $t('bigModelProvider.OpenAI') }}</a-option>
          <a-option value="Gemini">{{ $t('bigModelProvider.Gemini') }}</a-option>
          <a-option value="Spark">{{ $t('bigModelProvider.Spark') }}</a-option>
          <a-option value="ERNIEBot">{{ $t('bigModelProvider.ERNIEBot') }}</a-option>
          <a-option value="Tongyi">{{ $t('bigModelProvider.Tongyi') }}</a-option>
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
        <a-select v-if="assistantForm.provider === 'Gemini'" v-model="assistantForm.model">
          <a-option value="gemini-pro-vision">gemini-pro-vision</a-option>
          <a-option value="gemini-pro">gemini-pro</a-option>
        </a-select>
        <a-select v-else-if="assistantForm.provider === 'Spark'" v-model="assistantForm.model">
          <a-option value="v3.1">spark-v3.0</a-option>
          <a-option value="v2.1">spark-v2.0</a-option>
          <a-option value="v1.1">spark-v1.5</a-option>
        </a-select>
        <a-select v-else-if="assistantForm.provider === 'ERNIEBot'" v-model="assistantForm.model">
          <a-option value="ERNIE-Bot 4.0">ERNIE-Bot 4.0</a-option>
          <a-option value="ERNIE-Bot-8K">ERNIE-Bot-8K</a-option>
          <a-option value="ERNIE-Bot-turbo">ERNIE-Bot-turbo</a-option>
          <a-option value="ERNIE-Bot">ERNIE-Bot</a-option>
        </a-select>
        <a-select v-else-if="assistantForm.provider === 'Tongyi'" v-model="assistantForm.model">
          <a-option value="qwen-vl-plus">qwen-vl-plus</a-option>
          <a-option value="qwen-max-longcontext">qwen-max-longcontext</a-option>
          <a-option value="qwen-max">qwen-max</a-option>
          <a-option value="qwen-plus">qwen-plus</a-option>
          <a-option value="qwen-turbo">qwen-turbo</a-option>
        </a-select>
      </a-form-item>
      <!-- 生成token限制 -->
      <a-form-item
        v-if="['OpenAI', 'Gemini'].includes(assistantForm.provider)"
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
          <a-option value="Tongyi">{{ $t('bigModelProvider.Tongyi') }}</a-option>
        </a-select>
      </a-form-item>
      <!-- 模型 -->
      <a-form-item field="model" :label="$t('assistantList.model')">
        <a-select v-model="assistantForm.model">
          <template v-if="assistantForm.provider === 'OpenAI'">
            <a-option value="dall-e-3">dall-e-3</a-option>
            <a-option value="dall-e-2">dall-e-2</a-option>
          </template>
          <template v-else-if="assistantForm.provider === 'Tongyi'">
            <a-option value="wanx-v1">wanx-v1</a-option>
          </template>
        </a-select>
      </a-form-item>
      <!-- 图片大小 -->
      <a-form-item field="imageSize" :label="$t('assistantList.imageSize')">
        <a-select v-model="assistantForm.imageSize">
          <template v-if="assistantForm.model === 'dall-e-2'">
            <a-option value="256x256">256x256</a-option>
            <a-option value="512x512">512x512</a-option>
          </template>
          <a-option value="1024x1024">1024x1024</a-option>
          <template v-if="assistantForm.model === 'dall-e-3'">
            <a-option value="1792x1024">1792x1024</a-option>
            <a-option value="1024x1792">1024x1792</a-option>
          </template>
          <template v-if="assistantForm.model === 'Tongyi'">
            <a-option value="720x1280">720x1280</a-option>
            <a-option value="1280x720">1280x720</a-option>
          </template>
        </a-select>
      </a-form-item>
      <!-- 图片风格 -->
      <a-form-item field="imageStyle" :label="$t('assistantList.imageStyle')">
        <a-select v-model="assistantForm.imageStyle">
          <template v-if="assistantForm.model === 'dall-e-3'">
            <a-option value="vivid">vivid</a-option>
            <a-option value="natural">natural</a-option>
          </template>
          <template v-else-if="assistantForm.provider === 'Tongyi'">
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
          </template>
        </a-select>
      </a-form-item>
      <!-- 图片质量 -->
      <a-form-item
        v-if="assistantForm.provider === 'OpenAI' && assistantForm.model === 'dall-e-3'"
        field="imageQuality"
        :label="$t('assistantList.imageQuality')"
      >
        <a-select v-model="assistantForm.imageQuality">
          <a-option value="standard">standard</a-option>
          <a-option value="hd">hd</a-option>
        </a-select>
      </a-form-item>
    </template>
  </a-form>
</template>

<style scoped lang="less"></style>
