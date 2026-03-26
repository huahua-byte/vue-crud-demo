import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { ensureBookingStorageSeeded } from './domain/booking'
import router from './router'

ensureBookingStorageSeeded()
createApp(App).use(router).mount('#app')
