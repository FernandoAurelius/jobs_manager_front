import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './plugins/axios'
import './plugins/ag-grid'

import './polyfills'
import { NativeEventSource, EventSourcePolyfill } from 'event-source-polyfill'

const Impl = NativeEventSource || EventSourcePolyfill

declare global {
  interface Window {
    EventSource: typeof EventSource
  }
}
window.EventSource = Impl as unknown as typeof EventSource

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
