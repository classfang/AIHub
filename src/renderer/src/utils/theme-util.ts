export const customThemeKeys = [
  '--color-bg-1',
  '--red-1',
  '--red-2',
  '--red-3',
  '--red-4',
  '--red-5',
  '--red-6',
  '--red-7',
  '--red-8',
  '--red-9',
  '--red-10',
  '--orangered-1',
  '--orangered-2',
  '--orangered-3',
  '--orangered-4',
  '--orangered-5',
  '--orangered-6',
  '--orangered-7',
  '--orangered-8',
  '--orangered-9',
  '--orangered-10',
  '--orange-1',
  '--orange-2',
  '--orange-3',
  '--orange-4',
  '--orange-5',
  '--orange-6',
  '--orange-7',
  '--orange-8',
  '--orange-9',
  '--orange-10',
  '--gold-1',
  '--gold-2',
  '--gold-3',
  '--gold-4',
  '--gold-5',
  '--gold-6',
  '--gold-7',
  '--gold-8',
  '--gold-9',
  '--gold-10',
  '--yellow-1',
  '--yellow-2',
  '--yellow-3',
  '--yellow-4',
  '--yellow-5',
  '--yellow-6',
  '--yellow-7',
  '--yellow-8',
  '--yellow-9',
  '--yellow-10',
  '--lime-1',
  '--lime-2',
  '--lime-3',
  '--lime-4',
  '--lime-5',
  '--lime-6',
  '--lime-7',
  '--lime-8',
  '--lime-9',
  '--lime-10',
  '--green-1',
  '--green-2',
  '--green-3',
  '--green-4',
  '--green-5',
  '--green-6',
  '--green-7',
  '--green-8',
  '--green-9',
  '--green-10',
  '--cyan-1',
  '--cyan-2',
  '--cyan-3',
  '--cyan-4',
  '--cyan-5',
  '--cyan-6',
  '--cyan-7',
  '--cyan-8',
  '--cyan-9',
  '--cyan-10',
  '--blue-1',
  '--blue-2',
  '--blue-3',
  '--blue-4',
  '--blue-5',
  '--blue-6',
  '--blue-7',
  '--blue-8',
  '--blue-9',
  '--blue-10',
  '--arcoblue-1',
  '--arcoblue-2',
  '--arcoblue-3',
  '--arcoblue-4',
  '--arcoblue-5',
  '--arcoblue-6',
  '--arcoblue-7',
  '--arcoblue-8',
  '--arcoblue-9',
  '--arcoblue-10',
  '--purple-1',
  '--purple-2',
  '--purple-3',
  '--purple-4',
  '--purple-5',
  '--purple-6',
  '--purple-7',
  '--purple-8',
  '--purple-9',
  '--purple-10',
  '--pinkpurple-1',
  '--pinkpurple-2',
  '--pinkpurple-3',
  '--pinkpurple-4',
  '--pinkpurple-5',
  '--pinkpurple-6',
  '--pinkpurple-7',
  '--pinkpurple-8',
  '--pinkpurple-9',
  '--pinkpurple-10',
  '--magenta-1',
  '--magenta-2',
  '--magenta-3',
  '--magenta-4',
  '--magenta-5',
  '--magenta-6',
  '--magenta-7',
  '--magenta-8',
  '--magenta-9',
  '--magenta-10',
  '--gray-1',
  '--gray-2',
  '--gray-3',
  '--gray-4',
  '--gray-5',
  '--gray-6',
  '--gray-7',
  '--gray-8',
  '--gray-9',
  '--gray-10'
]

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
  customThemeKeys.forEach((key) => {
    const value = customThemeMap[key]
    if (value) {
      document.body.style.setProperty(key, value)
    }
  })
}

export const setDefaultTheme = () => {
  customThemeKeys.forEach((key) => document.body.style.removeProperty(key))
}
