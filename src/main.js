import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { ensureBookingStorageSeeded } from './domain/booking'

ensureBookingStorageSeeded()
createApp(App).mount('#app')
