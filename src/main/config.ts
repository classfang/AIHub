import { app } from 'electron'
import { join } from 'path'

export const appConfig = {
  appUserModelId: 'cn.junki',
  logsPath: join(app.getPath('userData'), 'logs'),
  tempPath: join(app.getPath('userData'), 'temp')
}
export const mainWindowConfig = {
  minWidth: 1000,
  minHeight: 700
}
