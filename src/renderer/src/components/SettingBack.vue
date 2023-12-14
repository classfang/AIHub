<script setup lang="ts">
import { useSettingStore } from '@renderer/store/setting'
import { onMounted, reactive, toRefs } from 'vue'
import { useSystemStore } from '@renderer/store/system'
import { openInBrowser } from '@renderer/utils/window-util'
import {
  openCacheDir,
  setProxy,
  getAppVersion,
  clearCacheFiles,
  selectFileAndRead,
  onMainWindowFocus,
  getCacheFiles,
  addCacheFiles,
  openDevTools
} from '@renderer/utils/ipc-util'
import { useAssistantStore } from '@renderer/store/assistant'
import { useCollectionSetStore } from '@renderer/store/collection-set'
import { Message, Modal } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@renderer/store/user'
import { exportTextFile } from '@renderer/utils/download-util'
import { formatDateTime } from '@renderer/utils/date-util'

const systemStore = useSystemStore()
const settingStore = useSettingStore()
const userStore = useUserStore()
const assistantStore = useAssistantStore()
const collectionSetStore = useCollectionSetStore()
const { t } = useI18n()

const data = reactive({
  modalVisible: false,
  appVersion: '0.0.0',
  newVersionFlag: false,
  clearCacheFlag: false
})
const { modalVisible, appVersion, newVersionFlag, clearCacheFlag } = toRefs(data)

const checkNewVersion = () => {
  fetch('https://api.github.com/repos/classfang/AIHub/releases/latest')
    .then((res) => res.json())
    .then((json) => {
      console.log('github app version', json.name)
      if (json.name) {
        const appVersionArray = data.appVersion.split('.')
        const newVersionArray = json.name.split('.')
        for (let i = 0; i < newVersionArray.length; i++) {
          if (newVersionArray[i] > appVersionArray[i]) {
            data.newVersionFlag = true
          }
        }
      }
    })
}

// 清理缓存（图片）
const clearCacheHandle = async () => {
  if (data.clearCacheFlag) {
    return
  }
  data.clearCacheFlag = true

  // 用户头像、所有对话记录图片、收藏中的图片
  const images: string[] = []
  if (userStore.avatar) {
    images.push(userStore.avatar)
  }
  assistantStore.assistantList.forEach((asst) =>
    asst.chatMessageList.forEach((msg) => {
      if (msg.image) {
        images.push(msg.image)
      }
    })
  )
  collectionSetStore.chatMessageSetList.forEach((set) =>
    set.chatMessageList.forEach((msg) => {
      if (msg.image) {
        images.push(msg.image)
      }
    })
  )
  await clearCacheFiles(images)
  data.clearCacheFlag = false
  Message.success(t('setting.app.cache.clearSuccess'))
}

const exportSettingBackup = () => {
  systemStore.globalLoading = true
  exportTextFile(
    `setting-${formatDateTime(new Date(), 'YYYYMMDDHHmmss')}.aihub`,
    settingStore.getStoreJson
  )
  systemStore.globalLoading = false
}

const exportDataBackup = async () => {
  systemStore.globalLoading = true
  exportTextFile(
    `data-${formatDateTime(new Date(), 'YYYYMMDDHHmmss')}.aihub`,
    JSON.stringify({
      userStore: userStore.getStoreJson,
      assistantStore: assistantStore.getStoreJson,
      collectionSetStore: collectionSetStore.getStoreJson,
      cacheFiles: await getCacheFiles()
    })
  )
  systemStore.globalLoading = false
}

const importSettingBackup = () => {
  Modal.confirm({
    title: t('setting.backup.setting.importConfirm'),
    content: t('setting.backup.setting.importConfirmContent'),
    okText: t('setting.backup.importOk'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      try {
        const selectFileResult = await selectFileAndRead(['aihub'])
        if (selectFileResult) {
          systemStore.globalLoading = true
          const importFlag = settingStore.setStoreFromJson(
            new TextDecoder().decode(selectFileResult)
          )
          if (importFlag) {
            Message.success(t('setting.backup.importSuccess'))
          } else {
            Message.error(t('setting.backup.importNone'))
          }
        }
      } catch (e) {
        Message.error(t('setting.backup.importError'))
      } finally {
        systemStore.globalLoading = false
      }
    }
  })
}

const importDataBackup = () => {
  Modal.confirm({
    title: t('setting.backup.data.importConfirm'),
    content: t('setting.backup.data.importConfirmContent'),
    okText: t('setting.backup.importOk'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      try {
        const selectFileResult = await selectFileAndRead(['aihub'])
        if (selectFileResult) {
          let importFlag = false
          systemStore.globalLoading = true
          const dataBackup = JSON.parse(new TextDecoder().decode(selectFileResult))
          importFlag = userStore.setStoreFromJson(dataBackup.userStore) || importFlag
          importFlag = assistantStore.setStoreFromJson(dataBackup.assistantStore) || importFlag
          importFlag =
            collectionSetStore.setStoreFromJson(dataBackup.collectionSetStore) || importFlag
          importFlag = (await addCacheFiles(dataBackup.cacheFiles)) || importFlag
          if (importFlag) {
            Message.success(t('setting.backup.importSuccess'))
          } else {
            Message.error(t('setting.backup.importNone'))
          }
        }
      } catch (e) {
        Message.error(t('setting.backup.importError'))
      } finally {
        systemStore.globalLoading = false
      }
    }
  })
}

onMounted(() => {
  getAppVersion().then((v) => {
    data.appVersion = v
    checkNewVersion()
  })
  // 每次获得焦点检查最新版本
  onMainWindowFocus(() => {
    checkNewVersion()
  })
  setProxy(settingStore.app.proxy)
})
</script>

<template>
  <div class="setting">
    <div @click="modalVisible = !systemStore.chatWindowLoading">
      <a-badge :count="newVersionFlag ? 1 : 0" dot :dot-style="{ width: '10px', height: '10px' }">
        <slot name="default"></slot>
      </a-badge>
    </div>

    <!-- 设置Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :footer="false"
      unmount-on-close
      title-align="start"
      width="80vw"
    >
      <template #title> {{ $t('setting.name') }} </template>
      <div class="setting-page">
        <a-tabs position="left">
          <a-tab-pane key="app" :title="$t('setting.app.name')">
            <a-tabs position="left">
              <a-tab-pane key="openAI" :title="$t('setting.openAI.name')">
                <a-space direction="vertical" :size="20" fill> </a-space>
              </a-tab-pane>
              <a-tab-pane key="spark" :title="$t('setting.spark.name')">
                <a-space direction="vertical" :size="20" fill> </a-space>
              </a-tab-pane>
              <a-tab-pane key="ernieBot" :title="$t('setting.ernieBot.name')">
                <a-space direction="vertical" :size="20" fill> </a-space>
              </a-tab-pane>
              <a-tab-pane key="tongyi" :title="$t('setting.tongyi.name')"> </a-tab-pane>
              <a-tab-pane key="youdao" :title="$t('setting.youdao.name')">
                <a-space direction="vertical" :size="20" fill> </a-space>
              </a-tab-pane>
            </a-tabs>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-modal>
  </div>
</template>

<style lang="less" scoped>
.setting-page {
  height: 60vh;
  overflow-y: auto;
}
</style>
