import App from './App.vue'
// i18n
import i18n from './i18n'
// Pinia
import store from './store'
// ArcoDesign
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
// codemirror-editor-vue3
import { InstallCodemirro } from 'codemirror-editor-vue3'
// vue3
import { createApp } from 'vue'

const app = createApp(App)
app.use(ArcoVue)
app.use(ArcoVueIcon)
app.use(store)
app.use(i18n)
app.use(InstallCodemirro)
app.mount('#app')
