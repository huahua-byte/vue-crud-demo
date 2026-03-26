<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { createDefaultBookingFilter, type Booking } from '../domain/booking'
import { cancelBooking, getBookings } from '../services/booking'
import { useToast } from '../composables/useToast'
import { SharedConfirmDialog, SharedEmptyState, SharedFeedbackMessage, SharedPanel } from '../components/shared'

const pageTitle = '预约列表'
const bookings = ref<Booking[]>([])
const selectedDate = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const bookingPendingCancelId = ref<string | null>(null)
const isCancelling = ref(false)
const router = useRouter()
const { showError, showSuccess } = useToast()

const statusMessage = computed(() => {
  if (isLoading.value) {
    return '正在加载预约...'
  }

  return `共 ${bookings.value.length} 条预约`
})

const isFilteredEmpty = computed(() => selectedDate.value !== '' && bookings.value.length === 0)
const isDefaultEmpty = computed(() => selectedDate.value === '' && bookings.value.length === 0)

async function loadBookings(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  const result = await getBookings({
    ...createDefaultBookingFilter(),
    dateFrom: selectedDate.value || null,
    dateTo: selectedDate.value || null,
  })

  if (!result.ok || result.data === undefined) {
    bookings.value = []
    errorMessage.value = result.message ?? '加载预约列表失败。'
    isLoading.value = false
    return
  }

  bookings.value = result.data
  isLoading.value = false
}

async function clearDateFilter(): Promise<void> {
  selectedDate.value = ''
  await loadBookings()
}

function requestCancelBooking(bookingId: string): void {
  bookingPendingCancelId.value = bookingId
}

function closeCancelDialog(): void {
  if (isCancelling.value) {
    return
  }

  bookingPendingCancelId.value = null
}

async function confirmCancelBooking(bookingId: string): Promise<void> {
  isCancelling.value = true

  const result = await cancelBooking(bookingId)

  if (!result.ok) {
    showError(result.message ?? '取消预约失败。')
    isCancelling.value = false
    return
  }

  showSuccess('预约已取消。')
  bookingPendingCancelId.value = null
  isCancelling.value = false
  await loadBookings()
}

onMounted(async () => {
  await loadBookings()
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
        支持按日期查看全部预约，并在取消后立即同步列表状态、周历占用和本地存储。
      </p>
    </header>

    <SharedPanel
      title="预约记录"
      description="保留场地名称快照、时间和联系人信息，方便追溯已取消预约。"
      tone="table"
    >
      <div class="shared-list">
        <div class="shared-list__filters">
          <label class="shared-list__filter-field">
            <span class="shared-list__detail-label">预约日期</span>
            <input v-model="selectedDate" class="shared-control" type="date" @change="loadBookings" />
          </label>
          <button
            class="shared-button shared-button--secondary"
            type="button"
            :disabled="selectedDate === '' || isLoading"
            @click="clearDateFilter"
          >
            清空筛选
          </button>
        </div>

        <p class="page-shell__metric">{{ statusMessage }}</p>

        <SharedFeedbackMessage
          v-if="errorMessage"
          variant="error"
          title="加载失败"
          :message="errorMessage"
        />
        <p v-else class="shared-list__meta">取消预约不会删除记录，列表刷新后仍会保留原始关键信息与取消状态。</p>

        <SharedEmptyState
          v-if="!isLoading && isDefaultEmpty"
          title="暂无预约记录"
          description="当前还没有预约数据，可先创建一条预约再返回查看列表。"
          action-label="去创建预约"
          @action="router.push('/bookings/new')"
        />

        <SharedEmptyState
          v-else-if="!isLoading && isFilteredEmpty"
          title="所选日期暂无预约"
          description="请切换其他日期，或清空筛选后查看全部预约记录。"
          action-label="清空筛选"
          @action="clearDateFilter"
        />

        <div v-else-if="bookings.length > 0" class="shared-list__items">
          <article v-for="booking in bookings" :key="booking.id" class="shared-list__item">
            <div class="shared-list__item-header">
              <div>
                <h3 class="shared-list__item-title">{{ booking.title }}</h3>
                <p class="shared-list__item-subtitle">
                  {{ booking.venueNameSnapshot }} · {{ booking.date }} {{ booking.startTime }}-{{ booking.endTime }}
                </p>
              </div>

              <div class="shared-list__actions">
                <span
                  class="booking-list-page__status"
                  :class="`booking-list-page__status--${booking.status}`"
                >
                  {{ booking.status === 'cancelled' ? '已取消' : '已确认' }}
                </span>
                <button
                  class="shared-button shared-button--danger"
                  type="button"
                  :disabled="booking.status === 'cancelled'"
                  @click="requestCancelBooking(booking.id)"
                >
                  {{ booking.status === 'cancelled' ? '已取消' : '取消预约' }}
                </button>
              </div>
            </div>

            <div class="shared-list__detail-grid">
              <div class="shared-list__detail">
                <span class="shared-list__detail-label">场地名称</span>
                <span class="shared-list__detail-value">{{ booking.venueNameSnapshot }}</span>
              </div>
              <div class="shared-list__detail">
                <span class="shared-list__detail-label">联系人</span>
                <span class="shared-list__detail-value">{{ booking.contactName }} / {{ booking.contactPhone }}</span>
              </div>
              <div class="shared-list__detail">
                <span class="shared-list__detail-label">参会人数</span>
                <span class="shared-list__detail-value">{{ booking.attendeeCount }} 人</span>
              </div>
              <div class="shared-list__detail">
                <span class="shared-list__detail-label">记录状态</span>
                <span class="shared-list__detail-value">{{ booking.status === 'cancelled' ? '已取消' : '有效预约' }}</span>
              </div>
            </div>

            <p v-if="booking.notes" class="shared-list__item-description">{{ booking.notes }}</p>
          </article>
        </div>
      </div>
    </SharedPanel>

    <SharedConfirmDialog
      :open="bookingPendingCancelId !== null"
      title="取消预约"
      message="取消后会释放原时间段，但仍保留预约记录和联系人信息，确认继续吗？"
      confirm-label="确认取消"
      confirm-variant="danger"
      :pending="isCancelling"
      @cancel="closeCancelDialog"
      @confirm="bookingPendingCancelId && confirmCancelBooking(bookingPendingCancelId)"
    />
  </section>
</template>

<style scoped>
.shared-list__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  align-items: end;
}

.shared-list__filter-field {
  display: grid;
  gap: var(--spacing-sm);
  min-width: min(100%, 240px);
}

.booking-list-page__status {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0.35rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 999px;
  background: rgba(74, 144, 217, 0.14);
  color: var(--color-primary);
}

.booking-list-page__status--cancelled {
  background: rgba(231, 76, 60, 0.12);
  color: var(--color-danger);
}
</style>
