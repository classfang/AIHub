import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import ClipboardJS from 'clipboard'
import 'highlight.js/scss/github-dark.scss'
import '@renderer/assets/css/markdown-code.less'
import { Message } from '@arco-design/web-vue'
import i18n from '@renderer/i18n'
import { textToBase64, base64ToText } from '@renderer/utils/base64-util'

const { t } = i18n.global

const clipboard = new ClipboardJS('.code-header-copy', {
  text: function (trigger) {
    const base64Str = trigger.getAttribute('data-clipboard-text-base64')
    return base64Str ? base64ToText(base64Str) : ''
  }
})
clipboard.on('success', () => {
  Message.success(t('common.copySuccess'))
})

const markdown = new MarkdownIt({
  highlight: (str: string, lang: string) => {
    if (!lang) {
      lang = 'text'
    }
    let codeHtml = `<code class="hljs language-${lang}">${
      hljs.highlight(str, { language: lang }).value
    }</code>`
    codeHtml =
      `<div class="code-header">
        <div>${lang}</div>
        <div class="code-header-copy" data-clipboard-text-base64='${textToBase64(str)}'>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 4C10.8954 4 10 4.89543 10 6H14C14 4.89543 13.1046 4 12 4ZM8.53513 4C9.22675 2.8044 10.5194 2 12 2C13.4806 2 14.7733 2.8044 15.4649 4H17C18.6569 4 20 5.34315 20 7V19C20 20.6569 18.6569 22 17 22H7C5.34315 22 4 20.6569 4 19V7C4 5.34315 5.34315 4 7 4H8.53513ZM8 6H7C6.44772 6 6 6.44772 6 7V19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19V7C18 6.44772 17.5523 6 17 6H16C16 7.10457 15.1046 8 14 8H10C8.89543 8 8 7.10457 8 6Z" fill="currentColor"></path></svg>
          <span>Copy</span>
        </div>
      </div>` + codeHtml
    return `<pre>${codeHtml}</pre>`
  }
})

export const renderMarkdown = (content: string, isLoading: boolean) => {
  let htmlCode = markdown.render(content)

  // 加载中，显示闪烁光标
  if (isLoading) {
    // 找到所有闭合标签
    const matches = htmlCode.match(/<\/[^>]+>/g)
    if (matches) {
      // 获取最后一个闭合标签
      let lastCloseTag = matches[matches.length - 1]
      // TODO 代码块需要跳过pre标签，将光标插入到pre里面的code标签中
      if (['</pre>', '</ol>', '</ul>'].includes(lastCloseTag)) {
        lastCloseTag = matches[matches.length - 2]
      }
      // 获取最后一个闭合标签的索引
      const lastCloseTagIndex = htmlCode.lastIndexOf(lastCloseTag)
      // 插入光标元素
      htmlCode =
        htmlCode.substring(0, lastCloseTagIndex) +
        `<span class="chat-message-loading">丨</span>` +
        htmlCode.substring(lastCloseTagIndex)
    }
  }

  return htmlCode
}
