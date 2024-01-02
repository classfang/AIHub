<script setup lang="ts">
import { startDarkThemeListener, changeTheme } from '@renderer/utils/theme-util'
import { useSystemStore } from '@renderer/store/system'
import { useSettingStore } from '@renderer/store/setting'
import { computed, onMounted, reactive, toRefs, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import UserAvatar from '@renderer/components/avatar/UserAvatar.vue'
import Setting from '@renderer/components/Setting.vue'
import Chat2Assistant from '@renderer/components/views/chat2assistant/Chat2Assistant.vue'
import CollectionSet from '@renderer/components/views/CollectionSet.vue'
import WebApp from '@renderer/components/views/WebApp.vue'
import Translator from '@renderer/components/views/Translator.vue'
import KnowledgeBase from '@renderer/components/views/knowledge-base/KnowledgeBase.vue'
import zhCN from '@arco-design/web-vue/es/locale/lang/zh-cn'
import enUS from '@arco-design/web-vue/es/locale/lang/en-us'
import { startDockAnimation, startDockBounce, stopDockAnimation } from '@renderer/utils/ipc-util'

const systemStore = useSystemStore()
const settingStore = useSettingStore()
const { locale } = useI18n()

const arcoDesignLocales = {
  zh_CN: zhCN,
  en_US: enUS
}

const data = reactive({
  isLoad: false,
  currentPage: 'chat'
})
const { isLoad, currentPage } = toRefs(data)

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
const changePage = (page: string) => {
  if (systemStore.chatWindowLoading) {
    return
  }
  data.currentPage = page
}

// 监听聊天框加载中状态
watchEffect(() => {
  if (
    systemStore.globalLoading ||
    systemStore.chatWindowLoading ||
    systemStore.knowledgeBaseWindowLoading
  ) {
    startDockAnimation()
  } else {
    stopDockAnimation()
    startDockBounce()
  }
})

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
          :class="{ 'app-sidebar-item-active': currentPage === 'chat' }"
          @click="changePage('chat')"
        />
        <icon-book
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': currentPage === 'knowledge-base' }"
          @click="changePage('knowledge-base')"
        />
        <icon-common
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': currentPage === 'collect' }"
          @click="changePage('collect')"
        />
        <icon-public
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': currentPage === 'web-app' }"
          @click="changePage('web-app')"
        />
        <icon-translate
          class="app-sidebar-item no-drag-area"
          :class="{ 'app-sidebar-item-active': currentPage === 'translator' }"
          @click="changePage('translator')"
        />
        <Setting style="margin-top: auto">
          <template #default>
            <icon-settings class="app-sidebar-item no-drag-area" />
          </template>
        </Setting>
      </div>

      <!-- 多页面 -->
      <div v-show="currentPage === 'chat'" class="app-body">
        <Chat2Assistant />
      </div>
      <div v-show="currentPage === 'knowledge-base'" class="app-body">
        <KnowledgeBase />
      </div>
      <div v-show="currentPage === 'collect'" class="app-body">
        <CollectionSet />
      </div>
      <div v-show="currentPage === 'web-app'" class="app-body">
        <WebApp />
      </div>
      <div v-show="currentPage === 'translator'" class="app-body">
        <Translator />
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
    gap: 25px;
    box-sizing: border-box;
    padding: 15px;
    background-color: var(--color-fill-2);

    .app-sidebar-avatar {
      margin: 45px 0 10px 0;
    }

    .app-sidebar-item {
      font-size: 30px;
      stroke-width: 2;
      color: var(--color-text-2);
      transition: all 200ms;

      &:hover {
        stroke-width: 3;
      }
    }

    .app-sidebar-item-active {
      stroke-width: 3;
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
