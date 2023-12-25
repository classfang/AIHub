<script setup lang="ts">
import { reactive, toRefs, watch } from 'vue'
import { useKnowledgeBaseStore } from '@renderer/store/knowledge-base'
import KnowledgeBaseWindowHeader from '@renderer/components/views/knowledge-base/knowledge-base-window/KnowledgeBaseWindowHeader.vue'
import { useSystemStore } from '@renderer/store/system'
import { Message, Modal } from '@arco-design/web-vue'
import { useI18n } from 'vue-i18n'
import { exportTextFile } from '@renderer/utils/download-util'
import {
  langChainRedisAddFile,
  langChainRedisDeleteFile,
  langChainRedisListFile,
  langChainRedisQuestion
} from '@renderer/utils/ipc-util'
import { useSettingStore } from '@renderer/store/setting'
import dayjs from 'dayjs'

// store
const systemStore = useSystemStore()
const knowledgeBaseStore = useKnowledgeBaseStore()
const settingStore = useSettingStore()

// i18n
const { t } = useI18n()

// 数据绑定
const data = reactive({
  question: '',
  currentQuestion: '',
  answer: '',
  fileList: [] as KnowledgeFile[],
  fileKeyword: '',
  docCount: 0,
  newFileVisible: false,
  newFileForm: {
    text: ''
  },
  fileDetailVisible: false,
  fileDetail: {} as KnowledgeFile
})
const {
  question,
  currentQuestion,
  answer,
  fileList,
  fileKeyword,
  docCount,
  newFileVisible,
  newFileForm,
  fileDetailVisible,
  fileDetail
} = toRefs(data)

// 监听当前知识库
watch(
  () => knowledgeBaseStore.getCurrentKnowledgeBase,
  () => {
    fetchFileList()
  },
  { deep: true }
)

// 提问
const sendQuestion = () => {
  if (systemStore.knowledgeBaseWindowLoading) {
    return
  }
  data.currentQuestion = data.question.trim()
  data.question = ''
  if (data.currentQuestion.length === 0) {
    return
  }
  if (data.fileList.length === 0) {
    Message.error(t('knowledgeBase.window.empty'))
    return
  }

  if (!settingStore.openAI.baseUrl || !settingStore.openAI.key) {
    Message.error(t(`chatWindow.configMiss.OpenAI`))
    return
  }

  systemStore.knowledgeBaseWindowLoading = true
  langChainRedisQuestion(
    knowledgeBaseStore.getCurrentKnowledgeBase.redisConfig,
    settingStore.openAI,
    knowledgeBaseStore.getCurrentKnowledgeBase.indexName,
    data.currentQuestion
  )
    .then((res) => {
      data.answer = res?.text
    })
    .catch((err: Error) => {
      Message.error(err.message)
    })
    .finally(() => {
      systemStore.knowledgeBaseWindowLoading = false
    })
}

// 返回文件列表
const backFileList = () => {
  if (systemStore.knowledgeBaseWindowLoading) {
    return
  }
  data.answer = ''
  data.currentQuestion = ''
}

// 新增文件
const newFile = () => {
  if (systemStore.knowledgeBaseWindowLoading) {
    return
  }
  data.newFileVisible = true
}

// 新增文件表单提交
const handleNewFileModalBeforeOk = async () => {
  await new Promise<void>((resolve, reject) => {
    if (data.newFileForm.text.trim().length === 0) {
      Message.error(`${t('knowledgeBase.window.newFileText')} ${t('common.required')}`)
      reject()
      return
    }

    if (!settingStore.openAI.baseUrl || !settingStore.openAI.key) {
      Message.error(t(`chatWindow.configMiss.OpenAI`))
      reject()
      return
    }

    systemStore.knowledgeBaseWindowLoading = true
    langChainRedisAddFile(
      knowledgeBaseStore.getCurrentKnowledgeBase.redisConfig,
      settingStore.openAI,
      knowledgeBaseStore.getCurrentKnowledgeBase.indexName,
      data.newFileForm.text
    )
      .then(() => {
        fetchFileList()
        resolve()
      })
      .catch((err: Error) => {
        Message.error(err.message)
        systemStore.knowledgeBaseWindowLoading = false
        reject()
      })
  })
  return true
}

// 新增文件表单清空
const clearNewFileModal = () => {
  data.newFileForm.text = ''
}

// 更新文件
const updateFile = () => {
  systemStore.knowledgeBaseWindowLoading = true
  // 先删除
  langChainRedisDeleteFile(
    knowledgeBaseStore.getCurrentKnowledgeBase.redisConfig,
    knowledgeBaseStore.getCurrentKnowledgeBase.indexName,
    data.fileDetail.key
  )
    .then(() => {
      // 再指定key新增
      langChainRedisAddFile(
        knowledgeBaseStore.getCurrentKnowledgeBase.redisConfig,
        settingStore.openAI,
        knowledgeBaseStore.getCurrentKnowledgeBase.indexName,
        data.fileDetail.text
      )
        .then(() => {
          fetchFileList()
          data.fileDetailVisible = false
        })
        .catch((err: Error) => {
          Message.error(err.message)
          systemStore.knowledgeBaseWindowLoading = false
        })
    })
    .catch((err: Error) => {
      Message.error(err.message)
      systemStore.knowledgeBaseWindowLoading = false
    })
}

// 打开文件详情
const openFileDetail = (file: KnowledgeFile) => {
  data.fileDetailVisible = true
  data.fileDetail = file
}

// 查询文件列表
const fetchFileList = () => {
  data.fileList = []
  systemStore.knowledgeBaseWindowLoading = true
  langChainRedisListFile(
    knowledgeBaseStore.getCurrentKnowledgeBase.redisConfig,
    knowledgeBaseStore.getCurrentKnowledgeBase.indexName
  )
    .then((res) => {
      data.fileList = res.files
      data.docCount = res.docCount
    })
    .catch((err: Error) => {
      Message.error(err.message)
    })
    .finally(() => {
      systemStore.knowledgeBaseWindowLoading = false
    })
}

// 删除文件
const deleteFile = (file: KnowledgeFile) => {
  Modal.confirm({
    title: t('common.deleteConfirm'),
    content: t('common.deleteConfirmContent'),
    okText: t('common.ok'),
    cancelText: t('common.cancel'),
    onOk: () => {
      data.fileDetailVisible = false
      systemStore.knowledgeBaseWindowLoading = true
      langChainRedisDeleteFile(
        knowledgeBaseStore.getCurrentKnowledgeBase.redisConfig,
        knowledgeBaseStore.getCurrentKnowledgeBase.indexName,
        file.key
      )
        .then(() => {
          fetchFileList()
        })
        .catch((err: Error) => {
          Message.error(err.message)
          systemStore.knowledgeBaseWindowLoading = false
        })
    }
  })
}

// 暴露方法
defineExpose({
  fetchFileList
})
</script>

<template>
  <div class="knowledge-base-window">
    <!-- 头部 -->
    <KnowledgeBaseWindowHeader :file-count="fileList.length" :doc-count="docCount" />
    <div class="knowledge-base-body">
      <!-- 文件列表 -->
      <template v-if="!currentQuestion">
        <div class="knowledge-base-file-search">
          <a-input-search
            v-model="fileKeyword"
            size="small"
            :placeholder="$t('knowledgeBase.window.searchFile')"
            class="search-input no-drag-area"
          />
          <a-button size="small" @click="newFile">
            <template #icon>
              <icon-plus />
            </template>
            <template #default>{{ $t('knowledgeBase.window.newFile') }}</template>
          </a-button>
        </div>
        <a-spin
          :loading="systemStore.knowledgeBaseWindowLoading"
          class="knowledge-base-file-list"
          tip=""
        >
          <div
            v-if="fileList.filter((f) => f.text.includes(fileKeyword)).length === 0"
            class="knowledge-base-file-list-empty"
          >
            <a-empty>
              <template #image>
                <icon-file />
              </template>
              {{ $t('knowledgeBase.window.empty') }}
            </a-empty>
          </div>
          <div
            v-for="f in fileList.filter((f1) => f1.text.includes(fileKeyword))"
            v-else
            :key="f.key"
            class="knowledge-base-file-item"
            @click="openFileDetail(f)"
          >
            <div class="knowledge-base-file-content">{{ f.text }}</div>
            <div class="knowledge-base-file-footer">
              <div>
                {{ $t('common.updateTime') }}:
                {{ dayjs(f.updateTime).format('YYYY-MM-DD HH:mm') }}
              </div>
              <div>{{ f.text.length }} {{ $t('common.charCount') }}</div>
            </div>
          </div>
        </a-spin>
      </template>
      <!-- 检索结果 -->
      <template v-else>
        <div>
          <a-button size="small" @click="backFileList">
            <template #icon>
              <icon-arrow-left />
            </template>
            <template #default>{{ $t('knowledgeBase.window.backFileList') }}</template>
          </a-button>
        </div>
        <div class="knowledge-base-question">{{ currentQuestion }}</div>
        <a-spin
          :loading="systemStore.knowledgeBaseWindowLoading"
          class="knowledge-base-answer"
          tip=""
        >
          <div class="select-text">{{ answer }}</div>
        </a-spin>
      </template>
    </div>
    <!-- 输入框 -->
    <div class="knowledge-base-search-input">
      <a-input
        v-model="question"
        size="large"
        allow-clear
        :placeholder="$t('knowledgeBase.window.search')"
        class="search-input"
        @press-enter="sendQuestion"
      >
        <template #suffix>
          <icon-arrow-up style="cursor: pointer" @click="sendQuestion" />
        </template>
      </a-input>
    </div>

    <!-- 新增文件Modal -->
    <a-modal
      v-model:visible="newFileVisible"
      :ok-text="$t('common.ok')"
      :cancel-text="$t('common.cancel')"
      unmount-on-close
      title-align="start"
      width="80vw"
      :on-before-ok="handleNewFileModalBeforeOk"
      @close="clearNewFileModal"
    >
      <template #title> {{ $t('knowledgeBase.window.newFile') }} </template>
      <div style="height: 60vh; overflow-y: auto">
        <a-form :model="newFileForm" layout="vertical">
          <a-form-item field="name" :label="$t('knowledgeBase.window.newFileText')">
            <a-textarea
              v-model="newFileForm.text"
              :auto-size="{ minRows: 15, maxRows: 15 }"
              :placeholder="$t('common.pleaseEnter') + ' ' + $t('knowledgeBase.window.newFileText')"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <!-- 文件详情Modal -->
    <a-modal
      v-model:visible="fileDetailVisible"
      :ok-text="$t('common.ok')"
      :cancel-text="$t('common.cancel')"
      unmount-on-close
      title-align="start"
      width="80vw"
    >
      <template #title> {{ $t('knowledgeBase.window.fileDetail') }} </template>
      <div style="height: 60vh; overflow-y: auto">
        <a-form :model="fileDetail" layout="vertical">
          <a-form-item field="name" :label="$t('knowledgeBase.window.newFileText')">
            <a-textarea
              v-model="fileDetail.text"
              :auto-size="{ minRows: 15, maxRows: 15 }"
              :placeholder="$t('common.pleaseEnter') + ' ' + $t('knowledgeBase.window.newFileText')"
            />
          </a-form-item>
        </a-form>
      </div>
      <template #footer>
        <div style="display: flex; gap: 10px">
          <a-button @click="exportTextFile('knowledge-file.txt', fileDetail.text)">{{
            $t('common.export')
          }}</a-button>
          <a-button status="danger" @click="deleteFile(fileDetail)">{{
            $t('common.delete')
          }}</a-button>
          <a-button style="margin-left: auto" @click="fileDetailVisible = false">{{
            $t('common.cancel')
          }}</a-button>
          <a-button
            type="primary"
            :loading="systemStore.knowledgeBaseWindowLoading"
            @click="updateFile"
            >{{ $t('common.ok') }}</a-button
          >
        </div>
      </template>
    </a-modal>
  </div>
</template>

<style scoped lang="less">
.knowledge-base-window {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 15px;

  .knowledge-base-body {
    flex: 1;
    min-height: 0;
    box-sizing: border-box;
    padding: 0 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    position: relative;

    .knowledge-base-file-search {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;

      .search-input {
        border: none;
        background-color: var(--color-fill-2);
      }
    }

    .knowledge-base-question {
      flex-shrink: 0;
      background-color: var(--color-fill-1);
      padding: 10px;
      border-radius: var(--border-radius-small);
      cursor: text;
      line-height: 1.3rem;
    }

    .knowledge-base-answer {
      flex: 1;
      overflow-y: auto;
      background-color: var(--color-fill-1);
      padding: 10px;
      border-radius: var(--border-radius-small);
      white-space: pre-wrap;
      line-break: anywhere;
      cursor: text;
      line-height: 1.3rem;
    }

    .knowledge-base-file-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .knowledge-base-file-list-empty {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .knowledge-base-file-item {
        box-sizing: border-box;
        padding: 10px;
        background-color: var(--color-fill-1);
        border-radius: var(--border-radius-small);

        .knowledge-base-file-content {
          font-size: 14px;
          line-height: 1.3rem;
          overflow: hidden;
          display: -webkit-box;
          text-overflow: ellipsis;
          word-break: break-all;
          line-break: anywhere;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }

        .knowledge-base-file-footer {
          font-size: 13px;
          color: var(--color-text-3);
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
      }
    }
  }

  .knowledge-base-search-input {
    flex-shrink: 0;
    box-sizing: border-box;
    padding: 0 15px 15px 15px;

    .search-input {
      border: none;
      background-color: var(--color-fill-2);
    }
  }
}
</style>
