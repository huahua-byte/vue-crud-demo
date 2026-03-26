<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'

const route = useRoute()

const navigationItems = [
  {
    label: '场地管理',
    to: '/venues',
    description: '维护场地基础信息与可用状态',
  },
  {
    label: '新建预约',
    to: '/bookings/new',
    description: '创建新的预约草稿与提交入口',
  },
  {
    label: '预约周历',
    to: '/calendar',
    description: '查看一周内的场地预约排布',
  },
  {
    label: '预约列表',
    to: '/bookings',
    description: '浏览全部预约记录与后续筛选结果',
  },
] as const

const currentPage = computed(() => {
  return navigationItems.find((item) => isRouteActive(item.to)) ?? navigationItems[0]
})

function isRouteActive(targetPath: string): boolean {
  return route.path === targetPath
}
</script>

<template>
  <div class="app-shell">
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
        :class="{ 'app-shell__nav-link--active': isRouteActive(item.to) }"
      >
        <span class="app-shell__nav-label">{{ item.label }}</span>
        <span class="app-shell__nav-description">{{ item.description }}</span>
      </RouterLink>
    </nav>

    <main class="app-shell__content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  gap: var(--spacing-lg);
  min-width: 0;
}

.app-shell__hero {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
  gap: var(--spacing-lg);
  padding: clamp(1.25rem, 2vw, 2rem);
  background:
    linear-gradient(140deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.84)),
    radial-gradient(circle at top left, rgba(74, 144, 217, 0.16), transparent 38%);
  border: 1px solid rgba(220, 223, 230, 0.9);
  border-radius: calc(var(--radius) * 2);
  box-shadow: 0 22px 45px rgba(44, 62, 80, 0.08);
}

.app-shell__hero-main,
.app-shell__hero-side {
  min-width: 0;
}

.app-shell__eyebrow {
  margin-bottom: var(--spacing-sm);
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.app-shell__title {
  font-size: clamp(2.2rem, 5vw, 4rem);
  line-height: 0.94;
}

.app-shell__subtitle {
  max-width: 40rem;
  margin-top: var(--spacing-md);
  color: var(--color-text-muted);
  font-size: 1.02rem;
}

.app-shell__hero-side {
  display: grid;
  align-content: start;
  gap: 0.35rem;
  padding: 1.25rem;
  background: rgba(245, 247, 250, 0.9);
  border: 1px solid rgba(220, 223, 230, 0.95);
  border-radius: calc(var(--radius) * 1.5);
}

.app-shell__hero-label {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.app-shell__hero-value {
  font-size: 1.35rem;
  font-weight: 700;
}

.app-shell__hero-description {
  color: var(--color-text-muted);
}

.app-shell__nav {
  display: flex;
  gap: var(--spacing-md);
  min-width: 0;
  padding-bottom: 0.25rem;
  overflow-x: auto;
  scrollbar-width: thin;
}

.app-shell__nav-link {
  flex: 0 0 240px;
  min-width: 0;
  padding: 1rem 1.1rem;
  color: inherit;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--color-border);
  border-radius: calc(var(--radius) * 1.5);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.app-shell__nav-link:hover {
  transform: translateY(-1px);
  border-color: rgba(74, 144, 217, 0.5);
  box-shadow: 0 14px 24px rgba(44, 62, 80, 0.08);
}

.app-shell__nav-link--active {
  border-color: rgba(74, 144, 217, 0.85);
  background: linear-gradient(180deg, rgba(74, 144, 217, 0.14), rgba(255, 255, 255, 0.96));
  box-shadow: 0 16px 28px rgba(74, 144, 217, 0.14);
}

.app-shell__nav-label,
.app-shell__nav-description {
  display: block;
}

.app-shell__nav-label {
  font-weight: 700;
}

.app-shell__nav-description {
  margin-top: 0.35rem;
  color: var(--color-text-muted);
  font-size: 0.92rem;
}

.app-shell__content {
  min-width: 0;
}

@media (max-width: 640px) {
  .app-shell__hero {
    grid-template-columns: 1fr;
  }

  .app-shell__nav-link {
    flex-basis: min(85vw, 280px);
  }
}
</style>
