import { ElectronAPI } from '@electron-toolkit/preload'
import { fs } from 'node'

declare global {
  interface Window {
    electron: ElectronAPI
    fs: fs
  }
}
