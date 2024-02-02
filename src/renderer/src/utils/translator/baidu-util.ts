import { CommonTranslateOption, TranslateResult } from '@renderer/utils/translator/index'
import { Logger } from '@renderer/utils/logger'
import { MD5 } from 'crypto-js'
import axios from 'axios'

export const baiduTranslate = async (option: CommonTranslateOption) => {
  const { appId, secretKey, query, queryType, resultType, success, error } = option

  if (!appId || !secretKey || !query || !queryType || !resultType) {
    Logger.error('baiduTranslate params miss')
    return
  }

  // 类型转换
  const from = changeType(queryType)
  const to = changeType(resultType)

  // 随机码
  const salt = 1234567890

  // 签名
  const sign = MD5(appId + query + salt + secretKey).toString()

  // 请求
  axios
    .get('https://fanyi-api.baidu.com/api/trans/vip/translate', {
      params: {
        q: query,
        from: from,
        to: to,
        appid: appId,
        salt: salt,
        sign: sign
      }
    })
    .then((res) => {
      if (res.data.error_code) {
        error && error(res.data.error_msg)
        return
      }
      const returnObj: TranslateResult = {
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
      returnObj.result = res.data.trans_result[0].dst
      success && success(returnObj)
    })
    .catch((e) => {
      error && error(e)
    })
}

// 类型转换
const changeType = (type: string) => {
  const typeDict = {
    auto: 'auto',
    'zh-CHS': 'zh',
    en: 'en',
    ja: 'jp',
    ko: 'kor',
    fr: 'fra'
  }
  return typeDict[type]
}
