import { ipcMain } from 'electron'
import fs from 'fs'
import { join } from 'path'
import winston, { LogEntry } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

// 初始化日志记录器
export const initLogger = (logsPath: string) => {
  // 创建日志目录
  try {
    fs.mkdirSync(logsPath)
  } catch (e: any) {
    if (e.code != 'EEXIST') {
      console.log('create logs path error：', e?.message)
    }
  }

  // 自定义日志格式化
  const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.align(),
    winston.format.printf(
      (i: { level: string; timestamp?: any; message: any }) =>
        `[${[i.timestamp]}] ${i.level}: ${i.message}`
    )
  )

  // DailyRotateFile 配置
  const dailyRotateFileOptions = {
    format: customFormat,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    frequency: '1m'
  }

  // 创建日志记录器
  const logger = winston.createLogger({
    format: customFormat,
    transports: [
      new DailyRotateFile({
        filename: join(logsPath, 'info-%DATE%.log'),
        level: 'info',
        ...dailyRotateFileOptions
      }),
      new DailyRotateFile({
        filename: join(logsPath, 'error-%DATE%.log'),
        level: 'error',
        ...dailyRotateFileOptions
      })
    ],
    exitOnError: false,
    exceptionHandlers: [
      new DailyRotateFile({
        filename: join(logsPath, 'exceptions-%DATE%.log'),
        level: 'error',
        ...dailyRotateFileOptions
      })
    ]
  })

  // 非生产环境，增加控制台输出
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console())
  }

  // 接收渲染进程日志记录请求
  ipcMain.on('log', (_event, logEntry: LogEntry) => {
    logger.log(logEntry)
  })

  // 返回给主进程使用
  return logger
}
