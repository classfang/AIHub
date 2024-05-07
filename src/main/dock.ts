import { platform } from '@electron-toolkit/utils'
import { app, BrowserWindow, ipcMain, nativeImage } from 'electron'
import * as path from 'node:path'
import { clearInterval } from 'node:timers'

const icon10deg = '../../resources/icon-deg/icon-10deg.png'
const icon20deg = '../../resources/icon-deg/icon-20deg.png'
const icon30deg = '../../resources/icon-deg/icon-30deg.png'
const icon40deg = '../../resources/icon-deg/icon-40deg.png'
const icon50deg = '../../resources/icon-deg/icon-50deg.png'
const icon60deg = '../../resources/icon-deg/icon-60deg.png'
const icon70deg = '../../resources/icon-deg/icon-70deg.png'
const icon80deg = '../../resources/icon-deg/icon-80deg.png'
const icon90deg = '../../resources/icon-deg/icon-90deg.png'
const icon100deg = '../../resources/icon-deg/icon-100deg.png'
const icon110deg = '../../resources/icon-deg/icon-110deg.png'
const icon = '../../resources/icon.png'

const __dirname = import.meta.dirname

// 图标列表
const iconArray = [
  icon,
  icon10deg,
  icon20deg,
  icon30deg,
  icon40deg,
  icon50deg,
  icon60deg,
  icon70deg,
  icon80deg,
  icon90deg,
  icon100deg,
  icon110deg
]

export const getDockIconArray = () => {
  return iconArray
}

export const getDockIcon = (index: number) => {
  return path.join(__dirname, iconArray[index])
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

export const initDock = (mainWindow: BrowserWindow) => {
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
}
