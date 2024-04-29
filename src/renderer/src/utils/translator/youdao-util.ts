import { Logger } from '@renderer/utils/logger'
import { CommonTranslateOption, TranslateResult } from '@renderer/utils/translator/index'
import axios from 'axios'
import { enc, SHA256 } from 'crypto-js'

export const youdaoTranslate = async (option: CommonTranslateOption) => {
  const { appId, secretKey, query, queryType, resultType, success, error } = option

  if (!appId || !secretKey || !query || !queryType || !resultType) {
    Logger.error('youdaoTranslate params miss')
    return
  }

  const appKey = appId
  const key = secretKey
  const salt = new Date().getTime()
  const curtime = Math.round(new Date().getTime() / 1000)
  const from = queryType
  const to = resultType
  const str1 = appKey + youdaoTranslateQueryTruncate(query) + salt + curtime + key

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
      if (res.data.errorCode != 0) {
        error && error(res.data.errorCode)
        return
      }
      const returnObj: TranslateResult = {
        result: '',
        speakUrl: '',
        tSpeakUrl: ''
      }
      returnObj.result = res.data.translation.join(',').replace('\\n', '\n')
      if (res.data.speakUrl) {
        returnObj.speakUrl = res.data.speakUrl
      }
      if (res.data.tSpeakUrl) {
        returnObj.tSpeakUrl = res.data.tSpeakUrl
      }
      success && success(returnObj)
    })
    .catch((e) => {
      error && error(e)
    })
}

const youdaoTranslateQueryTruncate = (q: string): string => {
  const len = q.length
  if (len <= 20) return q
  return q.substring(0, 10) + len + q.substring(len - 10, len)
}
