<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, toRefs } from 'vue'
import { openInBrowser } from '@renderer/utils/window-util'
import MyWebView from '@renderer/components/views/mini-program/MyWebView.vue'
import { useSettingStore } from '@renderer/store/setting'
import { useSystemStore } from '@renderer/store/system'
import axios from 'axios'

// store
const systemStore = useSystemStore()
const settingStore = useSettingStore()

// ref
const miniProgramRef = ref()

// 数据绑定
const data = reactive({
  miniProgramList: [] as MiniProgram[],
  miniProgramListStyle: {
    width: 0,
    cardWidth: 280,
    gap: 15
  },
  keyword: '',
  currentApp: {} as MiniProgram,
  isWebviewShow: false
})
const { miniProgramListStyle, keyword, currentApp, isWebviewShow } = toRefs(data)

// appList 过滤
const appListFilter = computed(() => {
  return data.miniProgramList.filter((app) =>
    app.name[settingStore.app.locale].toLowerCase().includes(data.keyword.toLowerCase())
  )
})

// 打开应用
const openApp = (app: MiniProgram) => {
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
      // 判断是 miniProgramRef
      if (entry.target === miniProgramRef.value) {
        // 获取新尺寸
        const newWidth = entry.contentRect.width
        // 计算列表样式
        data.miniProgramListStyle.width =
          newWidth -
          (newWidth % (data.miniProgramListStyle.cardWidth + data.miniProgramListStyle.gap)) -
          data.miniProgramListStyle.gap
      }
    }
  })
  resizeObserver.observe(miniProgramRef.value)
}

// 请求小程序列表
const fetchMiniProgramList = () => {
  axios
    .get(
      'https://api.github.com/repos/classfang/AIHub/contents//src/renderer/src/assets/json/mini-program.json',
      {
        headers: {
          Accept: 'application/vnd.github.v3.raw'
        }
      }
    )
    .then((resp) => {
      data.miniProgramList = resp.data as MiniProgram[]
    })
}

// 挂载完毕
onMounted(() => {
  // 监听组件尺寸
  watchAIAppSize()
  // 定时请求小程序列表
  fetchMiniProgramList()
  setInterval(
    () => {
      if (!systemStore.isThisPage('ai-app')) {
        fetchMiniProgramList()
      }
    },
    1000 * 60 * 10
  )
})
</script>

<template>
  <div ref="miniProgramRef" class="mini-program">
    <!-- 头部 -->
    <div class="mini-program-header drag-area">
      <div class="mini-program-header-title">{{ $t('miniProgram.name') }}</div>
      <div class="mini-program-header-search">
        <a-input-search
          v-model="keyword"
          size="small"
          :placeholder="$t('miniProgram.search')"
          class="search-input no-drag-area"
        />
      </div>
    </div>
    <!-- 列表 -->
    <a-scrollbar
      outer-class="mini-program-list-container arco-scrollbar-small"
      style="height: calc(100vh - 40px); overflow-y: auto"
    >
      <div
        v-if="appListFilter.length > 0"
        class="mini-program-list"
        :style="{ width: `${miniProgramListStyle.width}px` }"
      >
        <div v-for="a in appListFilter" :key="a.url" class="mini-program-card" @click="openApp(a)">
          <a-card :title="a.name[settingStore.app.locale]" hoverable>
            <template #extra>
              <icon-right />
            </template>
            {{ a.desc[settingStore.app.locale] }}
          </a-card>
        </div>
      </div>
      <div v-else class="mini-program-list-empty">
        <a-empty>
          <template #image>
            <icon-apps />
          </template>
          {{ $t('miniProgram.empty') }}
        </a-empty>
      </div>
    </a-scrollbar>
    <!-- webview窗口 -->
    <transition name="slide2top">
      <div v-if="isWebviewShow" class="mini-program-webview">
        <div class="webview-header">
          <div class="webview-header-title">
            {{ $t(`miniProgram.programs.${currentApp.name}.name`) }}
          </div>
          <a-button class="webview-header-btn no-drag-area" @click="webviewReload">
            <icon-refresh :size="16" />
          </a-button>
          <a-button class="webview-header-btn no-drag-area" @click="openInBrowser(currentApp.url)">
            <icon-launch :size="16" />
          </a-button>
          <a-button class="webview-header-btn no-drag-area" @click="isWebviewShow = false">
            <icon-close :size="16" />
          </a-button>
        </div>
        <MyWebView :url="currentApp.url" :allowpopups="true" class="webview" />
      </div>
    </transition>
  </div>
</template>

<style lang="less" scoped>
.mini-program {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  .mini-program-header {
    flex-shrink: 0;
    height: 40px;
    border-bottom: 1px solid var(--color-border-1);
    box-sizing: border-box;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .mini-program-header-title {
      flex-grow: 1;
      font-size: 15px;
      font-weight: 500;
    }

    .mini-program-header-search {
      flex-shrink: 0;

      .search-input {
        border: none;
        background-color: var(--color-fill-2);
      }
    }
  }

  .mini-program-list-container {
    flex: 1;
    min-height: 0;
    display: flex;
    justify-content: center;

    .mini-program-list {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      box-sizing: border-box;
      padding: 15px 0;

      .mini-program-card {
        width: 280px;

        :deep(.arco-card-header-extra) {
          color: var(--color-text-2);
        }
      }
    }

    .mini-program-list-empty {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .mini-program-webview {
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
