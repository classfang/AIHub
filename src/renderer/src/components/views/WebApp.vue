<script setup lang="ts">
import MyWebView from '@renderer/components/MyWebView.vue'
import { reactive, ref, toRefs } from 'vue'

const openaiWebviewRef = ref()
const sparkWebviewRef = ref()
const ernieBotWebviewRef = ref()
const tongyiWebviewRef = ref()

const data = reactive({
  activeKey: '1'
})
const { activeKey } = toRefs(data)
</script>

<template>
  <div class="web-app drag-area">
    <a-tabs v-model:active-key="activeKey" lazy-load>
      <a-tab-pane key="1">
        <template #title>
          <div class="tab-title no-drag-area">
            <div>{{ $t('bigModelProvider.OpenAI') }}</div>
            <a-button
              v-if="activeKey === '1'"
              type="text"
              size="mini"
              shape="circle"
              @click="openaiWebviewRef.reload()"
            >
              <icon-refresh />
            </a-button>
          </div>
        </template>
        <MyWebView
          ref="openaiWebviewRef"
          url="https://chat.openai.com"
          :allowpopups="true"
          class="web-app-webview no-drag-area"
        />
      </a-tab-pane>
      <a-tab-pane key="2">
        <template #title>
          <div class="tab-title no-drag-area">
            <div>{{ $t('bigModelProvider.Spark') }}</div>
            <a-button
              v-if="activeKey === '2'"
              type="text"
              size="mini"
              shape="circle"
              @click="sparkWebviewRef.reload()"
            >
              <icon-refresh />
            </a-button>
          </div>
        </template>
        <MyWebView
          ref="sparkWebviewRef"
          url="https://xinghuo.xfyun.cn/desk"
          :allowpopups="true"
          class="web-app-webview no-drag-area"
        />
      </a-tab-pane>
      <a-tab-pane key="3">
        <template #title>
          <div class="tab-title no-drag-area">
            <div>{{ $t('bigModelProvider.ERNIEBot') }}</div>
            <a-button
              v-if="activeKey === '3'"
              type="text"
              size="mini"
              shape="circle"
              @click="ernieBotWebviewRef.reload()"
            >
              <icon-refresh />
            </a-button>
          </div>
        </template>
        <MyWebView
          ref="ernieBotWebviewRef"
          url="https://yiyan.baidu.com"
          :allowpopups="true"
          class="web-app-webview no-drag-area"
        />
      </a-tab-pane>
      <a-tab-pane key="4">
        <template #title>
          <div class="tab-title no-drag-area">
            <div>{{ $t('bigModelProvider.Tongyi') }}</div>
            <a-button
              v-if="activeKey === '4'"
              type="text"
              size="mini"
              shape="circle"
              @click="tongyiWebviewRef.reload()"
            >
              <icon-refresh />
            </a-button>
          </div>
        </template>
        <MyWebView
          ref="tongyiWebviewRef"
          url="https://tongyi.aliyun.com/qianwen"
          :allowpopups="true"
          class="web-app-webview no-drag-area"
        />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<style lang="less" scoped>
.web-app {
  width: 100%;

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
