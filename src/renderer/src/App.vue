<script setup lang="ts">
import { startDarkThemeListener, changeTheme } from '@renderer/utils/theme-util'
import UserAvatar from '@renderer/components/avatar/UserAvatar.vue'
import Setting from '@renderer/components/Setting.vue'
import Chat2Assistant from '@renderer/components/views/chat2assistant/Chat2Assistant.vue'
import CollectionSet from '@renderer/components/views/CollectionSet.vue'
import WebApp from '@renderer/components/views/WebApp.vue'
import Translator from '@renderer/components/views/Translator.vue'
import { useSystemStore } from '@renderer/store/system'
import { useSettingStore } from '@renderer/store/setting'
import { onMounted, reactive, toRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const systemStore = useSystemStore()
const settingStore = useSettingStore()
const { locale } = useI18n()

const data = reactive({
  currentPage: 'chat'
})
const { currentPage } = toRefs(data)

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

// 页面切换
const changePage = (page: string) => {
  if (systemStore.chatWindowLoading) {
    return
  }
  data.currentPage = page
}

onMounted(() => {
  // 更新主题
  updateTheme()
  // 设置语言
  locale.value = settingStore.app.locale
})
</script>

<template>
  <div class="app">
    <!-- 侧边栏 -->
    <div class="app-sidebar drag-area">
      <UserAvatar class="no-drag-area" :editable="true" :size="36" />
      <icon-message
        class="app-sidebar-item no-drag-area"
        :class="{ 'app-sidebar-item-active': currentPage === 'chat' }"
        @click="changePage('chat')"
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
    <div v-if="systemStore.globalLoading" class="global-loading">
      <a-spin :size="26" />
    </div>
  </div>
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
    padding: 65px 0 15px 0;
    background-color: var(--color-fill-2);

    .app-sidebar-item {
      font-size: 30px;
      stroke-width: 2;
      color: var(--color-text-2);
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
