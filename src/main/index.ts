import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  shell,
  nativeTheme,
  nativeImage
} from 'electron'
import { join } from 'path'
import fs from 'fs'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { appConfig, mainWindowConfig } from './config'
import Store from 'electron-store'
import { clearInterval } from 'node:timers'
import { createClient } from 'redis'
import { RedisVectorStore } from '@langchain/community/vectorstores/redis'
import { RedisClientOptions } from '@redis/client/dist/lib/client'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { DocxLoader } from 'langchain/document_loaders/fs/docx'
import { PPTXLoader } from 'langchain/document_loaders/fs/pptx'
import { BaseDocumentLoader } from 'langchain/dist/document_loaders/base'
import { getDockIcon, getDockIconArray } from './dock-icon'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { RetrievalQAChain } from 'langchain/chains'

// 临时缓存目录
const tempPath = join(app.getPath('userData'), 'temp')
const creatTempPath = () => {
  try {
    fs.mkdirSync(tempPath)
  } catch (e: any) {
    if (e.code != 'EEXIST') {
      console.log('创建目录失败：', e)
    }
  }
}

// 主窗口
let mainWindow: BrowserWindow

function createWindow(): void {
  // 创建主窗口
  mainWindow = new BrowserWindow({
    width: mainWindowConfig.minWidth,
    height: mainWindowConfig.minHeight,
    minWidth: mainWindowConfig.minWidth,
    minHeight: mainWindowConfig.minHeight,
    show: false,
    autoHideMenuBar: true,
    // mac下不显示标题栏
    titleBarStyle: 'hiddenInset',
    // mac下红绿灯位置
    trafficLightPosition: {
      x: 5,
      y: 5
    },
    // 动态背景色
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#28282B' : '#F2F3F5',
    ...(process.platform === 'linux' ? { icon: getDockIcon(0) } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // 允许渲染进程通信（window.electron）
      sandbox: false,
      // 允许跨域请求、file协议加载本地文件等
      webSecurity: false,
      // 启动webview
      webviewTag: true
    }
  })

  // 准备就绪后显示主窗口
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // 浏览器打开链接
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url).then(() => {
      console.log('openExternal', details.url)
    })
    return { action: 'deny' }
  })

  // 监听窗口关闭事件
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin') {
      // MacOS 阻止窗口默认关闭行为
      event.preventDefault()

      if (mainWindow.isFullScreen()) {
        // 如果是最大化，则还原窗口
        mainWindow.setFullScreen(false)
      } else {
        // 隐藏窗口而不是关闭
        mainWindow.hide()
      }
    }
  })

  // 监听窗口获得焦点的事件
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('main-window-focus')
  })

  // 监听窗口失去焦点的事件
  mainWindow.on('blur', () => {
    mainWindow.webContents.send('main-window-blur')
  })

  // 加载用于开发环境的 URL 或用于生产的本地 html 文件。
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']).then(() => {
      console.log('mainWindow.loadURL')
    })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html')).then(() => {
      console.log('mainWindow.loadFile')
    })
  }
}

// dock图片转动
let dockAnimationInterval: NodeJS.Timeout | null = null
function startDockAnimation() {
  if (process.platform !== 'darwin') {
    return
  }
  const animationInterval = 50
  let iconIndex = 0

  if (dockAnimationInterval) {
    clearInterval(dockAnimationInterval)
  }
  dockAnimationInterval = setInterval(() => {
    iconIndex = (iconIndex + 1) % getDockIconArray().length
    app.dock.setIcon(getDockIcon(iconIndex))
  }, animationInterval)
}
function stopDockAnimation() {
  if (dockAnimationInterval) {
    clearInterval(dockAnimationInterval)
  }
  app.dock.setIcon(nativeImage.createEmpty())
}

// 应用准备就绪
app.whenReady().then(() => {
  // 设置user model
  electronApp.setAppUserModelId(appConfig.appUserModelId)

  // 在开发中默认使用 F12 打开或关闭 DevTools
  // 忽略生产环境中的 CommandOrControl + R。
  // 参考 https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 创建缓存目录
  creatTempPath()

  // 创建窗口
  createWindow()

  // 激活应用（点击dock栏图标、任务栏图标）
  app.on('activate', () => {
    if (!mainWindow.isMinimized()) {
      // 不是被最小化，直接显示主窗口
      mainWindow.show()
    }
  })
})

// 当所有窗口都关闭时退出，除了macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 退出应用之前（手动关闭一些资源，防止出现意外关闭错误提示）
app.on('before-quit', async (e) => {
  e.preventDefault()
  // 销毁主窗口
  mainWindow.destroy()
  // 退出应用
  app.exit()
})

// 打开开发者控制台
ipcMain.handle('open-dev-tools', () => {
  mainWindow.webContents.openDevTools()
})

// 开始Dock栏图标跳动
ipcMain.handle('start-dock-bounce', () => {
  // 获得焦点时不跳动
  if (process.platform === 'darwin' && !mainWindow.isFocused()) {
    app.dock.bounce('informational')
  }
})

// 开始Dock栏图标动画
ipcMain.handle('start-dock-animation', () => {
  startDockAnimation()
})

// 停止Dock栏图标动画
ipcMain.handle('stop-dock-animation', () => {
  stopDockAnimation()
})

// 存储相关
const store = new Store()
ipcMain.handle('get-store-value', (_event, key) => {
  return store.get(key)
})
ipcMain.on('get-store-value-sync', (event, key) => {
  event.returnValue = store.get(key)
})
ipcMain.handle('set-store-value', (_event, key, value) => {
  store.set(key, value)
})
ipcMain.handle('delete-store-value', (_event, key) => {
  store.delete(key)
})

// 获取版本信息
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

// 保存网络文件
ipcMain.handle('save-file-by-url', async (_event, url: string, fileName: string) => {
  creatTempPath()
  // 请求文件
  const fetchResp = await fetch(url)
  const blob = await fetchResp.blob()

  // 将blob写入文件
  const filePath = join(tempPath, fileName)
  const fileStream = fs.createWriteStream(filePath)
  const buffer = Buffer.from(await blob.arrayBuffer())
  fileStream.write(buffer)
  fileStream.end()

  return filePath
})

// 保存本地文件
ipcMain.handle('save-file-by-path', async (_event, path: string, fileName: string) => {
  creatTempPath()
  const filePath = join(tempPath, fileName)
  fs.copyFileSync(path, filePath)

  return filePath
})

// 打开缓存目录
ipcMain.handle('open-cache-dir', () => {
  return shell.openPath(tempPath)
})

// 读取本地图片为base64字符串
ipcMain.handle('read-local-image-base64', (_event, path: string) => {
  // 读取图片文件
  const data = fs.readFileSync(path)
  // 将图片数据转换为Base64
  return Buffer.from(data).toString('base64')
})

// 设置代理地址
ipcMain.handle('set-proxy', (_event, proxyUrl: string) => {
  return mainWindow?.webContents.session.setProxy({ proxyRules: proxyUrl })
})

// 复制文本到剪贴板
ipcMain.handle('clipboard-write-text', (_event, text: string) => {
  clipboard.writeText(text)
})

// 清理缓存
ipcMain.handle('clear-cache-files', (_event, images: string[]) => {
  if (images.length === 0) {
    return
  }
  const files: string[] = fs.readdirSync(tempPath)
  if (!files || files.length === 0) {
    return
  }
  files.forEach((file) => {
    const filePath = join(tempPath, file)
    if (!images.includes(filePath)) {
      fs.unlinkSync(filePath)
    }
  })
})

// 获取缓存文件列表
ipcMain.handle('get-cache-files', () => {
  const files: string[] = fs.readdirSync(tempPath)
  const cacheFiles: { name: string; data: string }[] = []
  if (!files || files.length === 0) {
    return cacheFiles
  }
  files.forEach((file) => {
    cacheFiles.push({
      name: file,
      data: fs.readFileSync(join(tempPath, file)).toString('base64')
    })
  })
  return cacheFiles
})

// 添加缓存文件
ipcMain.handle('add-cache-files', (_event, cacheFiles: { name: string; data: string }[]) => {
  let resultFlag = false
  if (!cacheFiles || cacheFiles.length === 0) {
    return resultFlag
  }
  cacheFiles.forEach((file) => {
    try {
      fs.writeFileSync(join(tempPath, file.name), Buffer.from(file.data, 'base64'))
      resultFlag = true
    } catch (e) {
      console.error('add-cache-files error：', e)
    }
  })
  return resultFlag
})

// 选择文件并读取内容
ipcMain.handle('select-file-and-read', (_event, extensions = ['*']) => {
  const result = dialog.showOpenDialogSync(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Select File', extensions }]
  })
  if (result && result[0]) {
    return fs.readFileSync(result[0])
  }
  return null
})

// langChain-redis 新增文件
ipcMain.handle(
  'lang-chain-redis-add-file',
  async (
    _event,
    redisClientOptions: RedisClientOptions,
    openaiConfig: {
      baseUrl: string
      key: string
    },
    indexName: string,
    text: string
  ) => {
    // redis 连接
    const client = createClient(redisClientOptions)
    await client.connect()

    // redis 向量库
    const vectorStore = new RedisVectorStore(
      new OpenAIEmbeddings({
        openAIApiKey: openaiConfig.key,
        configuration: {
          baseURL: openaiConfig.baseUrl
        }
      }),
      {
        redisClient: client,
        indexName: indexName
      }
    )

    // 文本分段
    const textSplitter = new RecursiveCharacterTextSplitter({
      // 最长1000字符
      chunkSize: 1000,
      // 重复50字符，便于连接上下文
      chunkOverlap: 50
    })
    const splitStrs = await textSplitter.splitText(text)

    // 缓存全文本
    const now = new Date().getTime()
    const fileKey = 'files:' + indexName + ':' + now
    await client.hSet(fileKey, {
      text: text,
      createTime: now,
      updateTime: now
    })

    // 保存文段文本向量数据
    await vectorStore.addDocuments(
      splitStrs.map((str) => {
        return { pageContent: str, metadata: { fileKey: fileKey } }
      })
    )

    // redis 断连
    await client.disconnect()

    // 返回全文本的缓存key
    return fileKey
  }
)

// langChain-redis 文件列表
ipcMain.handle(
  'lang-chain-redis-list-file',
  async (_event, redisClientOptions: RedisClientOptions, indexName: string) => {
    // redis 连接
    const client = createClient(redisClientOptions)
    await client.connect()

    // 获取全文本列表
    const fileKeys = await client.keys('files:' + indexName + ':*')
    const files: { key: string; text: string; createTime: number; updateTime: number }[] = []
    for (const fileKey of fileKeys) {
      const file = await client.hGetAll(fileKey)
      files.push({
        key: fileKey,
        text: file.text ?? '',
        createTime: file.createTime ? Number(file.createTime) : 0,
        updateTime: file.updateTime ? Number(file.updateTime) : 0
      })
    }

    // 排序
    files.sort((f1, f2) => f2.updateTime - f1.updateTime)

    // 获取向量数据数量
    const vectorKeys = await client.keys('doc:' + indexName + ':*')

    // redis 断连
    await client.disconnect()

    // 返回全文本列表
    return {
      files,
      docCount: vectorKeys.length
    }
  }
)

// langChain-redis 文件删除
ipcMain.handle(
  'lang-chain-redis-delete-file',
  async (_event, redisClientOptions: RedisClientOptions, indexName: string, fileKey: string) => {
    // redis 连接
    const client = createClient(redisClientOptions)
    await client.connect()

    // 首先删除文本对应的向量数据
    const vectorKeys = await client.keys('doc:' + indexName + ':*')
    if (vectorKeys.length > 0) {
      for (const vectorKey of vectorKeys) {
        const metadata = await client.hGet(vectorKey, 'metadata')
        if (metadata && JSON.parse(metadata).fileKey === fileKey) {
          await client.del(vectorKey)
        }
      }
    }

    // 删除文本数据
    await client.del(fileKey)

    // redis 断连
    await client.disconnect()
  }
)

// langChain-redis 提问
ipcMain.handle(
  'lang-chain-redis-question',
  async (
    _event,
    redisClientOptions: RedisClientOptions,
    openaiConfig: {
      baseUrl: string
      key: string
    },
    indexName: string,
    question: string
  ) => {
    // redis 连接
    const client = createClient(redisClientOptions)
    await client.connect()

    // redis 向量库
    const vectorStore = new RedisVectorStore(
      new OpenAIEmbeddings({
        openAIApiKey: openaiConfig.key,
        configuration: {
          baseURL: openaiConfig.baseUrl
        }
      }),
      {
        redisClient: client,
        indexName: indexName
      }
    )

    // 对话模型
    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      openAIApiKey: openaiConfig.key,
      configuration: {
        baseURL: openaiConfig.baseUrl
      }
    })
    // @ts-ignore
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever())

    // 提问
    const response = await chain.invoke({
      query: question
    })

    // redis 断连
    await client.disconnect()

    // 返回结果
    return response
  }
)

// langChain 加载文件
ipcMain.handle('lang-chain-load-file', async (_event, filePath: string) => {
  let loader: BaseDocumentLoader | null = null

  if (filePath.endsWith('.txt')) {
    loader = new TextLoader(filePath)
  } else if (filePath.endsWith('.pdf')) {
    loader = new PDFLoader(filePath)
  } else if (filePath.endsWith('.docx')) {
    loader = new DocxLoader(filePath)
  } else if (filePath.endsWith('.pptx')) {
    loader = new PPTXLoader(filePath)
  }

  if (!loader) {
    return ''
  }

  const docs = await loader.load()
  if (!docs || docs.length === 0) {
    return ''
  }

  return docs.reduce((accumulator, currentObject) => {
    return accumulator + currentObject.pageContent
  }, '')
})
