const conversionMessage = (...message: any[]) => {
  return message
    .map((m) => {
      if (typeof m === 'string') {
        return m
      } else {
        return JSON.stringify(m)
      }
    })
    .join(' ')
}

export class Logger {
  public static info(...message: any[]) {
    const messageStr = conversionMessage(...message)
    window.electron.ipcRenderer.send('log', {
      level: 'info',
      message: messageStr
    })
  }

  public static warn(...message: any[]) {
    const messageStr = conversionMessage(...message)
    window.electron.ipcRenderer.send('log', {
      level: 'warn',
      message: messageStr
    })
  }

  public static error(...message: any[]) {
    const messageStr = conversionMessage(...message)
    window.electron.ipcRenderer.send('log', {
      level: 'error',
      message: messageStr
    })
  }
}
