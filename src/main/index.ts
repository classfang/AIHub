import { appConfig, mainWindowConfig } from './config'
import { getDockIcon, getDockIconArray } from './dock-icon'
import { initLangChain } from './lang-chain'
import { initLogger } from './logger'
import { initStore } from './store'
import { electronApp, is, optimizer, platform } from '@electron-toolkit/utils'
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
import fs from 'fs'
import { clearInterval } from 'node:timers'
import { join } from 'path'
import * as vm from 'vm'

// 初始化仓库
const store = initStore()

// 初始化日志记录器
const logger = initLogger(appConfig.logsPath)

// 临时缓存目录
const creatTempPath = () => {
  try {
    fs.mkdirSync(appConfig.tempPath)
  } catch (e: any) {
    if (e.code != 'EEXIST') {
      logger.error('create temp path error：' + e)
    }
  }
}

// 主窗口
let mainWindow: BrowserWindow

// 创建主窗口
const createWindow = () => {
  // 获取主窗口尺寸
  const mainWindowSize = store.get('main-window-size') as { width: number; height: number }

  // 创建主窗口
  mainWindow = new BrowserWindow({
    width: mainWindowSize?.width ?? mainWindowConfig.minWidth,
    height: mainWindowSize?.height ?? mainWindowConfig.minHeight,
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
    ...(platform.isLinux ? { icon: getDockIcon(0) } : {}),
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
      logger.info('openExternal: ' + details.url)
    })
    return { action: 'deny' }
  })

  // 监听窗口关闭事件
  mainWindow.on('close', (event) => {
    if (platform.isMacOS) {
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

  // 将窗口大小保存到 electron-store 中
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds()
    store.set('main-window-size', { width, height })
  })

  // 加载用于开发环境的 URL 或用于生产的本地 html 文件。
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']).then(() => {
      logger.info('mainWindow.loadURL')
    })
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html')).then(() => {
      logger.info('mainWindow.loadFile')
    })
  }
}

// dock图片转动
let dockAnimationInterval: NodeJS.Timeout | null = null
const startDockAnimation = () => {
  if (!platform.isMacOS) {
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
const stopDockAnimation = () => {
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

  // 初始化LangChain
  initLangChain()

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
  if (!platform.isMacOS) {
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

// 获取系统类型
ipcMain.on('process-platform', (event) => {
  event.returnValue = platform
})

// 打开开发者控制台
ipcMain.handle('open-dev-tools', () => {
  mainWindow.webContents.openDevTools()
})

// 开始Dock栏图标跳动
ipcMain.handle('start-dock-bounce', () => {
  // 获得焦点时不跳动
  if (platform.isMacOS && !mainWindow.isFocused()) {
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
  const filePath = join(appConfig.tempPath, fileName)
  const fileStream = fs.createWriteStream(filePath)
  const buffer = Buffer.from(await blob.arrayBuffer())
  fileStream.write(buffer)
  fileStream.end()

  return filePath
})

// 保存base64文件
ipcMain.handle('save-file-by-base64', async (_event, base64: string, fileName: string) => {
  creatTempPath()
  const filePath = join(appConfig.tempPath, fileName)
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'), 'binary')

  return filePath
})

// 保存本地文件
ipcMain.handle('save-file-by-path', async (_event, path: string, fileName: string) => {
  creatTempPath()
  const filePath = join(appConfig.tempPath, fileName)
  fs.copyFileSync(path, filePath)

  return filePath
})

// 打开缓存目录
ipcMain.handle('open-cache-dir', () => {
  return shell.openPath(appConfig.tempPath)
})

// 打开日志目录
ipcMain.handle('open-log-dir', () => {
  return shell.openPath(appConfig.logsPath)
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
  const files: string[] = fs.readdirSync(appConfig.tempPath)
  if (!files || files.length === 0) {
    return
  }
  files.forEach((file) => {
    const filePath = join(appConfig.tempPath, file)
    if (!images.includes(filePath)) {
      fs.unlinkSync(filePath)
    }
  })
})

// 获取缓存文件列表
ipcMain.handle('get-cache-files', () => {
  const files: string[] = fs.readdirSync(appConfig.tempPath)
  const cacheFiles: { name: string; data: string }[] = []
  if (!files || files.length === 0) {
    return cacheFiles
  }
  files.forEach((file) => {
    cacheFiles.push({
      name: file,
      data: fs.readFileSync(join(appConfig.tempPath, file)).toString('base64')
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
      fs.writeFileSync(join(appConfig.tempPath, file.name), Buffer.from(file.data, 'base64'))
      resultFlag = true
    } catch (e) {
      logger.error('add-cache-files error：' + e)
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

// 运行JavaScript脚本
ipcMain.handle('execute-js', (_event, jsCode: string) => {
  const context = vm.createContext(Object.assign({ require: require }, global))
  return vm.runInContext(jsCode, context)
})
