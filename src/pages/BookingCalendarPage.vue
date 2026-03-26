<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import {
  DEFAULT_WEEK_VIEW_DAYS,
  createDefaultWeeklyCalendarQuery,
  type WeeklyCalendarQuery,
  type WeeklyCalendarResult,
} from '../domain/booking'
import { getWeeklyCalendar } from '../services/booking'

const today = new Date().toISOString().slice(0, 10)
const calendar = ref<WeeklyCalendarResult | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const isCompleteWeek = computed(() => calendar.value?.dates.length === DEFAULT_WEEK_VIEW_DAYS)

async function loadCalendar(query: WeeklyCalendarQuery): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  const result = await getWeeklyCalendar(query)

  if (!result.ok || result.data === undefined) {
    calendar.value = null
    errorMessage.value = result.message ?? '加载预约周历失败。'
    isLoading.value = false
    return
  }

  calendar.value = result.data
  isLoading.value = false
}

onMounted(async () => {
  await loadCalendar(createDefaultWeeklyCalendarQuery(today, null))
})
</script>

<template>
  <section class="page-shell">
    <header class="page-shell__header">
      <div>
        <p class="page-shell__eyebrow">预约周历</p>
        <h2 class="page-shell__title">周视图骨架</h2>
      </div>
      <p class="page-shell__description">
        默认按 {{ DEFAULT_WEEK_VIEW_DAYS }} 天窗口读取周历数据，后续可在此扩展时间轴、场地切换与冲突态展示。
      </p>
    </header>

    <div class="page-shell__panel">
      <p class="page-shell__metric">{{ isLoading ? '正在加载周历...' : `周起始日：${calendar?.weekStart ?? '--'}` }}</p>
      <p v-if="errorMessage" class="page-shell__feedback page-shell__feedback--error">{{ errorMessage }}</p>
      <p v-else class="page-shell__feedback">
        {{ isCompleteWeek ? '已返回完整 7 天日期数据。' : '周历数据尚未完整返回。' }}
      </p>
    </div>
  </section>
</template>

<style scoped>
</style>
