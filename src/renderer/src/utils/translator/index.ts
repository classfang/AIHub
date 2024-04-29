import { baiduTranslate } from '@renderer/utils/translator/baidu-util'
import { youdaoTranslate } from '@renderer/utils/translator/youdao-util'

type TranslateFunctionMap = {
  [provider in TranslatorProvider]: (option: CommonTranslateOption) => Promise<any>
}

export interface TranslateResult {
  result: string
  speakUrl: string
  tSpeakUrl: string
}

export interface CommonTranslateOption {
  appId?: string
  secretKey?: string
  query?: string
  queryType?: string
  resultType?: string
  success?: (result: TranslateResult) => void
  error?: (err?: any) => void
}

const translateFunctionMap: TranslateFunctionMap = {
  youdao: youdaoTranslate,
  baiduTranslation: baiduTranslate
}

export const translate = async (
  provider: keyof TranslateFunctionMap,
  option: CommonTranslateOption
) => {
  const translateFunction = translateFunctionMap[provider]
  if (translateFunction) {
    return translateFunction(option)
  } else {
    throw new Error(`Unsupported provider: ${provider}`)
  }
}
