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

const app = createApp(App)
app.use(ArcoVue)
app.use(ArcoVueIcon)
app.use(store)
app.use(i18n)
app.mount('#app')
