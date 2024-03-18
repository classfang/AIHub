<script setup lang="ts">
import drawingModels from '@renderer/assets/json/drawing-models.json'
import { useDrawingStore } from '@renderer/store/drawing'
import { watch } from 'vue'

// store
const drawingStore = useDrawingStore()

// 数据监听
watch(
  () => drawingStore.getCurrentTask.provider,
  (value) => {
    drawingStore.getCurrentTask.options = {}
    switch (value) {
      case 'OpenAI':
        drawingStore.getCurrentTask.model = 'dall-e-3'
        break
      case 'Spark':
        drawingStore.getCurrentTask.model = 'tti-v2.1'
        break
      case 'Tongyi':
        drawingStore.getCurrentTask.model = 'wanx-v1'
        break
    }
  }
)
watch(
  () => drawingStore.getCurrentTask.model,
  () => {
    drawingStore.getCurrentTask.options = {}
    drawingStore.getCurrentTask.options.size = '1024x1024'
    switch (drawingStore.getCurrentTask.provider) {
      case 'OpenAI':
        drawingStore.getCurrentTask.options.style = 'vivid'
        if (drawingStore.getCurrentTask.model === 'dall-e-3') {
          drawingStore.getCurrentTask.options.quality = 'standard'
        }
        break
      case 'Tongyi':
        drawingStore.getCurrentTask.options.style = '<auto>'
        break
    }
  }
)
</script>

<template>
  <div class="ai-drawing-console">
    <a-form :model="drawingStore.getCurrentTask" layout="vertical">
      <!-- 提供商 -->
      <a-form-item field="provider" :label="$t('aiDrawing.provider')">
        <a-select v-model="drawingStore.getCurrentTask.provider">
          <a-option v-for="p in Object.keys(drawingModels)" :key="p" :value="p">{{
            $t(`bigModelProvider.${p}`)
          }}</a-option>
        </a-select>
      </a-form-item>
      <!-- 模型 -->
      <a-form-item field="model" :label="$t('aiDrawing.model')">
        <a-select v-model="drawingStore.getCurrentTask.model" allow-search>
          <a-option
            v-for="m in drawingModels[drawingStore.getCurrentTask.provider]"
            :key="m.name"
            :value="m.value"
            >{{ m['name'] }}</a-option
          >
        </a-select>
      </a-form-item>
      <!-- 图片大小 -->
      <a-form-item field="size" :label="$t('aiDrawing.size')">
        <a-select v-model="drawingStore.getCurrentTask.options.size">
          <template v-if="drawingStore.getCurrentTask.model === 'dall-e-2'">
            <a-option value="256x256">256x256</a-option>
            <a-option value="512x512">512x512</a-option>
            <a-option value="1024x1024">1024x1024</a-option>
          </template>
          <template v-if="drawingStore.getCurrentTask.model === 'dall-e-3'">
            <a-option value="1024x1024">1024x1024</a-option>
            <a-option value="1792x1024">1792x1024</a-option>
            <a-option value="1024x1792">1024x1792</a-option>
          </template>
          <template v-if="drawingStore.getCurrentTask.provider === 'Tongyi'">
            <a-option value="720x1280">720x1280</a-option>
            <a-option value="1280x720">1280x720</a-option>
          </template>
          <template v-if="drawingStore.getCurrentTask.provider === 'Spark'">
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
        v-if="drawingStore.getCurrentTask.model === 'dall-e-3'"
        field="style"
        :label="$t('aiDrawing.style')"
      >
        <a-select v-model="drawingStore.getCurrentTask.options.style">
          <a-option value="vivid">vivid</a-option>
          <a-option value="natural">natural</a-option>
        </a-select>
      </a-form-item>
      <a-form-item
        v-if="drawingStore.getCurrentTask.provider === 'Tongyi'"
        field="style"
        :label="$t('aiDrawing.style')"
      >
        <a-select v-model="drawingStore.getCurrentTask.options.style">
          <a-option value="<auto>">{{ $t('aiDrawing.styleOption.auto') }}</a-option>
          <a-option value="<3d cartoon>">{{ $t('aiDrawing.styleOption.3dCartoon') }}</a-option>
          <a-option value="<anime>">{{ $t('aiDrawing.styleOption.anime') }}</a-option>
          <a-option value="<oil painting>">{{ $t('aiDrawing.styleOption.oilPainting') }}</a-option>
          <a-option value="<watercolor>">{{ $t('aiDrawing.styleOption.watercolor') }}</a-option>
          <a-option value="<sketch>">{{ $t('aiDrawing.styleOption.sketch') }}</a-option>
          <a-option value="<chinese painting>">{{
            $t('aiDrawing.styleOption.chinesePainting')
          }}</a-option>
          <a-option value="<flat illustration>">{{
            $t('aiDrawing.styleOption.flatIllustration')
          }}</a-option>
        </a-select>
      </a-form-item>
      <!-- 图片质量 -->
      <a-form-item
        v-if="
          drawingStore.getCurrentTask.provider === 'OpenAI' &&
          drawingStore.getCurrentTask.model === 'dall-e-3'
        "
        field="quality"
        :label="$t('aiDrawing.quality')"
      >
        <a-select v-model="drawingStore.getCurrentTask.options.quality">
          <a-option value="standard">standard</a-option>
          <a-option value="hd">hd</a-option>
        </a-select>
      </a-form-item>
    </a-form>
  </div>
</template>

<style scoped lang="less">
.ai-drawing-console {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  box-sizing: border-box;
}
</style>
