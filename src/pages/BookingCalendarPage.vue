<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import {
  BUSINESS_HOUR_END,
  DEFAULT_WEEK_VIEW_DAYS,
  createDefaultWeeklyCalendarQuery,
  getBusinessHourSlots,
  type Venue,
  type WeeklyCalendarCell,
  type WeeklyCalendarQuery,
  type WeeklyCalendarResult,
} from '../domain/booking'
import { getVenues, getWeeklyCalendar } from '../services/booking'
import { SharedEmptyState, SharedFeedbackMessage, SharedPanel } from '../components/shared'
import { useBookingStore } from '../stores/useBookingStore'

const pageTitle = '预约周历'
const today = new Date().toISOString().slice(0, 10)
const businessHourSlots = getBusinessHourSlots()
const store = useBookingStore()
const venues = ref<Venue[]>([])
const selectedVenueId = ref('')
const weekDate = ref(today)
const calendar = ref<WeeklyCalendarResult | null>(null)
const isLoadingVenues = ref(false)
const isLoadingCalendar = ref(false)
const errorMessage = ref('')

const selectedVenue = computed<Venue | null>(() => venues.value.find((venue) => venue.id === selectedVenueId.value) ?? null)
const calendarRows = computed<{ time: string; label: string; cells: Array<WeeklyCalendarCell | null> }[]>(() => {
  if (calendar.value === null) {
    return []
  }

  return businessHourSlots.map((time, index) => ({
    time,
    label: `${time}-${businessHourSlots[index + 1] ?? BUSINESS_HOUR_END}`,
    cells: calendar.value!.dates.map(
      (date) =>
        calendar.value!.cells.find(
          (cell) => cell.date === date && cell.time === time && cell.venueId === selectedVenueId.value,
        ) ?? null,
    ),
  }))
})
const isCompleteWeek = computed(() => calendar.value?.dates.length === DEFAULT_WEEK_VIEW_DAYS)
const panelMetric = computed(() => {
  if (isLoadingVenues.value) {
    return '正在加载场地...'
  }

  if (isLoadingCalendar.value) {
    return '正在同步周历...'
  }

  if (selectedVenue.value === null) {
    return '暂无可展示场地'
  }

  return `${selectedVenue.value.name} · ${selectedVenue.value.openingTime}-${selectedVenue.value.closingTime}`
})

async function loadVenues(): Promise<void> {
  isLoadingVenues.value = true
  errorMessage.value = ''

  const result = await getVenues()

  if (!result.ok || result.data === undefined) {
    venues.value = []
    selectedVenueId.value = ''
    errorMessage.value = result.message ?? '加载场地列表失败。'
    isLoadingVenues.value = false
    return
  }

  venues.value = result.data

  if (venues.value.length === 0) {
    selectedVenueId.value = ''
  } else if (!venues.value.some((venue) => venue.id === selectedVenueId.value)) {
    selectedVenueId.value = venues.value[0]?.id ?? ''
  }

  isLoadingVenues.value = false
}

async function loadCalendar(query: WeeklyCalendarQuery): Promise<void> {
  if (query.venueId === null || query.venueId === '') {
    calendar.value = null
    return
  }

  isLoadingCalendar.value = true
  errorMessage.value = ''

  const result = await getWeeklyCalendar(query)

  if (!result.ok || result.data === undefined) {
    calendar.value = null
    errorMessage.value = result.message ?? '加载预约周历失败。'
    isLoadingCalendar.value = false
    return
  }

  calendar.value = result.data
  isLoadingCalendar.value = false
}

function getCellState(cell: WeeklyCalendarCell | null): 'occupied' | 'available' | 'closed' {
  if (cell === null || !cell.isBusinessHour) {
    return 'closed'
  }

  return cell.bookingId === null ? 'available' : 'occupied'
}

function getCellLabel(cell: WeeklyCalendarCell | null): string {
  const state = getCellState(cell)

  if (state === 'closed') {
    return '非营业'
  }

  if (state === 'occupied') {
    return '已预约'
  }

  return '空闲'
}

watch(
  () => store.venues.value,
  async () => {
    await loadVenues()
  },
)

watch(
  [selectedVenueId, weekDate, () => store.bookings.value, () => store.venues.value],
  async ([venueId, date]) => {
    if (venueId === '') {
      calendar.value = null
      return
    }

    await loadCalendar(createDefaultWeeklyCalendarQuery(date, venueId))
  },
)

onMounted(async () => {
  await loadVenues()
})
</script>

<template>
  <section class="booking-page-shell page-shell">
    <header class="booking-page-header page-shell__header">
      <div class="booking-page-title">
        <p class="page-shell__eyebrow">{{ pageTitle }}</p>
        <h2 class="page-shell__title">{{ pageTitle }}</h2>
      </div>
      <p class="page-shell__description">
        默认展示指定场地一周 {{ DEFAULT_WEEK_VIEW_DAYS }} 天、每日 08:00-22:00 的占用栅格，切换场地或预约变更后即时同步。
      </p>
    </header>

    <SharedPanel
      title="周历总览"
      description="按场地查看一周预约占用情况，已预约与非营业时段均会明确区分。"
      tone="table"
    >
      <div class="booking-calendar">
        <div class="booking-calendar__toolbar">
          <label class="booking-calendar__field">
            <span class="booking-calendar__field-label">场地</span>
            <select v-model="selectedVenueId" class="booking-calendar__select" :disabled="isLoadingVenues || venues.length === 0">
              <option value="" disabled>请选择场地</option>
              <option v-for="venue in venues" :key="venue.id" :value="venue.id">
                {{ venue.name }}
              </option>
            </select>
          </label>

          <label class="booking-calendar__field">
            <span class="booking-calendar__field-label">参考日期</span>
            <input v-model="weekDate" class="booking-calendar__input" type="date" />
          </label>
        </div>

        <p class="page-shell__metric">{{ panelMetric }}</p>

        <SharedFeedbackMessage
          v-if="errorMessage"
          variant="error"
          title="加载失败"
          :message="errorMessage"
        />
        <SharedFeedbackMessage
          v-else-if="selectedVenue !== null && !isCompleteWeek"
          variant="info"
          title="周历数据待补齐"
          message="当前返回数据未覆盖完整 7 天，请检查周历派生逻辑。"
        />
        <p v-else-if="selectedVenue !== null" class="booking-calendar__hint">
          已预约时段不可再次选择；非营业时段会单独置灰显示。
        </p>

        <SharedEmptyState
          v-if="!isLoadingVenues && venues.length === 0"
          title="暂无可展示场地"
          description="请先在场地管理中维护至少一个可用场地，再返回查看周历。"
        />

        <div v-else-if="calendar !== null" class="booking-calendar__scroller">
          <table class="booking-calendar__table">
            <thead>
              <tr>
                <th class="booking-calendar__head booking-calendar__head--time" scope="col">时段</th>
                <th
                  v-for="date in calendar.dates"
                  :key="date"
                  class="booking-calendar__head"
                  scope="col"
                >
                  <span class="booking-calendar__date">{{ date }}</span>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="row in calendarRows" :key="row.time">
                <th class="booking-calendar__time" scope="row">{{ row.label }}</th>
                <td
                  v-for="cell in row.cells"
                  :key="`${cell?.date ?? 'unknown'}-${row.time}`"
                  class="booking-calendar__cell"
                  :class="`booking-calendar__cell--${getCellState(cell)}`"
                  :aria-disabled="getCellState(cell) !== 'available'"
                >
                  <span class="booking-calendar__cell-label">{{ getCellLabel(cell) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </SharedPanel>
  </section>
</template>

<style scoped>
.booking-calendar {
  display: grid;
  gap: var(--spacing-md);
  min-width: 0;
}

.booking-calendar__toolbar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 240px));
  gap: var(--spacing-md);
}

.booking-calendar__field {
  display: grid;
  gap: 0.4rem;
}

.booking-calendar__field-label {
  color: var(--color-text-muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.booking-calendar__select,
.booking-calendar__input {
  width: 100%;
  min-width: 0;
  padding: 0.7rem 0.85rem;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
}

.booking-calendar__hint {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.booking-calendar__scroller {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}

.booking-calendar__table {
  width: 100%;
  min-width: 880px;
  border-collapse: separate;
  border-spacing: 0;
}

.booking-calendar__head,
.booking-calendar__time,
.booking-calendar__cell {
  padding: 0.85rem 0.75rem;
  text-align: center;
  border-right: 1px solid rgba(220, 223, 230, 0.8);
  border-bottom: 1px solid rgba(220, 223, 230, 0.8);
}

.booking-calendar__head {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(245, 247, 250, 0.96);
  font-weight: 700;
}

.booking-calendar__head--time,
.booking-calendar__time {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 126px;
  text-align: left;
  background: rgba(255, 255, 255, 0.98);
}

.booking-calendar__head--time {
  z-index: 3;
  background: rgba(245, 247, 250, 0.98);
}

.booking-calendar__date {
  display: inline-block;
  min-width: 88px;
}

.booking-calendar__cell {
  min-width: 108px;
  background: rgba(255, 255, 255, 0.9);
}

.booking-calendar__cell-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 600;
}

.booking-calendar__cell--available .booking-calendar__cell-label {
  color: #155724;
  background: rgba(39, 174, 96, 0.16);
}

.booking-calendar__cell--occupied {
  background: rgba(127, 140, 141, 0.14);
}

.booking-calendar__cell--occupied .booking-calendar__cell-label {
  color: #4d5b63;
  background: rgba(127, 140, 141, 0.18);
}

.booking-calendar__cell--closed {
  background: rgba(44, 62, 80, 0.06);
}

.booking-calendar__cell--closed .booking-calendar__cell-label {
  color: var(--color-text-muted);
  background: rgba(127, 140, 141, 0.12);
}

@media (max-width: 768px) {
  .booking-calendar__toolbar {
    grid-template-columns: 1fr;
  }

  .booking-calendar__table {
    min-width: 760px;
  }
}
</style>
