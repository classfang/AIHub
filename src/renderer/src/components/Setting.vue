<script setup lang="ts">
import { useSettingStore } from '@renderer/store/setting'
import { computed, onMounted, reactive, toRefs } from 'vue'
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

// 计算默认切换的tab
const settingDefaultActiveKey = computed(() => {
  return data.newVersionFlag ? 'about' : 'app'
})

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
      <!-- 设置页 -->
      <div class="setting-page">
        <a-tabs position="left" :default-active-key="settingDefaultActiveKey">
          <!-- 应用 -->
          <a-tab-pane key="app" :title="$t('setting.app.name')">
            <a-tabs position="left">
              <!-- 外观 -->
              <a-tab-pane key="appearance" :title="$t('setting.app.appearance.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="10">
                    <div>{{ $t('setting.app.appearance.theme.name') }}</div>
                    <a-radio-group v-model="settingStore.app.themeModel" type="button" size="small">
                      <a-radio :value="0">{{ $t('setting.app.appearance.theme.system') }}</a-radio>
                      <a-radio :value="1">{{ $t('setting.app.appearance.theme.light') }}</a-radio>
                      <a-radio :value="2">{{ $t('setting.app.appearance.theme.dark') }}</a-radio>
                    </a-radio-group>
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.app.appearance.local') }}</div>
                    <a-select v-model="settingStore.app.locale" size="small">
                      <a-option value="zh_CN">中文</a-option>
                      <a-option value="en_US">English</a-option>
                    </a-select>
                  </a-space>
                </a-space>
              </a-tab-pane>
              <!-- 网络 -->
              <a-tab-pane key="network" :title="$t('setting.app.network.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.app.network.proxy') }}</div>
                    <a-input
                      v-model="settingStore.app.proxy"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.app.network.proxy')
                      "
                      @change="setProxy(settingStore.app.proxy)"
                    />
                  </a-space>
                </a-space>
              </a-tab-pane>
              <!-- 备份 -->
              <a-tab-pane key="backup" :title="$t('setting.app.backup.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="10">
                    <div>{{ $t('setting.app.backup.setting.name') }}</div>
                    <div>
                      <a-space :size="20">
                        <a-button size="mini" @click="exportSettingBackup()">
                          <a-space :size="5">
                            <icon-download />
                            <span>{{ $t('setting.app.backup.setting.export') }}</span>
                          </a-space>
                        </a-button>
                        <a-button size="mini" @click="importSettingBackup()">
                          <a-space :size="5">
                            <icon-upload />
                            <span>{{ $t('setting.app.backup.setting.import') }}</span>
                          </a-space>
                        </a-button>
                      </a-space>
                    </div>
                  </a-space>
                  <a-space direction="vertical" :size="10">
                    <div>{{ $t('setting.app.backup.data.name') }}</div>
                    <div>
                      <a-space :size="20">
                        <a-button size="mini" @click="exportDataBackup()">
                          <a-space :size="5">
                            <icon-download />
                            <span>{{ $t('setting.app.backup.data.export') }}</span>
                          </a-space>
                        </a-button>
                        <a-button size="mini" @click="importDataBackup()">
                          <a-space :size="5">
                            <icon-upload />
                            <span>{{ $t('setting.app.backup.data.import') }}</span>
                          </a-space>
                        </a-button>
                      </a-space>
                    </div>
                  </a-space>
                  <!-- 缓存 -->
                  <a-space direction="vertical" :size="10">
                    <div>{{ $t('setting.app.backup.cache.name') }}</div>
                    <div>
                      <a-space :size="20">
                        <a-button size="mini" @click="openCacheDir()">
                          <a-space :size="5">
                            <icon-folder />
                            <span>{{ $t('setting.app.backup.cache.path') }}</span>
                          </a-space>
                        </a-button>
                        <a-button size="mini" :loading="clearCacheFlag" @click="clearCacheHandle()">
                          <a-space :size="5">
                            <icon-delete />
                            <span>{{ $t('setting.app.backup.cache.clear') }}</span>
                          </a-space>
                        </a-button>
                      </a-space>
                    </div>
                  </a-space>
                </a-space>
              </a-tab-pane>
            </a-tabs>
          </a-tab-pane>
          <!-- 大模型 -->
          <a-tab-pane key="bigModel" :title="$t('setting.bigModel.name')">
            <a-tabs position="left">
              <!-- OpenAI -->
              <a-tab-pane key="openAI" :title="$t('setting.bigModel.openAI.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('common.officialWebsite') }}</div>
                    <a-link @click="openInBrowser('https://openai.com')">https://openai.com</a-link>
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.bigModel.openAI.baseUrl') }}</div>
                    <a-input
                      v-model="settingStore.openAI.baseUrl"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.openAI.baseUrl')
                      "
                    />
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.openAI.key') }}</div>
                    <a-input-password
                      v-model="settingStore.openAI.key"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.openAI.key')
                      "
                    />
                  </a-space>
                </a-space>
              </a-tab-pane>
              <!-- 讯飞星火 -->
              <a-tab-pane key="spark" :title="$t('setting.bigModel.spark.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('common.officialWebsite') }}</div>
                    <a-link @click="openInBrowser('https://xinghuo.xfyun.cn')"
                      >https://xinghuo.xfyun.cn</a-link
                    >
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.bigModel.spark.appId') }}</div>
                    <a-input
                      v-model="settingStore.spark.appId"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.spark.appId')
                      "
                    />
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.bigModel.spark.secret') }}</div>
                    <a-input-password
                      v-model="settingStore.spark.secret"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.spark.secret')
                      "
                    />
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.bigModel.spark.key') }}</div>
                    <a-input-password
                      v-model="settingStore.spark.key"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.spark.key')
                      "
                    />
                  </a-space>
                </a-space>
              </a-tab-pane>
              <!-- 文心一言 -->
              <a-tab-pane key="ernieBot" :title="$t('setting.bigModel.ernieBot.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('common.officialWebsite') }}</div>
                    <a-link @click="openInBrowser('https://yiyan.baidu.com')"
                      >https://yiyan.baidu.com</a-link
                    >
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.bigModel.ernieBot.apiKey') }}</div>
                    <a-input-password
                      v-model="settingStore.ernieBot.apiKey"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.ernieBot.apiKey')
                      "
                    />
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.bigModel.ernieBot.secretKey') }}</div>
                    <a-input-password
                      v-model="settingStore.ernieBot.secretKey"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.ernieBot.secretKey')
                      "
                    />
                  </a-space>
                </a-space>
              </a-tab-pane>
              <!-- 通义千问 -->
              <a-tab-pane key="tongyi" :title="$t('setting.bigModel.tongyi.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                    <a-space direction="vertical" :size="10" fill>
                      <div>{{ $t('common.officialWebsite') }}</div>
                      <a-link @click="openInBrowser('https://tongyi.aliyun.com')"
                        >https://tongyi.aliyun.com</a-link
                      >
                    </a-space>
                    <a-space direction="vertical" :size="10" fill>
                      <div>{{ $t('setting.bigModel.tongyi.apiKey') }}</div>
                      <a-input-password
                        v-model="settingStore.tongyi.apiKey"
                        size="small"
                        :placeholder="
                          $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.tongyi.apiKey')
                        "
                      />
                    </a-space>
                  </a-space>
                </a-space>
              </a-tab-pane>
            </a-tabs>
          </a-tab-pane>
          <!-- 翻译 -->
          <a-tab-pane key="translation" :title="$t('setting.translation.name')">
            <a-tabs position="left">
              <!-- 有道翻译 -->
              <a-tab-pane key="youdao" :title="$t('setting.translation.youdao.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('common.officialWebsite') }}</div>
                    <a-link @click="openInBrowser('https://ai.youdao.com/')"
                      >https://ai.youdao.com/</a-link
                    >
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.translation.youdao.appId') }}</div>
                    <a-input
                      v-model="settingStore.youdao.appId"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.translation.youdao.appId')
                      "
                    />
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.translation.youdao.secret') }}</div>
                    <a-input-password
                      v-model="settingStore.youdao.secret"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.translation.youdao.secret')
                      "
                    />
                  </a-space>
                </a-space>
              </a-tab-pane>
            </a-tabs>
          </a-tab-pane>
          <!-- 关于 -->
          <a-tab-pane key="about" :title="$t('setting.about.name')">
            <a-space direction="vertical" :size="20" fill class="setting-tab-content">
              <a-space direction="vertical" :size="10">
                <div>{{ $t('setting.about.version.name') }}</div>
                <div>
                  <a-space :size="20">
                    <div>{{ $t('setting.about.version.current') }} v{{ appVersion }}</div>
                    <a-badge
                      :count="newVersionFlag ? 1 : 0"
                      dot
                      :dot-style="{ width: '10px', height: '10px' }"
                    >
                      <a-button
                        size="mini"
                        @click="openInBrowser('https://github.com/classfang/AIHub/releases')"
                      >
                        <a-space :size="5">
                          <icon-download />
                          <span>{{ $t('setting.about.version.download') }}</span>
                        </a-space>
                      </a-button>
                    </a-badge>
                  </a-space>
                </div>
              </a-space>
              <a-space direction="vertical" :size="10" fill>
                <div>{{ $t('setting.about.sourceCode') }}</div>
                <a-link @click="openInBrowser('https://github.com/classfang/AIHub')"
                  >https://github.com/classfang/AIHub</a-link
                >
              </a-space>
              <a-space direction="vertical" :size="10" fill>
                <div>{{ $t('setting.about.contactAuthor') }}</div>
                <a-link href="mailto:fangjunjievip@hotmail.com">fangjunjievip@hotmail.com</a-link>
              </a-space>
              <a-space direction="vertical" :size="10">
                <div>{{ $t('setting.about.devTools.name') }}</div>
                <div>
                  <a-space :size="20">
                    <a-button size="mini" @click="openDevTools()">
                      <a-space :size="5">
                        <span>{{ $t('setting.about.devTools.openDevTools') }}</span>
                      </a-space>
                    </a-button>
                  </a-space>
                </div>
              </a-space>
            </a-space>
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

  :deep(.arco-tabs) {
    height: 100%;

    .arco-tabs-content-list {
      height: 100%;

      .arco-tabs-pane {
        height: 100%;

        .setting-tab-content {
          height: 100%;
          overflow-y: auto;
        }
      }
    }
  }
}
</style>
