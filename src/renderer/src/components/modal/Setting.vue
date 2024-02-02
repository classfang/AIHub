<script setup lang="ts">
import { useSettingStore } from '@renderer/store/setting'
import { computed, onMounted, reactive, toRefs, watch } from 'vue'
import { useSystemStore } from '@renderer/store/system'
import { useAssistantStore } from '@renderer/store/assistant'
import { useCollectionSetStore } from '@renderer/store/collection-set'
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'
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
  openDevTools,
  openLogDir
} from '@renderer/utils/ipc-util'
import { Message, Modal } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import chatModels from '@renderer/assets/json/chat-models.json'
import { useUserStore } from '@renderer/store/user'
import { exportTextFile } from '@renderer/utils/download-util'
import { formatDateTime } from '@renderer/utils/date-util'
import { useCalendarStore } from '@renderer/store/calendar'
import { useChatPluginStore } from '@renderer/store/chat-plugin'

const systemStore = useSystemStore()
const settingStore = useSettingStore()
const userStore = useUserStore()
const assistantStore = useAssistantStore()
const collectionSetStore = useCollectionSetStore()
const knowledgeBaseStore = useKnowledgeBaseStore()
const calendarStore = useCalendarStore()
const chatPluginStore = useChatPluginStore()
const { t } = useI18n()

const data = reactive({
  appVersion: '0.0.0',
  newVersionFlag: false,
  clearCacheFlag: false
})
const { appVersion, newVersionFlag, clearCacheFlag } = toRefs(data)

// 计算默认切换的tab
const settingDefaultActiveKey = computed(() => {
  return systemStore.settingModal.defaultActiveKey
    ? systemStore.settingModal.defaultActiveKey
    : data.newVersionFlag
      ? 'about'
      : 'app'
})

const checkNewVersion = () => {
  fetch('https://api.github.com/repos/classfang/AIHub/releases/latest')
    .then((res) => res.json())
    .then((json) => {
      if (json.name) {
        const appVersionArray = data.appVersion.split('.')
        const newVersionArray = json.name.split('.')
        for (let i = 0; i < newVersionArray.length; i++) {
          if (Number(newVersionArray[i]) > Number(appVersionArray[i])) {
            data.newVersionFlag = true
          } else if (Number(newVersionArray[i]) < Number(appVersionArray[i])) {
            data.newVersionFlag = false
            return
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
  Message.success(t('setting.app.backup.cache.clearSuccess'))
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
      knowledgeBaseStore: knowledgeBaseStore.getStoreJson,
      calendarStore: calendarStore.getStoreJson,
      chatPluginStore: chatPluginStore.getStoreJson,
      cacheFiles: await getCacheFiles()
    })
  )
  systemStore.globalLoading = false
}

const importSettingBackup = () => {
  Modal.confirm({
    title: t('setting.app.backup.setting.importConfirm'),
    content: t('setting.app.backup.setting.importConfirmContent'),
    okText: t('setting.app.backup.importOk'),
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
            Message.success(t('setting.app.backup.importSuccess'))
          } else {
            Message.error(t('setting.app.backup.importNone'))
          }
        }
      } catch (e) {
        Message.error(t('setting.app.backup.importError'))
      } finally {
        systemStore.globalLoading = false
      }
    }
  })
}

const importDataBackup = () => {
  Modal.confirm({
    title: t('setting.app.backup.data.importConfirm'),
    content: t('setting.app.backup.data.importConfirmContent'),
    okText: t('setting.app.backup.importOk'),
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
          importFlag =
            knowledgeBaseStore.setStoreFromJson(dataBackup.knowledgeBaseStore) || importFlag
          importFlag = calendarStore.setStoreFromJson(dataBackup.calendarStore) || importFlag
          importFlag = chatPluginStore.setStoreFromJson(dataBackup.chatPluginStore) || importFlag
          importFlag = (await addCacheFiles(dataBackup.cacheFiles)) || importFlag
          if (importFlag) {
            Message.success(t('setting.app.backup.importSuccess'))
          } else {
            Message.error(t('setting.app.backup.importNone'))
          }
        }
      } catch (e) {
        Message.error(t('setting.app.backup.importError'))
      } finally {
        systemStore.globalLoading = false
      }
    }
  })
}

watch(
  () => settingStore.aiCalendar.bigModel.provider,
  (value) => {
    settingStore.aiCalendar.bigModel.model = chatModels[value].filter(
      (m) => m.type === 'text'
    )[0].value
  }
)

onMounted(() => {
  getAppVersion().then((v) => {
    data.appVersion = v
    checkNewVersion()
  })
  // 每次获得焦点检查最新版本
  let lastCheckTime = 0
  onMainWindowFocus(() => {
    if (new Date().getTime() - lastCheckTime > 1000 * 60 * 60) {
      checkNewVersion()
      lastCheckTime = new Date().getTime()
    }
  })
  setProxy(settingStore.app.proxy)
})
</script>

<template>
  <div class="setting">
    <div @click="systemStore.openSettingModal()">
      <a-badge :count="newVersionFlag ? 1 : 0" dot :dot-style="{ width: '10px', height: '10px' }">
        <slot name="default"></slot>
      </a-badge>
    </div>

    <!-- 设置Modal -->
    <a-modal
      v-model:visible="systemStore.settingModal.visible"
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
                      <a-radio :value="0">{{ $t('setting.app.appearance.theme.auto') }}</a-radio>
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
                      <a-space :size="10">
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
                      <a-space :size="10">
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
                      <a-space :size="10">
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
                    <div>{{ $t('setting.bigModel.openAI.key') }}</div>
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
              <!-- Gemini -->
              <a-tab-pane key="gemini" :title="$t('setting.bigModel.gemini.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('common.officialWebsite') }}</div>
                    <a-link @click="openInBrowser('https://ai.google.dev/docs/gemini_api_overview')"
                      >https://ai.google.dev/docs/gemini_api_overview</a-link
                    >
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.bigModel.gemini.baseUrl') }}</div>
                    <a-input
                      v-model="settingStore.gemini.baseUrl"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.gemini.baseUrl')
                      "
                    />
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.bigModel.gemini.key') }}</div>
                    <a-input-password
                      v-model="settingStore.gemini.key"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.gemini.key')
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
              <!-- 天工 -->
              <a-tab-pane key="tiangong" :title="$t('setting.bigModel.tiangong.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                    <a-space direction="vertical" :size="10" fill>
                      <div>{{ $t('common.officialWebsite') }}</div>
                      <a-link @click="openInBrowser('https://model-platform.tiangong.cn')"
                        >https://model-platform.tiangong.cn</a-link
                      >
                    </a-space>
                    <a-space direction="vertical" :size="10" fill>
                      <div>{{ $t('setting.bigModel.tiangong.appKey') }}</div>
                      <a-input-password
                        v-model="settingStore.tiangong.appKey"
                        size="small"
                        :placeholder="
                          $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.tiangong.appKey')
                        "
                      />
                    </a-space>
                    <a-space direction="vertical" :size="10" fill>
                      <div>{{ $t('setting.bigModel.tiangong.appSecret') }}</div>
                      <a-input-password
                        v-model="settingStore.tiangong.appSecret"
                        size="small"
                        :placeholder="
                          $t('common.pleaseEnter') + ' ' + $t('setting.bigModel.tiangong.appSecret')
                        "
                      />
                    </a-space>
                  </a-space>
                </a-space>
              </a-tab-pane>
            </a-tabs>
          </a-tab-pane>
          <!-- AI日历 -->
          <a-tab-pane key="aiCalendar" :title="$t('setting.aiCalendar.name')">
            <a-space direction="vertical" :size="20" fill class="setting-tab-content">
              <a-space direction="vertical" :size="10" fill>
                <div>{{ $t('setting.aiCalendar.weekStart') }}</div>
                <a-select v-model="settingStore.aiCalendar.weekStart">
                  <a-option :value="0">{{ $t('setting.aiCalendar.sunday') }}</a-option>
                  <a-option :value="1">{{ $t('setting.aiCalendar.monday') }}</a-option>
                </a-select>
              </a-space>
              <a-space direction="vertical" :size="10" fill>
                <div>{{ $t('setting.aiCalendar.bigModel') }}</div>
                <a-select v-model="settingStore.aiCalendar.bigModel.provider">
                  <a-option v-for="p in Object.keys(chatModels)" :key="p" :value="p">{{
                    $t(`bigModelProvider.${p}`)
                  }}</a-option>
                </a-select>
                <a-select v-model="settingStore.aiCalendar.bigModel.model">
                  <template
                    v-for="m in chatModels[settingStore.aiCalendar.bigModel.provider]"
                    :key="m.name"
                  >
                    <a-option v-if="m['type'] === 'text'" :value="m.value">{{
                      m['name']
                    }}</a-option>
                  </template>
                </a-select>
              </a-space>
            </a-space>
          </a-tab-pane>
          <!-- 翻译 -->
          <a-tab-pane key="translation" :title="$t('setting.translation.name')">
            <a-tabs position="left">
              <!-- 有道翻译 -->
              <a-tab-pane key="youdao" :title="$t('setting.translation.youdao.name')">
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('common.officialWebsite') }}</div>
                    <a-link @click="openInBrowser('https://ai.youdao.com')"
                      >https://ai.youdao.com</a-link
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
              <!-- 百度翻译 -->
              <a-tab-pane
                key="baiduTranslation"
                :title="$t('setting.translation.baiduTranslation.name')"
              >
                <a-space direction="vertical" :size="20" fill class="setting-tab-content">
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('common.officialWebsite') }}</div>
                    <a-link @click="openInBrowser('https://fanyi-api.baidu.com')"
                      >https://fanyi-api.baidu.com</a-link
                    >
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.translation.baiduTranslation.appId') }}</div>
                    <a-input
                      v-model="settingStore.baiduTranslation.appId"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') +
                        ' ' +
                        $t('setting.translation.baiduTranslation.appId')
                      "
                    />
                  </a-space>
                  <a-space direction="vertical" :size="10" fill>
                    <div>{{ $t('setting.translation.baiduTranslation.secret') }}</div>
                    <a-input-password
                      v-model="settingStore.baiduTranslation.secret"
                      size="small"
                      :placeholder="
                        $t('common.pleaseEnter') +
                        ' ' +
                        $t('setting.translation.baiduTranslation.secret')
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
                  <a-space :size="10">
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
                  <a-space :size="10">
                    <a-button size="mini" @click="openDevTools()">
                      <span>{{ $t('setting.about.devTools.openDevTools') }}</span>
                    </a-button>
                    <a-button size="mini" @click="openLogDir()">
                      <span>{{ $t('setting.about.devTools.openLogPath') }}</span>
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
