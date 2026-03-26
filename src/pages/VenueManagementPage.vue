<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { createDefaultVenueSearchFilter, type Venue } from '../domain/booking'
import { deleteVenue, getVenues } from '../services/booking'
import { useToast } from '../composables/useToast'
import { SharedConfirmDialog, SharedEmptyState, SharedFeedbackMessage, SharedPanel } from '../components/shared'

const pageTitle = '场地管理'
const venues = ref<Venue[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const venuePendingDeleteId = ref<string | null>(null)
const isDeleting = ref(false)
const { showError, showSuccess } = useToast()

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

function requestDeleteVenue(venueId: string): void {
  venuePendingDeleteId.value = venueId
}

function closeDeleteDialog(): void {
  if (isDeleting.value) {
    return
  }

  venuePendingDeleteId.value = null
}

async function confirmDeleteVenue(venueId: string): Promise<void> {
  isDeleting.value = true

  const result = await deleteVenue(venueId)

  if (!result.ok) {
    showError(result.message ?? '删除场地失败。')
    isDeleting.value = false
    return
  }

  showSuccess('场地已删除。')
  venuePendingDeleteId.value = null
  isDeleting.value = false
  await loadVenues()
}

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
        场地页与预约页共用同一套卡片容器、空状态和确认删除反馈结构。
      </p>
    </header>

    <SharedPanel
      title="场地列表"
      description="场地管理页复用统一容器、空态和危险操作确认弹窗。"
      tone="table"
    >
      <div class="shared-list">
        <p class="page-shell__metric">{{ isLoading ? '正在加载场地...' : `共 ${venues.length} 个场地` }}</p>

        <SharedFeedbackMessage
          v-if="errorMessage"
          variant="error"
          title="加载失败"
          :message="errorMessage"
        />
        <p v-else class="shared-list__meta">删除受未来预约保护，失败时直接展示 store 返回的业务提示。</p>

        <SharedEmptyState
          v-if="!isLoading && venues.length === 0"
          title="暂无场地数据"
          description="请先补充场地基础信息，预约创建页会直接复用这些场地选项。"
          action-label="重新加载"
          @action="loadVenues"
        />

        <div v-else-if="venues.length > 0" class="shared-list__items">
          <article v-for="venue in venues" :key="venue.id" class="shared-list__item">
            <div class="shared-list__item-header">
              <div>
                <h3 class="shared-list__item-title">{{ venue.name }}</h3>
                <p class="shared-list__item-subtitle">{{ venue.location }} / {{ venue.status }}</p>
              </div>

              <div class="shared-list__actions">
                <button class="shared-button shared-button--danger" type="button" @click="requestDeleteVenue(venue.id)">
                  删除场地
                </button>
              </div>
            </div>

            <div class="shared-list__detail-grid">
              <div class="shared-list__detail">
                <span class="shared-list__detail-label">容纳人数</span>
                <span class="shared-list__detail-value">{{ venue.capacity }} 人</span>
              </div>
              <div class="shared-list__detail">
                <span class="shared-list__detail-label">开放时间</span>
                <span class="shared-list__detail-value">{{ venue.openingTime }}-{{ venue.closingTime }}</span>
              </div>
              <div class="shared-list__detail">
                <span class="shared-list__detail-label">设施</span>
                <span class="shared-list__detail-value">{{ venue.amenities.join(' / ') || '未配置' }}</span>
              </div>
            </div>

            <p v-if="venue.description" class="shared-list__item-description">{{ venue.description }}</p>
          </article>
        </div>
      </div>
    </SharedPanel>

    <SharedConfirmDialog
      :open="venuePendingDeleteId !== null"
      title="删除场地"
      message="若该场地仍有关联的未来预约，系统会阻止删除。确认继续吗？"
      confirm-label="确认删除"
      confirm-variant="danger"
      :pending="isDeleting"
      @cancel="closeDeleteDialog"
      @confirm="venuePendingDeleteId && confirmDeleteVenue(venuePendingDeleteId)"
    />
  </section>
</template>

<style scoped>
</style>
