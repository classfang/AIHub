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
      case 'ERNIE':
        drawingStore.getCurrentTask.model = 'sd_xl'
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
      case 'ERNIE':
        drawingStore.getCurrentTask.options.steps = 20
        drawingStore.getCurrentTask.options.samplerIndex = 'Euler a'
        drawingStore.getCurrentTask.options.cfgScale = 5
        drawingStore.getCurrentTask.options.style = 'Base'
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
          <template v-if="drawingStore.getCurrentTask.model === 'wanx-v1'">
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
          <template v-if="drawingStore.getCurrentTask.model === 'sd_xl'">
            <a-option value="768x768">768x768</a-option>
            <a-option value="768x1024">768x1024</a-option>
            <a-option value="1024x768">1024x768</a-option>
            <a-option value="576x1024">576x1024</a-option>
            <a-option value="1024x576">1024x576</a-option>
            <a-option value="1024x1024">1024x1024</a-option>
          </template>
        </a-select>
      </a-form-item>
      <!-- 步骤 -->
      <a-form-item
        v-if="drawingStore.getCurrentTask.model === 'sd_xl'"
        field="steps"
        :label="$t('aiDrawing.steps')"
      >
        <a-input-number v-model="drawingStore.getCurrentTask.options.steps" :min="10" :max="50" />
      </a-form-item>
      <!-- 采样方式 -->
      <a-form-item
        v-if="drawingStore.getCurrentTask.model === 'sd_xl'"
        field="samplerIndex"
        :label="$t('aiDrawing.samplerIndex')"
      >
        <a-select v-model="drawingStore.getCurrentTask.options.samplerIndex">
          <a-option value="Euler">Euler</a-option>
          <a-option value="Euler a">Euler a</a-option>
          <a-option value="DPM++ 2M">DPM++ 2M</a-option>
          <a-option value="DPM++ 2M Karras">DPM++ 2M Karras</a-option>
          <a-option value="LMS Karras">LMS Karras</a-option>
          <a-option value="DPM++ SDE">DPM++ SDE</a-option>
          <a-option value="DPM++ SDE Karras">DPM++ SDE Karras</a-option>
          <a-option value="DPM2 a Karras">DPM2 a Karras</a-option>
          <a-option value="Heun">Heun</a-option>
          <a-option value="DPM++ 2M SDE">DPM++ 2M SDE</a-option>
          <a-option value="DPM++ 2M SDE Karras">DPM++ 2M SDE Karras</a-option>
          <a-option value="DPM2">DPM2</a-option>
          <a-option value="DPM2 Karras">DPM2 Karras</a-option>
          <a-option value="DPM2 a">DPM2 a</a-option>
          <a-option value="LMS">LMS</a-option>
        </a-select>
      </a-form-item>
      <!-- 提示词相关性 -->
      <a-form-item
        v-if="drawingStore.getCurrentTask.model === 'sd_xl'"
        field="cfgScale"
        :label="$t('aiDrawing.cfgScale')"
      >
        <a-input-number v-model="drawingStore.getCurrentTask.options.cfgScale" :min="0" :max="30" />
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
        v-if="drawingStore.getCurrentTask.model === 'wanx-v1'"
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
      <a-form-item
        v-if="drawingStore.getCurrentTask.model === 'sd_xl'"
        field="style"
        :label="$t('aiDrawing.style')"
      >
        <a-select v-model="drawingStore.getCurrentTask.options.style">
          <a-option value="Base">{{ $t('aiDrawing.styleOption.base') }}</a-option>
          <a-option value="3D Model">{{ $t('aiDrawing.styleOption.3dModel') }}</a-option>
          <a-option value="Analog Film">{{ $t('aiDrawing.styleOption.analogFilm') }}</a-option>
          <a-option value="Anime">{{ $t('aiDrawing.styleOption.anime') }}</a-option>
          <a-option value="Cinematic">{{ $t('aiDrawing.styleOption.cinematic') }}</a-option>
          <a-option value="Comic Book">{{ $t('aiDrawing.styleOption.comicBook') }}</a-option>
          <a-option value="Craft Clay">{{ $t('aiDrawing.styleOption.craftClay') }}</a-option>
          <a-option value="Digital Art">{{ $t('aiDrawing.styleOption.digitalArt') }}</a-option>
          <a-option value="Enhance">{{ $t('aiDrawing.styleOption.enhance') }}</a-option>
          <a-option value="Fantasy Art">{{ $t('aiDrawing.styleOption.fantasyArt') }}</a-option>
          <a-option value="Isometric">{{ $t('aiDrawing.styleOption.isometric') }}</a-option>
          <a-option value="Line Art">{{ $t('aiDrawing.styleOption.lineArt') }}</a-option>
          <a-option value="Lowpoly">{{ $t('aiDrawing.styleOption.lowpoly') }}</a-option>
          <a-option value="Neonpunk">{{ $t('aiDrawing.styleOption.neonpunk') }}</a-option>
          <a-option value="Origami">{{ $t('aiDrawing.styleOption.origami') }}</a-option>
          <a-option value="Photographic">{{ $t('aiDrawing.styleOption.photographic') }}</a-option>
          <a-option value="Pixel Art">{{ $t('aiDrawing.styleOption.pixelArt') }}</a-option>
          <a-option value="Texture">{{ $t('aiDrawing.styleOption.texture') }}</a-option>
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
      <a-form-item
        v-if="['wanx-v1', 'sd_xl'].includes(drawingStore.getCurrentTask.model)"
        field="negativePrompt"
        :label="$t('aiDrawing.negativePrompt')"
      >
        <a-textarea
          v-model="drawingStore.getCurrentTask.negativePrompt"
          :placeholder="$t('aiDrawing.promptPlaceholder')"
          :auto-size="{
            minRows: 3,
            maxRows: 3
          }"
          allow-clear
        />
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
