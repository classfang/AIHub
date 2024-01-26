import { createApp } from 'vue'
import App from './App.vue'

// ArcoDesign
import ArcoVue from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import '@arco-design/web-vue/dist/arco.css'

// Pinia
import store from './store'

// i18n
import i18n from './i18n'

// codemirror-editor-vue3
import { InstallCodemirro } from 'codemirror-editor-vue3'

const app = createApp(App)
app.use(ArcoVue)
app.use(ArcoVueIcon)
app.use(store)
app.use(i18n)
app.use(InstallCodemirro)
app.mount('#app')
