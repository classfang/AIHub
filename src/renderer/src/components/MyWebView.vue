<script setup lang="ts">
import { nowTimestamp } from '@renderer/utils/date-util'
import { reactive, ref, toRefs } from 'vue'

const webviewRef = ref()

const props = defineProps({
  url: {
    type: String,
    default: () => ''
  },
  allowpopups: {
    type: Boolean,
    default: () => false
  }
})

const data = reactive({
  currentUrl: props.url,
  isWebviewLoading: false,
  isWebviewLoadingError: false,
  startTimestamp: nowTimestamp()
})
const { currentUrl, isWebviewLoading, isWebviewLoadingError } = toRefs(data)

// webview加载完开始
const webviewStartLoad = (): void => {
  console.log('webviewStartLoad', props.url)
  data.isWebviewLoading = true
}

// webview加载完毕
const webviewEndLoad = (event): void => {
  console.log('webviewEndLoad', props.url, event)
  // 加载时间超过50秒，认为超时
  if ((nowTimestamp() - data.startTimestamp) / 1000 > 50) {
    data.isWebviewLoadingError = true
  }
  data.isWebviewLoading = false
}

// 重新加载
const reload = () => {
  data.isWebviewLoadingError = false
  data.startTimestamp = nowTimestamp()
  webviewRef.value.reload()
}

defineExpose({
  reload
})
</script>

<template>
  <div class="web-app-window">
    <webview
      ref="webviewRef"
      class="webview"
      :src="currentUrl"
      :allowpopups="allowpopups"
      @did-start-loading="webviewStartLoad"
      @did-stop-loading="webviewEndLoad"
    ></webview>
    <div v-if="isWebviewLoading" class="webview-loading">
      <a-spin dot />
    </div>
    <div v-else-if="isWebviewLoadingError" class="webview-loading-error">
      <a-button size="small" @click="reload()">{{ $t('common.loadErrorRetry') }}</a-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.web-app-window {
  height: 100%;
  width: 100%;
  position: relative;

  .webview {
    height: 100%;
    background-color: var(--color-bg-1);
    position: relative;
  }

  .webview-loading {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .webview-loading-error {
    height: 100%;
    width: 100%;
    background-color: var(--color-bg-1);
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
