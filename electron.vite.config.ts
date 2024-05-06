import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    publicDir: 'resources',
    build: {
      rollupOptions: {
        output: {
          format: 'es'
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue({
        template: {
          compilerOptions: {
            // webview是electron原生组件，在此声明避免vue警告
            isCustomElement: (tag) => tag === 'webview'
          }
        }
      }),
      visualizer()
    ]
  }
})
