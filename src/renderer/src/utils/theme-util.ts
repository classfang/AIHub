export const defaultCustomThemeMap: Record<string, string> = {
  '--color-bg-1': '#FFFFFF',
  '--color-fill-1': '#F7F8FA',
  '--color-fill-2': '#F2F3F5',
  '--color-fill-3': '#E5E6EB',
  '--color-fill-4': '#C9CDD4',
  '--color-text-1': '#1D2129',
  '--color-text-2': '#4E5969',
  '--color-text-3': '#868C9C',
  '--color-border-1': '#F2F3F5',
  '--color-border-2': '#E5E6EB',
  '--color-border-3': '#C9CDD4',
  '--color-border-4': '#868C9C'
}

export const defaultFontSizeMap: Record<string, string> = {
  '--font-size-default': '14px',
  '--font-size-xxs': '11px',
  '--font-size-xs': '12px',
  '--font-size-sm': '13px',
  '--font-size-md': '15px',
  '--font-size-lg': '16px',
  '--font-size-xl': '18px',
  '--font-size-xxl': '24px',
  '--font-size-xxxl': '28px'
}

export const defaultFontSizeLevel = 3

export const startDarkThemeListener = () => {
  const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)')

  const handleColorSchemeChange = (e: any) => {
    if (e.matches) {
      document.body.setAttribute('arco-theme', 'dark')
    } else {
      document.body.removeAttribute('arco-theme')
    }
  }

  // 添加事件监听器
  darkThemeMq.addEventListener('change', handleColorSchemeChange)

  // 初始加载时执行一次以设置初始主题
  handleColorSchemeChange(darkThemeMq)

  // 添加移除事件监听的方法
  return () => {
    darkThemeMq.removeEventListener('change', handleColorSchemeChange)
  }
}

export const changeTheme = (isDark: boolean) => {
  if (isDark) {
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    document.body.removeAttribute('arco-theme')
  }
}

export const setCustomTheme = (customThemeMap: Record<string, string>) => {
  Object.keys(defaultCustomThemeMap).forEach((key) => {
    const value = customThemeMap[key]
    if (value) {
      document.body.style.setProperty(key, value)
    }
  })
}

export const setDefaultTheme = () => {
  Object.keys(defaultCustomThemeMap).forEach((key) => document.body.style.removeProperty(key))
}

export const setCustomFontSize = (level: number) => {
  Object.keys(defaultFontSizeMap).forEach((key) => {
    const value = Number(defaultFontSizeMap[key].replace('px', '')) + (level - defaultFontSizeLevel)
    document.body.style.setProperty(key, value + 'px')
  })
}
