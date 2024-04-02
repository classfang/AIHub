<script setup lang="ts">
import enUS from '@arco-design/web-vue/es/locale/lang/en-us'
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
import UserAvatar from '@renderer/components/avatar/UserAvatar.vue'
import Notification from '@renderer/components/modal/Notification.vue'
import Setting from '@renderer/components/modal/Setting.vue'
import AICalendar from '@renderer/components/views/ai-calendar/AICalendar.vue'
import AIDrawing from '@renderer/components/views/ai-drawing/AIDrawing.vue'
import Chat2Assistant from '@renderer/components/views/chat2assistant/Chat2Assistant.vue'
import ChatPlugin from '@renderer/components/views/chat-plugin/ChatPlugin.vue'
import CollectionSet from '@renderer/components/views/collection-set/CollectionSet.vue'
import KnowledgeBase from '@renderer/components/views/knowledge-base/KnowledgeBase.vue'
import AIApp from '@renderer/components/views/mini-program/MiniProgram.vue'
import Translator from '@renderer/components/views/translator/Translator.vue'
import { useSettingStore } from '@renderer/store/setting'
import { useSystemStore } from '@renderer/store/system'
import {
  getPlatform,
  startDockAnimation,
  startDockBounce,
  stopDockAnimation
} from '@renderer/utils/ipc-util'
import { startDarkThemeListener, changeTheme } from '@renderer/utils/theme-util'
import { computed, onMounted, reactive, toRefs, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

const systemStore = useSystemStore()
const settingStore = useSettingStore()
const { locale } = useI18n()

const arcoDesignLocales = {
  zh_CN: zhCN,
  en_US: enUS
}

const data = reactive({
  isLoad: false,
  sidebarConfig: [
    {
      name: 'chat',
      icon: 'IconMessage'
    },
    {
      name: 'chat-plugin',
      icon: 'IconExperiment'
    },
    {
      name: 'ai-drawing',
      icon: 'IconPalette'
    },
    {
      name: 'knowledge-base',
      icon: 'IconBook'
    },
    {
      name: 'calendar',
      icon: 'IconCalendar'
    },
    {
      name: 'translator',
      icon: 'IconTranslate'
    },
    {
      name: 'collect',
      icon: 'IconCommon'
    },
    {
      name: 'ai-app',
      icon: 'IconApps'
    }
  ] as { name: PageName; icon: string }[]
})
const { isLoad, sidebarConfig } = toRefs(data)

// 主题设置监听
let stopDarkThemeListener: any = null
watch(
  () => settingStore.app.themeModel,
  () => {
    updateTheme()
  }
)
const updateTheme = () => {
  if (stopDarkThemeListener) {
    stopDarkThemeListener()
  }
  if (settingStore.app.themeModel === 0) {
    stopDarkThemeListener = startDarkThemeListener()
  } else {
    changeTheme(settingStore.app.themeModel === 2)
  }
}

// 语言设置监听
watch(
  () => settingStore.app.locale,
  (lang) => {
    locale.value = lang
  }
)

// ArcoDesign 语言
const arcoDesignLocal = computed(() => {
  return arcoDesignLocales[settingStore.app.locale]
})

// 页面切换
const changePage = (page: PageName) => {
  if (systemStore.chatWindowLoading) {
    return
  }
  systemStore.currentPage = page
}

// 监听各类加载状态
const watchLoading = () => {
  // 监听聊天框加载中状态
  watchEffect(() => {
    if (
      systemStore.globalLoading ||
      systemStore.chatWindowLoading ||
      systemStore.aiDrawingLoading ||
      systemStore.knowledgeBaseWindowLoading ||
      systemStore.aiCalendarLoading
    ) {
      startDockAnimation()
    } else {
      stopDockAnimation()
      startDockBounce()
    }
  })
}

onMounted(() => {
  // 更新主题
  updateTheme()
  // 设置语言
  locale.value = settingStore.app.locale
  // 刷新 dayKey，用于更具日期自动刷新组件
  systemStore.startDayKeyInterval()
  // 显示主界面，防止夜间主题从白色闪烁到黑色
  setTimeout(() => {
    data.isLoad = true
    watchLoading()
  }, 0)
})
</script>

<template>
  <a-config-provider :locale="arcoDesignLocal">
    <div class="app fade-in-from" :class="{ 'fade-in-to': isLoad }">
      <!-- 侧边栏 -->
      <div class="app-sidebar drag-area">
        <div :class="{ 'app-sidebar-avatar-macos': getPlatform().isMacOS }">
          <UserAvatar :editable="true" :size="36" />
        </div>
        <div
          v-for="c in sidebarConfig"
          :key="c.name"
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': systemStore.isThisPage(c.name) }"
          @click="changePage(c.name)"
        >
          <component :is="c.icon" class="app-sidebar-item-icon" />
        </div>
        <Notification style="margin-top: auto">
          <template #default>
            <div class="app-sidebar-item no-drag-area">
              <icon-notification class="app-sidebar-item-icon" />
            </div>
          </template>
        </Notification>
        <Setting>
          <template #default>
            <div class="app-sidebar-item no-drag-area">
              <icon-settings class="app-sidebar-item-icon" />
            </div>
          </template>
        </Setting>
      </div>

      <!-- 多页面 -->
      <div v-show="systemStore.isThisPage('chat')" class="app-body">
        <Chat2Assistant />
      </div>
      <div v-show="systemStore.isThisPage('chat-plugin')" class="app-body">
        <ChatPlugin />
      </div>
      <div v-show="systemStore.isThisPage('ai-drawing')" class="app-body">
        <AIDrawing />
      </div>
      <div v-show="systemStore.isThisPage('knowledge-base')" class="app-body">
        <KnowledgeBase />
      </div>
      <div v-show="systemStore.isThisPage('calendar')" class="app-body">
        <AICalendar />
      </div>
      <div v-show="systemStore.isThisPage('translator')" class="app-body">
        <Translator />
      </div>
      <div v-show="systemStore.isThisPage('collect')" class="app-body">
        <CollectionSet />
      </div>
      <div v-show="systemStore.isThisPage('ai-app')" class="app-body">
        <AIApp />
      </div>

      <!-- 全局加载遮罩 -->
      <div v-if="systemStore.globalLoading" class="global-loading z-index-max">
        <a-spin :size="26" />
      </div>
    </div>
  </a-config-provider>
</template>

<style lang="less">
@import './assets/css/styles.less';
.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  background-color: var(--color-bg-1);
  color: var(--color-text-1);

  .app-sidebar {
    flex-shrink: 0;
    width: 65px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    background-color: var(--color-fill-2);

    .app-sidebar-avatar-macos {
      margin: 30px 0 15px 0;
    }

    .app-sidebar-item {
      padding: 15px 0;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      .app-sidebar-item-icon {
        font-size: 26px;
        stroke-width: 3;
        color: var(--color-text-2);
        transition: all 200ms;
      }

      &:hover {
        .app-sidebar-item-icon {
          stroke-width: 4;
        }
      }
    }

    .app-sidebar-item-active {
      position: relative;

      .app-sidebar-item-icon {
        stroke-width: 4;
        color: rgb(var(--primary-6));
      }

      &:after {
        display: inline-block;
        content: '';
        height: 26px;
        width: 10px;
        background-color: rgb(var(--primary-5));
        position: absolute;
        top: 13px;
        left: -5px;
        border-radius: 0 5px 5px 0;
      }
    }
  }

  .app-body {
    flex-grow: 1;
    display: flex;
    overflow: hidden;
  }

  .global-loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.3);
  }
}
</style>
