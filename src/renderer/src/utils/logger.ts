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
    window.electron.ipcRenderer.send('log', {
      level: 'info',
      message: conversionMessage(...message)
    })
  }

  public static warn(...message: any[]) {
    window.electron.ipcRenderer.send('log', {
      level: 'warn',
      message: conversionMessage(...message)
    })
  }

  public static error(...message: any[]) {
    window.electron.ipcRenderer.send('log', {
      level: 'error',
      message: conversionMessage(...message)
    })
  }
}
