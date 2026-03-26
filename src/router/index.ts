import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import BookingCalendarPage from '../pages/BookingCalendarPage.vue'
import BookingCreatePage from '../pages/BookingCreatePage.vue'
import BookingListPage from '../pages/BookingListPage.vue'
import VenueManagementPage from '../pages/VenueManagementPage.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/venues',
  },
  {
    path: '/venues',
    name: 'venues',
    component: VenueManagementPage,
  },
  {
    path: '/bookings/new',
    name: 'booking-create',
    component: BookingCreatePage,
  },
  {
    path: '/calendar',
    name: 'booking-calendar',
    component: BookingCalendarPage,
  },
  {
    path: '/bookings',
    name: 'booking-list',
    component: BookingListPage,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/venues',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
