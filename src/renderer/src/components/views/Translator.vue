<script setup lang="ts">
import { useSettingStore } from '@renderer/store/setting'
import { useI18n } from 'vue-i18n'
import { reactive, toRefs } from 'vue'
import { Message } from '@arco-design/web-vue'
import { debounce } from '@renderer/utils/debounce-util'
import { SHA256, enc } from 'crypto-js'
import axios from 'axios'

const settingStore = useSettingStore()
const { t } = useI18n()

const data = reactive({
  provider: 'Youdao' as TranslatorProvider,
  langType: [
    {
      code: 'auto',
      label: '自动'
    },
    {
      code: 'zh-CHS',
      label: '中文'
    },
    {
      code: 'en',
      label: '英语'
    },
    {
      code: 'ja',
      label: '日语'
    },
    {
      code: 'ko',
      label: '韩语'
    },
    {
      code: 'fr',
      label: '法语'
    }
  ],
  queryType: 'auto',
  resultType: 'auto',
  query: '',
  result: '',
  speakUrl: '',
  tSpeakUrl: '',
  explains: '',
  wfs: '',
  us: {
    phonetic: '',
    speech: ''
  },
  uk: {
    phonetic: '',
    speech: ''
  },
  isLoading: false
})
const {
  provider,
  langType,
  query,
  result,
  speakUrl,
  tSpeakUrl,
  queryType,
  resultType,
  explains,
  wfs,
  us,
  uk,
  isLoading
} = toRefs(data)

const queryTextareaInput = (): void => {
  let configMiss = false
  switch (data.provider) {
    case 'Youdao':
      if (!settingStore.youdao.appId || !settingStore.youdao.secret) {
        configMiss = true
      }
      break
  }
  if (configMiss) {
    Message.error(t('translator.configMiss.' + data.provider))
    return
  }
  debounceQuery()
}

const debounceQuery = debounce(() => {
  youdaoApi()
}, 500)

const youdaoApi = (): void => {
  if (!data.query) {
    clearResult()
    return
  }
  data.isLoading = true

  const appKey = settingStore.youdao.appId
  const key = settingStore.youdao.secret
  const salt = new Date().getTime()
  const curtime = Math.round(new Date().getTime() / 1000)
  const query = data.query
  const from = data.queryType
  const to = data.resultType
  const str1 = appKey + youdaoApiQueryTruncate(query) + salt + curtime + key

  const sign = SHA256(str1).toString(enc.Hex)
  axios
    .get('https://openapi.youdao.com/api', {
      params: {
        q: query,
        appKey: appKey,
        salt: salt,
        from: from,
        to: to,
        sign: sign,
        signType: 'v3',
        curtime: curtime
      }
    })
    .then((res) => {
      clearResult()
      if (res.data.errorCode != 0) {
        data.result = '错误代码：' + res.data.errorCode
        return
      }
      data.result = res.data.translation.join(',')
      data.result = data.result.replace('\\n', '\n')
      if (res.data.speakUrl) {
        data.speakUrl = res.data.speakUrl
      }
      if (res.data.tSpeakUrl) {
        data.tSpeakUrl = res.data.tSpeakUrl
      }
      if (res.data.basic.explains) {
        data.explains = res.data.basic.explains.join('\n')
      }
      if (res.data.basic.explains) {
        data.explains = res.data.basic.explains.join('\n')
      }
      if (res.data.basic.wfs) {
        data.wfs = res.data.basic.wfs.map((wf) => wf.wf.name + ': ' + wf.wf.value).join('\n')
      }
      if (res.data.basic['uk-phonetic']) {
        data.uk.phonetic = res.data.basic['uk-phonetic']
      }
      if (res.data.basic['uk-speech']) {
        data.uk.speech = res.data.basic['uk-speech']
      }
      if (res.data.basic['us-phonetic']) {
        data.us.phonetic = res.data.basic['us-phonetic']
      }
      if (res.data.basic['us-speech']) {
        data.us.speech = res.data.basic['us-speech']
      }
    })
    .finally(() => {
      data.isLoading = false
    })
}

const youdaoApiQueryTruncate = (q): string => {
  const len = q.length
  if (len <= 20) return q
  return q.substring(0, 10) + len + q.substring(len - 10, len)
}

const clearResult = (): void => {
  data.result = ''
  data.speakUrl = ''
  data.tSpeakUrl = ''
  data.explains = ''
  data.wfs = ''
  data.uk = {
    phonetic: '',
    speech: ''
  }
  data.us = {
    phonetic: '',
    speech: ''
  }
}

const swapLangType = (): void => {
  const temp = data.queryType
  data.queryType = data.resultType
  data.resultType = temp
}

const speechAudioPlay = (src: string): void => {
  new Audio(src).play()
}

const queryClear = (): void => {
  data.query = ''
  clearResult()
}

const copyResult = (): void => {
  navigator.clipboard.writeText(data.result)
  Message.success(t('common.copySuccess'))
}
</script>

<template>
  <div class="translator">
    <div class="translator-header drag-area">
      <div class="translator-header-title">{{ $t('translator.name') }}</div>
      <div class="translator-header-provider-select no-drag-area">
        <a-select v-model="provider" size="small">
          <a-option value="Youdao">{{ $t('translationProvider.Youdao') }}</a-option>
        </a-select>
      </div>
    </div>
    <div class="translator-body">
      <div class="query-area">
        <div class="lang-type">
          <a-select v-model="queryType" class="lang-type-select" allow-search :allow-clear="false">
            <a-option v-for="lt in langType" :key="lt.code" :value="lt.code">{{
              lt.label
            }}</a-option>
          </a-select>
          <icon-swap :size="30" class="lang-type-swap-btn" @click="swapLangType" />
          <a-select v-model="resultType" class="lang-type-select" allow-search :allow-clear="false">
            <a-option v-for="lt in langType" :key="lt.code" :value="lt.code">{{
              lt.label
            }}</a-option>
          </a-select>
        </div>
        <div class="query">
          <textarea
            v-model="query"
            class="query-textarea"
            :placeholder="t('translator.queryPlaceholder')"
            @input="queryTextareaInput"
          ></textarea>
          <div class="query-footer">
            <icon-sound v-if="speakUrl" class="speech-btn" @click="speechAudioPlay(speakUrl)" />
            <icon-sound v-else class="speech-btn-disabled" />
            <icon-delete v-if="query" class="clear-btn" @click="queryClear" />
            <icon-delete v-else class="clear-btn-disabled" />
          </div>
        </div>
      </div>
      <div class="return-area">
        <a-spin :loading="isLoading" tip="">
          <div class="result">
            <textarea
              v-model="result"
              :placeholder="t('translator.returnPlaceholder')"
              class="result-textarea"
            ></textarea>
            <div class="result-footer">
              <icon-sound v-if="tSpeakUrl" class="speech-btn" @click="speechAudioPlay(tSpeakUrl)" />
              <icon-sound v-else class="speech-btn-disabled" />
              <icon-copy v-if="result" class="copy-btn" @click="copyResult" />
              <icon-copy v-else class="copy-btn-disabled" />
            </div>
          </div>
        </a-spin>

        <div class="result-detail select-text">
          <div
            v-if="!uk.phonetic && !uk.speech && !us.phonetic && !uk.speech && !explains && !wfs"
            class="result-detail-placeholder"
          >
            {{ $t('translator.returnDetailPlaceholder') }}
          </div>
          <div class="phonetic-and-speech">
            <div>
              <span v-if="uk.phonetic || uk.speech"> [UK] </span>
              {{ uk.phonetic }}
              <template v-if="uk.speech">
                <icon-sound class="speech-btn" @click="speechAudioPlay(uk.speech)" />
              </template>
            </div>
            <div>
              <span v-if="us.phonetic || us.speech"> [US] </span>
              {{ us.phonetic }}
              <template v-if="us.speech">
                <icon-sound class="speech-btn" @click="speechAudioPlay(us.speech)" />
              </template>
            </div>
          </div>
          <div>
            {{ explains }}
          </div>
          <div>
            {{ wfs }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.translator {
  flex-grow: 1;
  display: flex;
  flex-direction: column;

  .translator-header {
    flex-shrink: 0;
    height: 40px;
    border-bottom: 1px solid var(--color-border-1);
    box-sizing: border-box;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .translator-header-title {
      flex-grow: 1;
      font-size: 15px;
      font-weight: 500;
    }

    .translator-header-provider-select {
      flex-shrink: 0;

      :deep(.arco-select) {
        background-color: var(--color-fill-1);
        border: none;
      }
    }
  }

  .translator-body {
    flex-grow: 1;
    min-height: 0;
    display: flex;

    .query-area {
      flex: 1;
      height: 100%;
      border-right: 1px solid var(--color-border-1);
      box-sizing: border-box;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .lang-type {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-shrink: 0;

        :deep(.lang-type-select) {
          background-color: var(--color-fill-1);
          border: none;
          cursor: default;
        }

        .lang-type-swap-btn {
          cursor: pointer;
        }
      }

      .query {
        flex-grow: 1;
        display: flex;
        flex-direction: column;

        .query-textarea {
          flex-grow: 1;
          background-color: var(--color-fill-1);
          color: var(--color-text-1);
          border: none;
          outline: none;
          flex-shrink: 0;
          resize: none;
          box-sizing: border-box;
          padding: 10px;
        }

        .query-footer {
          background-color: var(--color-fill-1);
          box-sizing: border-box;
          padding: 10px;
          display: flex;
          justify-content: space-between;

          .speech-btn {
            font-size: 15px;
            color: rgb(var(--primary-5));
            cursor: pointer;
          }

          .clear-btn {
            font-size: 15px;
            color: rgb(var(--danger-5));
            cursor: pointer;
          }

          .copy-btn {
            font-size: 15px;
            color: rgb(var(--success-5));
            cursor: pointer;
          }

          .speech-btn-disabled,
          .clear-btn-disabled {
            font-size: 15px;
            color: var(--color-text-4);
          }
        }
      }
    }

    .return-area {
      flex: 1;
      height: 100%;
      border-right: 1px solid var(--color-border-1);
      box-sizing: border-box;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      :deep(.arco-spin) {
        flex: 1;
        display: flex;
      }

      .result {
        flex: 1;
        display: flex;
        flex-direction: column;

        .result-textarea {
          flex-grow: 1;
          background-color: var(--color-fill-1);
          color: var(--color-text-1);
          border: none;
          outline: none;
          flex-shrink: 0;
          resize: none;
          box-sizing: border-box;
          padding: 10px;
        }

        .result-footer {
          background-color: var(--color-fill-1);
          box-sizing: border-box;
          padding: 10px;
          display: flex;
          justify-content: space-between;

          .speech-btn {
            font-size: 15px;
            color: rgb(var(--primary-5));
            cursor: pointer;
          }

          .clear-btn {
            font-size: 15px;
            color: rgb(var(--danger-5));
            cursor: pointer;
          }

          .copy-btn {
            font-size: 15px;
            color: rgb(var(--success-5));
            cursor: pointer;
          }

          .speech-btn-disabled,
          .clear-btn-disabled,
          .copy-btn-disabled {
            font-size: 15px;
            color: var(--color-text-4);
          }
        }
      }

      .result-detail {
        flex: 1;
        background-color: var(--color-fill-1);
        box-sizing: border-box;
        padding: 10px;
        cursor: text;
        white-space: pre-line;
        line-break: anywhere;
        line-height: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .result-detail-placeholder {
          color: var(--color-text-3);
        }

        .phonetic-and-speech {
          display: flex;
          gap: 10px;

          .speech-btn {
            color: rgb(var(--primary-5));
            cursor: pointer;
          }
        }
      }
    }
  }
}
</style>
