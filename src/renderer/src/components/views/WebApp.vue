<script setup lang="ts">
import MyWebView from '@renderer/components/MyWebView.vue'
import { nextTick, reactive, toRefs } from 'vue'
import { openInBrowser } from '@renderer/utils/window-util'

const data = reactive({
  activeKey: 'OpenAI',
  webList: [
    {
      name: 'OpenAI',
      url: 'https://chat.openai.com'
    },
    {
      name: 'Spark',
      url: 'https://xinghuo.xfyun.cn/desk'
    },
    {
      name: 'ERNIEBot',
      url: 'https://yiyan.baidu.com'
    },
    {
      name: 'Tongyi',
      url: 'https://tongyi.aliyun.com/qianwen'
    }
  ]
})
const { activeKey, webList } = toRefs(data)

const webViewReload = (w) => {
  const url = w.url
  w.url = ''
  nextTick(() => {
    w.url = url
  })
}
</script>

<template>
  <div class="web-app drag-area">
    <a-tabs v-model:active-key="activeKey" lazy-load>
      <a-tab-pane v-for="w in webList" :key="w.name">
        <template #title>
          <div class="tab-title no-drag-area">
            <div>{{ $t('bigModelProvider.' + w.name) }}</div>
            <a-button
              v-if="activeKey === w.name"
              type="text"
              size="mini"
              shape="circle"
              @click="webViewReload(w)"
            >
              <icon-refresh />
            </a-button>
          </div>
        </template>
        <MyWebView :url="w.url" :allowpopups="true" class="web-app-webview no-drag-area" />
      </a-tab-pane>
    </a-tabs>
    <div class="open-in-browser">
      <icon-launch
        class="open-in-browser-icon no-drag-area"
        @click="openInBrowser(webList.find((w) => w.name === activeKey)?.url)"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.web-app {
  width: 100%;
  position: relative;

  .open-in-browser {
    height: 42px;
    position: absolute;
    top: 0;
    right: 15px;
    display: flex;
    align-items: center;

    .open-in-browser-icon {
      font-size: 18px;
      stroke-width: 3;

      &:hover {
        color: rgb(var(--primary-6));
      }
    }
  }

  :deep(.tab-title) {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .web-app-webview {
    width: 100%;
    height: calc(100vh - 40px - 5px);
    border: none;
  }

  :deep(.arco-tabs-content) {
    padding-top: 5px;
  }
}
</style>
