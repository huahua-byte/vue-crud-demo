<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { createDefaultBookingFilter, type Booking } from '../domain/booking'
import { deleteBooking, getBookings } from '../services/booking'
import { useToast } from '../composables/useToast'
import { SharedConfirmDialog, SharedEmptyState, SharedFeedbackMessage, SharedPanel } from '../components/shared'

const pageTitle = '预约列表'
const bookings = ref<Booking[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const bookingPendingDeleteId = ref<string | null>(null)
const isDeleting = ref(false)
const router = useRouter()
const { showError, showSuccess } = useToast()

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

function requestDeleteBooking(bookingId: string): void {
  bookingPendingDeleteId.value = bookingId
}

function closeDeleteDialog(): void {
  if (isDeleting.value) {
    return
  }

  bookingPendingDeleteId.value = null
}

async function confirmDeleteBooking(bookingId: string): Promise<void> {
  isDeleting.value = true

  const result = await deleteBooking(bookingId)

  if (!result.ok) {
    showError(result.message ?? '删除预约失败。')
    isDeleting.value = false
    return
  }

  showSuccess('预约已删除。')
  bookingPendingDeleteId.value = null
  isDeleting.value = false
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
        列表容器、空状态和删除确认统一复用 shared-ui，后续叠加筛选时不需要重复铺基础结构。
      </p>
    </header>

    <SharedPanel
      title="预约记录"
      description="统一的列表卡片、状态反馈和删除确认交互。"
      tone="table"
    >
      <div class="shared-list">
        <p class="page-shell__metric">{{ isLoading ? '正在加载预约...' : `共 ${bookings.length} 条预约` }}</p>

        <SharedFeedbackMessage
          v-if="errorMessage"
          variant="error"
          title="加载失败"
          :message="errorMessage"
        />
        <p v-else class="shared-list__meta">页面切换后可直接验证 Router 出口、预约数据读取和删除反馈。</p>

        <SharedEmptyState
          v-if="!isLoading && bookings.length === 0"
          title="暂无预约记录"
          description="当前还没有预约数据，可先创建一条预约再返回查看列表。"
          action-label="去创建预约"
          @action="router.push('/bookings/new')"
        />

        <div v-else-if="bookings.length > 0" class="shared-list__items">
          <article v-for="booking in bookings" :key="booking.id" class="shared-list__item">
            <div class="shared-list__item-header">
              <div>
                <h3 class="shared-list__item-title">{{ booking.title }}</h3>
                <p class="shared-list__item-subtitle">
                  {{ booking.date }} {{ booking.startTime }}-{{ booking.endTime }}
                </p>
              </div>

              <div class="shared-list__actions">
                <button class="shared-button shared-button--danger" type="button" @click="requestDeleteBooking(booking.id)">
                  删除预约
                </button>
              </div>
            </div>

            <div class="shared-list__detail-grid">
              <div class="shared-list__detail">
                <span class="shared-list__detail-label">场地编号</span>
                <span class="shared-list__detail-value">{{ booking.venueId }}</span>
              </div>
              <div class="shared-list__detail">
                <span class="shared-list__detail-label">联系人</span>
                <span class="shared-list__detail-value">{{ booking.contactName }} / {{ booking.contactPhone }}</span>
              </div>
              <div class="shared-list__detail">
                <span class="shared-list__detail-label">参会人数</span>
                <span class="shared-list__detail-value">{{ booking.attendeeCount }} 人</span>
              </div>
            </div>

            <p v-if="booking.notes" class="shared-list__item-description">{{ booking.notes }}</p>
          </article>
        </div>
      </div>
    </SharedPanel>

    <SharedConfirmDialog
      :open="bookingPendingDeleteId !== null"
      title="删除预约"
      message="删除后无法恢复，确认要移除这条预约记录吗？"
      confirm-label="确认删除"
      confirm-variant="danger"
      :pending="isDeleting"
      @cancel="closeDeleteDialog"
      @confirm="bookingPendingDeleteId && confirmDeleteBooking(bookingPendingDeleteId)"
    />
  </section>
</template>

<style scoped>
</style>
