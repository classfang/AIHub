<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, toRefs } from 'vue'
import { openInBrowser } from '@renderer/utils/window-util'
import MyWebView from '@renderer/components/MyWebView.vue'

// ref
const aiAppRef = ref()

// 数据绑定
const data = reactive({
  appList: [
    {
      type: 'webview',
      name: 'OpenAI',
      url: 'https://chat.openai.com'
    },
    {
      type: 'webview',
      name: 'Spark',
      url: 'https://xinghuo.xfyun.cn/desk'
    },
    {
      type: 'webview',
      name: 'ERNIEBot',
      url: 'https://yiyan.baidu.com'
    },
    {
      type: 'webview',
      name: 'Tongyi',
      url: 'https://tongyi.aliyun.com/qianwen'
    }
  ] as AIApp[],
  aiAppListStyle: {
    width: 0,
    cardWidth: 280,
    gap: 15
  },
  keyword: '',
  currentApp: {} as AIApp,
  isWebviewShow: false
})
const { aiAppListStyle, keyword, currentApp, isWebviewShow } = toRefs(data)

// appList 过滤
const appListFilter = computed(() => {
  return data.appList.filter((app) => app.name.toLowerCase().includes(data.keyword.toLowerCase()))
})

// 打开应用
const openApp = (app: AIApp) => {
  data.currentApp = app
  if (app.type === 'webview') {
    data.isWebviewShow = true
  }
}

// webview刷新
const webviewReload = () => {
  const url = data.currentApp.url
  data.currentApp.url = ''
  nextTick(() => {
    data.currentApp.url = url
  })
}

// 监听组件尺寸
const watchAIAppSize = () => {
  const resizeObserver = new ResizeObserver((entries) => {
    // entries 是一个 ResizeObserverEntry 对象数组，包含了目标元素的信息
    for (const entry of entries) {
      // 判断是 aiAppRef
      if (entry.target === aiAppRef.value) {
        // 获取新尺寸
        const newWidth = entry.contentRect.width
        // 计算列表样式
        data.aiAppListStyle.width =
          newWidth -
          (newWidth % (data.aiAppListStyle.cardWidth + data.aiAppListStyle.gap)) -
          data.aiAppListStyle.gap
      }
    }
  })
  resizeObserver.observe(aiAppRef.value)
}

// 挂载完毕
onMounted(() => {
  // 监听组件尺寸
  watchAIAppSize()
})
</script>

<template>
  <div ref="aiAppRef" class="ai-app">
    <div class="ai-app-header drag-area">
      <div class="ai-app-header-title">{{ $t('aiApp.name') }}</div>
      <div class="ai-app-header-search">
        <a-input-search
          v-model="keyword"
          :placeholder="$t('aiApp.search')"
          class="search-input no-drag-area"
        />
      </div>
    </div>
    <a-scrollbar
      outer-class="ai-app-list-container arco-scrollbar-small"
      style="height: calc(100vh - 40px); overflow-y: auto"
    >
      <div
        v-if="appListFilter.length > 0"
        class="ai-app-list"
        :style="{ width: `${aiAppListStyle.width}px` }"
      >
        <div v-for="a in appListFilter" :key="a.name" class="ai-app-card" @click="openApp(a)">
          <a-card :title="$t('aiApp.webview.' + a.name)" hoverable>
            <template #extra>
              <icon-right />
            </template>
            <a-link @click.stop="openInBrowser(a.url)">{{ a.url }}</a-link>
          </a-card>
        </div>
      </div>
      <div v-else class="ai-app-list-empty">
        <a-empty>
          <template #image>
            <icon-apps />
          </template>
          {{ $t('aiApp.empty') }}
        </a-empty>
      </div>
    </a-scrollbar>
    <transition name="slide2top">
      <div v-if="isWebviewShow" class="ai-app-webview">
        <div class="webview-header">
          <div class="webview-header-title">{{ $t('aiApp.webview.' + currentApp.name) }}</div>
          <a-button class="webview-header-btn no-drag-area" @click="webviewReload">
            <icon-refresh :size="16" />
          </a-button>
          <a-button class="webview-header-btn no-drag-area" @click="openInBrowser(currentApp.url)">
            <icon-launch :size="16" />
          </a-button>
          <a-button
            class="webview-header-btn no-drag-area"
            status="danger"
            @click="isWebviewShow = false"
          >
            <icon-close :size="16" />
          </a-button>
        </div>
        <MyWebView :url="currentApp.url" :allowpopups="true" class="webview" />
      </div>
    </transition>
  </div>
</template>

<style lang="less" scoped>
.ai-app {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  .ai-app-header {
    flex-shrink: 0;
    height: 40px;
    border-bottom: 1px solid var(--color-border-1);
    box-sizing: border-box;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .ai-app-header-title {
      flex-grow: 1;
      font-size: 15px;
      font-weight: 500;
    }

    .ai-app-header-search {
      flex-shrink: 0;

      .search-input {
        border: none;
        background-color: var(--color-fill-2);
      }
    }
  }

  .ai-app-list-container {
    flex: 1;
    min-height: 0;
    display: flex;
    justify-content: center;

    .ai-app-list {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      box-sizing: border-box;
      padding: 15px 0;

      .ai-app-card {
        width: 280px;
      }
    }

    .ai-app-list-empty {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .ai-app-webview {
    position: absolute;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-1);

    .webview-header {
      flex-shrink: 0;
      height: 40px;
      border-bottom: 1px solid var(--color-border-1);
      box-sizing: border-box;
      padding: 15px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;

      .webview-header-title {
        margin-right: auto;
        font-weight: bold;
      }

      .webview-header-btn {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 30px;
        width: 30px;
        padding: 0;
        background-color: transparent;

        &:hover {
          background-color: var(--color-fill-2);
        }
      }
    }

    .webview {
      border: none;
      width: 100%;
      height: calc(100vh - 40px);
    }
  }
}
</style>
