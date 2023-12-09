<script setup lang="ts">
import { useSettingStore } from '@renderer/store/setting'
import { useI18n } from 'vue-i18n'
import { reactive, toRefs } from 'vue'
import { Message } from '@arco-design/web-vue'
import { debounce } from '@renderer/utils/debounce-util'
import { translate, TranslateResult } from '@renderer/utils/translator'

const settingStore = useSettingStore()
const { t } = useI18n()

const data = reactive({
  provider: 'Youdao' as TranslatorProvider,
  queryType: 'auto',
  resultType: 'auto',
  query: '',
  translateResult: {
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
    }
  } as TranslateResult,
  isLoading: false
})
const { provider, query, queryType, resultType, translateResult, isLoading } = toRefs(data)

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
  const option = {
    appId: settingStore.youdao.appId,
    secretKey: settingStore.youdao.secret,
    query: data.query,
    queryType: data.queryType,
    resultType: data.resultType,
    success: (result: TranslateResult) => {
      clearResult()
      data.translateResult = result
      data.isLoading = false
    },
    error: (err?: any) => {
      clearResult()
      data.translateResult.result = 'Error: ' + err
      data.isLoading = false
    }
  }
  if (!data.query) {
    clearResult()
    return
  }
  data.isLoading = true
  translate(data.provider, option)
}, 500)

const clearResult = (): void => {
  data.translateResult = {
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
    }
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
  navigator.clipboard.writeText(data.translateResult.result)
  Message.success(t('common.copySuccess'))
}
</script>

<template>
  <div class="translator">
    <!-- 头部 -->
    <div class="translator-header drag-area">
      <div class="translator-header-title">{{ $t('translator.name') }}</div>
      <div class="translator-header-provider-select no-drag-area">
        <a-select v-model="provider" size="small">
          <a-option value="Youdao">{{ $t('translationProvider.Youdao') }}</a-option>
        </a-select>
      </div>
    </div>
    <!-- 主体 -->
    <div class="translator-body">
      <!-- 输入区域 -->
      <div class="query-area">
        <!-- 语言选择 -->
        <div class="lang-type">
          <a-select v-model="queryType" class="lang-type-select" allow-search :allow-clear="false">
            <a-option value="auto">{{ $t('translator.langType.auto') }}</a-option>
            <a-option value="zh-CHS">{{ $t('translator.langType.zh-CHS') }}</a-option>
            <a-option value="en">{{ $t('translator.langType.en') }}</a-option>
            <a-option value="ja">{{ $t('translator.langType.ja') }}</a-option>
            <a-option value="ko">{{ $t('translator.langType.ko') }}</a-option>
            <a-option value="fr">{{ $t('translator.langType.fr') }}</a-option>
          </a-select>
          <icon-swap :size="30" class="lang-type-swap-btn" @click="swapLangType" />
          <a-select v-model="resultType" class="lang-type-select" allow-search :allow-clear="false">
            <a-option value="auto">{{ $t('translator.langType.auto') }}</a-option>
            <a-option value="zh-CHS">{{ $t('translator.langType.zh-CHS') }}</a-option>
            <a-option value="en">{{ $t('translator.langType.en') }}</a-option>
            <a-option value="ja">{{ $t('translator.langType.ja') }}</a-option>
            <a-option value="ko">{{ $t('translator.langType.ko') }}</a-option>
            <a-option value="fr">{{ $t('translator.langType.fr') }}</a-option>
          </a-select>
        </div>
        <!-- 输入 -->
        <div class="query">
          <textarea
            v-model="query"
            class="query-textarea"
            :placeholder="t('translator.queryPlaceholder')"
            @input="queryTextareaInput"
          ></textarea>
          <div class="query-footer">
            <icon-sound
              v-if="translateResult.speakUrl"
              class="speech-btn"
              @click="speechAudioPlay(translateResult.speakUrl)"
            />
            <icon-sound v-else class="speech-btn-disabled" />
            <icon-delete v-if="query" class="clear-btn" @click="queryClear" />
            <icon-delete v-else class="clear-btn-disabled" />
          </div>
        </div>
      </div>
      <!-- 结果区域 -->
      <div class="return-area">
        <!-- 翻译结果 -->
        <a-spin :loading="isLoading" tip="">
          <div class="result">
            <textarea
              v-model="translateResult.result"
              :placeholder="t('translator.returnPlaceholder')"
              class="result-textarea"
            ></textarea>
            <div class="result-footer">
              <icon-sound
                v-if="translateResult.tSpeakUrl"
                class="speech-btn"
                @click="speechAudioPlay(translateResult.tSpeakUrl)"
              />
              <icon-sound v-else class="speech-btn-disabled" />
              <icon-copy v-if="translateResult.result" class="copy-btn" @click="copyResult" />
              <icon-copy v-else class="copy-btn-disabled" />
            </div>
          </div>
        </a-spin>
        <!-- 翻译详情 -->
        <div class="result-detail select-text">
          <div
            v-if="
              !translateResult.uk.phonetic &&
              !translateResult.uk.speech &&
              !translateResult.us.phonetic &&
              !translateResult.uk.speech &&
              !translateResult.explains &&
              !translateResult.wfs
            "
            class="result-detail-placeholder"
          >
            {{ $t('translator.returnDetailPlaceholder') }}
          </div>
          <div class="phonetic-and-speech">
            <div>
              <span v-if="translateResult.uk.phonetic || translateResult.uk.speech"> [UK] </span>
              {{ translateResult.uk.phonetic }}
              <template v-if="translateResult.uk.speech">
                <icon-sound
                  class="speech-btn"
                  @click="speechAudioPlay(translateResult.uk.speech)"
                />
              </template>
            </div>
            <div>
              <span v-if="translateResult.us.phonetic || translateResult.us.speech"> [US] </span>
              {{ translateResult.us.phonetic }}
              <template v-if="translateResult.us.speech">
                <icon-sound
                  class="speech-btn"
                  @click="speechAudioPlay(translateResult.us.speech)"
                />
              </template>
            </div>
          </div>
          <div>
            {{ translateResult.explains }}
          </div>
          <div>
            {{ translateResult.wfs }}
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
    gap: 10px;
    box-sizing: border-box;
    padding: 15px;

    .query-area {
      flex: 1;
      height: 100%;
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
