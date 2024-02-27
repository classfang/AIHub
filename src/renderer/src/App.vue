<script setup lang="ts">
import enUS from '@arco-design/web-vue/es/locale/lang/en-us'
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
import UserAvatar from '@renderer/components/avatar/UserAvatar.vue'
import Notification from '@renderer/components/modal/Notification.vue'
import Setting from '@renderer/components/modal/Setting.vue'
import AICalendar from '@renderer/components/views/AICalendar.vue'
import CollectionSet from '@renderer/components/views/CollectionSet.vue'
import Translator from '@renderer/components/views/Translator.vue'
import Chat2Assistant from '@renderer/components/views/chat2assistant/Chat2Assistant.vue'
import ChatPlugin from '@renderer/components/views/chat-plugin/ChatPlugin.vue'
import KnowledgeBase from '@renderer/components/views/knowledge-base/KnowledgeBase.vue'
import AIApp from '@renderer/components/views/mini-program/MiniProgram.vue'
import { useSettingStore } from '@renderer/store/setting'
import { useSystemStore } from '@renderer/store/system'
import { startDockAnimation, startDockBounce, stopDockAnimation } from '@renderer/utils/ipc-util'
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
  isLoad: false
})
const { isLoad } = toRefs(data)

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
  }, 1000)
})
</script>

<template>
  <a-config-provider :locale="arcoDesignLocal">
    <div class="app fade-in-from" :class="{ 'fade-in-to': isLoad }">
      <!-- 侧边栏 -->
      <div class="app-sidebar drag-area">
        <div class="app-sidebar-avatar">
          <UserAvatar :editable="true" :size="36" />
        </div>
        <icon-message
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': systemStore.isThisPage('chat') }"
          @click="changePage('chat')"
        />
        <icon-code
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': systemStore.isThisPage('chat-plugin') }"
          @click="changePage('chat-plugin')"
        />
        <icon-book
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': systemStore.isThisPage('knowledge-base') }"
          @click="changePage('knowledge-base')"
        />
        <icon-calendar
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': systemStore.isThisPage('calendar') }"
          @click="changePage('calendar')"
        />
        <icon-translate
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': systemStore.isThisPage('translator') }"
          @click="changePage('translator')"
        />
        <icon-common
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': systemStore.isThisPage('collect') }"
          @click="changePage('collect')"
        />
        <icon-apps
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': systemStore.isThisPage('ai-app') }"
          @click="changePage('ai-app')"
        />
        <Notification style="margin-top: auto">
          <template #default>
            <icon-notification class="app-sidebar-item no-drag-area" />
          </template>
        </Notification>
        <Setting>
          <template #default>
            <icon-settings class="app-sidebar-item no-drag-area" />
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
    gap: 30px;
    box-sizing: border-box;
    padding: 15px;
    background-color: var(--color-fill-2);

    .app-sidebar-avatar {
      margin-top: 30px;
    }

    .app-sidebar-item {
      font-size: 26px;
      stroke-width: 3;
      color: var(--color-text-2);
      transition: all 200ms;

      &:hover {
        stroke-width: 4;
      }
    }

    .app-sidebar-item-active {
      stroke-width: 4;
      color: rgb(var(--primary-6));
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
