// 创建主窗口
import { mainWindowConfig } from './config'
import { getDockIcon } from './dock'
import { is, platform } from '@electron-toolkit/utils'
import { BrowserWindow, nativeTheme, shell } from 'electron'
import { join } from 'path'
import { Logger } from 'winston'

const __dirname = import.meta.dirname

export const createWindow = (store: Record<string, any>, logger: Logger) => {
  // 获取主窗口尺寸
  const mainWindowSize = store.get('main-window-size') as { width: number; height: number }

  // 创建主窗口
  const mainWindow = new BrowserWindow({
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

  return mainWindow
}
