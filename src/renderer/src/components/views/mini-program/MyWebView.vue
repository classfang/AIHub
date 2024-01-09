<script setup lang="ts">
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
  isWebviewLoading: false,
  isWebviewLoadingError: false
})
const { isWebviewLoading, isWebviewLoadingError } = toRefs(data)

// webview加载开始
const webviewStartLoading = (): void => {
  console.log('webviewStartLoading', props.url)
  data.isWebviewLoading = true
}

// webview加载完毕
const webviewStopLoading = (event: any): void => {
  console.log('webviewStopLoading', props.url, event)
  data.isWebviewLoading = false
}

// webview加载失败
const webviewFailLoad = (event: any): void => {
  console.log('webviewFailLoad', props.url, event)
  data.isWebviewLoadingError = true
  data.isWebviewLoading = false
}

// 重新加载
const reload = () => {
  console.log('webviewReload', props.url)
  data.isWebviewLoadingError = false
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
      :src="url"
      :allowpopups="allowpopups"
      @did-start-loading="webviewStartLoading"
      @did-stop-loading="webviewStopLoading"
      @did-fail-load="webviewFailLoad"
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
