<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { createDefaultBookingFilter, type Booking } from '../domain/booking'
import { getBookings } from '../services/booking'

const bookings = ref<Booking[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

async function loadBookings(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  const result = await getBookings(createDefaultBookingFilter())

  if (!result.ok || result.data === undefined) {
    bookings.value = []
    errorMessage.value = result.message ?? '加载预约列表失败。'
    isLoading.value = false
    return
  }

  bookings.value = result.data
  isLoading.value = false
}

onMounted(async () => {
  await loadBookings()
})
</script>

<template>
  <section class="page-shell">
    <header class="page-shell__header">
      <div>
        <p class="page-shell__eyebrow">预约列表</p>
        <h2 class="page-shell__title">全部预约概览</h2>
      </div>
      <p class="page-shell__description">
        当前页面已经打通预约列表查询，后续可叠加筛选器、批量操作和详情抽屉。
      </p>
    </header>

    <div class="page-shell__panel">
      <p class="page-shell__metric">{{ isLoading ? '正在加载预约...' : `共 ${bookings.length} 条预约` }}</p>
      <p v-if="errorMessage" class="page-shell__feedback page-shell__feedback--error">{{ errorMessage }}</p>
      <p v-else class="page-shell__feedback">页面切换后可验证 Router 出口和预约数据读取均正常。</p>
    </div>
  </section>
</template>

<style scoped>
</style>
