<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { createDefaultVenueSearchFilter, type Venue } from '../domain/booking'
import { getVenues } from '../services/booking'

const venues = ref<Venue[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

async function loadVenues(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  const result = await getVenues(createDefaultVenueSearchFilter())

  if (!result.ok || result.data === undefined) {
    venues.value = []
    errorMessage.value = result.message ?? '加载场地列表失败。'
    isLoading.value = false
    return
  }

  venues.value = result.data
  isLoading.value = false
}

onMounted(async () => {
  await loadVenues()
})
</script>

<template>
  <section class="page-shell">
    <header class="page-shell__header">
      <div>
        <p class="page-shell__eyebrow">场地管理</p>
        <h2 class="page-shell__title">预约系统场地库</h2>
      </div>
      <p class="page-shell__description">
        当前已接入场地数据读取链路，后续可在这里扩展筛选、增删改与状态管理。
      </p>
    </header>

    <div class="page-shell__panel">
      <p class="page-shell__metric">{{ isLoading ? '正在加载场地...' : `共 ${venues.length} 个场地` }}</p>
      <p v-if="errorMessage" class="page-shell__feedback page-shell__feedback--error">{{ errorMessage }}</p>
      <p v-else class="page-shell__feedback">页面骨架已就绪，后续业务可直接复用现有 `getVenues()` 服务。</p>
    </div>
  </section>
</template>

<style scoped>
</style>
