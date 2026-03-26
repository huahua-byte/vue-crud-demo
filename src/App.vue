<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

import AppToast from './components/AppToast.vue'
import { useToast } from './composables/useToast'

const route = useRoute()
const { toasts, removeToast } = useToast()

const navigationItems: Array<{ to: string; label: string; routeName: string; description: string }> = [
  {
    routeName: 'venues',
    label: '场地管理',
    to: '/venues',
    description: '维护场地基础信息与可用状态',
  },
  {
    routeName: 'booking-create',
    label: '新建预约',
    to: '/bookings/new',
    description: '创建新的预约草稿与提交入口',
  },
  {
    routeName: 'booking-calendar',
    label: '预约周历',
    to: '/calendar',
    description: '查看一周内的场地预约排布',
  },
  {
    routeName: 'booking-list',
    label: '预约列表',
    to: '/bookings',
    description: '浏览全部预约记录与后续筛选结果',
  },
]

const currentPage = computed(() => {
  return (
    navigationItems.find((item) => isActivePath(route.path, item.to, route.name)) ??
    navigationItems[0]
  )
})

function isActivePath(currentPath: string, targetPath: string, currentRouteName?: string): boolean {
  const navigationItem = navigationItems.find((item) => item.to === targetPath)

  if (navigationItem?.routeName === currentRouteName) {
    return true
  }

  if (targetPath === '/bookings') {
    return currentPath === targetPath
  }

  return currentPath === targetPath
}
</script>

<template>
  <div class="app-shell">
    <div class="app-shell__container">
      <header class="app-shell__hero">
        <div class="app-shell__hero-main">
          <p class="app-shell__eyebrow">Booking Workspace</p>
          <h1 class="app-shell__title">预约系统应用壳</h1>
          <p class="app-shell__subtitle">
            顶层导航、默认入口与页面出口已统一到 Vue Router，后续业务页面可以在同一骨架中持续扩展。
          </p>
        </div>

        <div class="app-shell__hero-side">
          <p class="app-shell__hero-label">当前页面</p>
          <p class="app-shell__hero-value">{{ currentPage.label }}</p>
          <p class="app-shell__hero-description">{{ currentPage.description }}</p>
        </div>
      </header>

      <nav class="app-shell__nav" aria-label="核心导航">
        <RouterLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="app-shell__nav-link"
          :class="{ 'app-shell__nav-link--active': isActivePath(route.path, item.to, route.name) }"
        >
          <span class="app-shell__nav-label">{{ item.label }}</span>
          <span class="app-shell__nav-description">{{ item.description }}</span>
        </RouterLink>
      </nav>

      <main class="app-shell__content">
        <RouterView />
      </main>
    </div>

    <AppToast :toasts="toasts" @dismiss-toast="removeToast" />
  </div>
</template>

<style scoped>
</style>
