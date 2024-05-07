import { appConfig } from './config'
import { initDock } from './dock'
import { initLangChain } from './lang-chain'
import { initLogger } from './logger'
import { createWindow } from './main-window'
import { initStore } from './store'
import { electronApp, optimizer, platform } from '@electron-toolkit/utils'
import { app, BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron'
import fs from 'fs'
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
  mainWindow = createWindow(store, logger)

  // 初始化LangChain
  initLangChain()

  // 初始化Dock
  initDock(mainWindow)

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

  // 去除base64数据前缀
  const commaIndex = base64.indexOf(',')
  if (commaIndex > -1) {
    base64 = base64.slice(commaIndex + 1)
  }
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
  const context = vm.createContext(Object.assign({ fetch: fetch }, global))
  return vm.runInContext(jsCode, context)
})

// 显示文件所在目录
ipcMain.handle('show-item-in-folder', (_event, filePath: string) => {
  return shell.showItemInFolder(filePath)
})
