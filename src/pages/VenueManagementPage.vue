<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import {
  createDefaultVenueSearchFilter,
  type Venue,
  type VenueDraft,
  type VenueFieldErrors,
} from '../domain/booking'
import { createVenue, deleteVenue, getVenues, updateVenue } from '../services/booking'
import { useToast } from '../composables/useToast'
import {
  SharedConfirmDialog,
  SharedEmptyState,
  SharedFeedbackMessage,
  SharedFormField,
  SharedPanel,
  mapValidationToMessages,
} from '../components/shared'
import { useBookingStore } from '../stores/useBookingStore'

const pageTitle = '场地管理'
const searchKeyword = ref('')
const draft = reactive<VenueDraft>(createInitialVenueDraft())
const venues = ref<Venue[]>([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const editingVenueId = ref<string | null>(null)
const fieldErrors = ref<VenueFieldErrors>({})
const generalErrors = ref<string[]>([])
const successMessage = ref('')
const venuePendingDeleteId = ref<string | null>(null)
const isDeleting = ref(false)
const { showError, showSuccess } = useToast()
const store = useBookingStore()

const statusMessage = computed(() => {
  if (isLoading.value) {
    return '正在加载场地...'
  }

  return `当前展示 ${venues.value.length} 个场地`
})

const formTitle = computed(() => (editingVenueId.value === null ? '新增场地' : '编辑场地'))
const formDescription = computed(() =>
  editingVenueId.value === null
    ? '录入场地基础信息后会立即出现在列表中，并持久化到本地存储。'
    : '修改场地信息后会立即同步列表，并保留原始创建时间。',
)
const submitLabel = computed(() => (editingVenueId.value === null ? '新增场地' : '保存修改'))

function createInitialVenueDraft(): VenueDraft {
  return {
    name: '',
    location: '',
    capacity: 1,
    hourlyPrice: 0,
    amenities: [],
    openingTime: '08:00',
    closingTime: '22:00',
    status: 'active',
    description: '',
  }
}

async function loadVenues(): Promise<void> {
  isLoading.value = true
  errorMessage.value = ''

  const result = await getVenues({
    ...createDefaultVenueSearchFilter(),
    keyword: searchKeyword.value,
  })

  if (!result.ok || result.data === undefined) {
    venues.value = []
    errorMessage.value = result.message ?? '加载场地列表失败。'
    isLoading.value = false
    return
  }

  venues.value = result.data
  isLoading.value = false
}

function resetVenueForm(): void {
  Object.assign(draft, createInitialVenueDraft())
  editingVenueId.value = null
  fieldErrors.value = {}
  generalErrors.value = []
  successMessage.value = ''
}

function startEditVenue(venue: Venue): void {
  Object.assign(draft, {
    name: venue.name,
    location: venue.location,
    capacity: venue.capacity,
    hourlyPrice: venue.hourlyPrice,
    amenities: [...venue.amenities],
    openingTime: venue.openingTime,
    closingTime: venue.closingTime,
    status: venue.status,
    description: venue.description,
  })
  editingVenueId.value = venue.id
  fieldErrors.value = {}
  generalErrors.value = []
  successMessage.value = ''
}

async function submitVenue(currentDraft: VenueDraft): Promise<void> {
  isSubmitting.value = true
  fieldErrors.value = {}
  generalErrors.value = []
  successMessage.value = ''

  const result =
    editingVenueId.value === null
      ? await createVenue(currentDraft)
      : await updateVenue(editingVenueId.value, currentDraft)

  if (result.ok) {
    const nextMessage = result.data?.name ? `场地“${result.data.name}”已保存。` : '场地信息已保存。'
    resetVenueForm()
    successMessage.value = nextMessage
    showSuccess(nextMessage)
    await loadVenues()
    isSubmitting.value = false
    return
  }

  const validationMessages = mapValidationToMessages(result.validation)

  fieldErrors.value = validationMessages.fieldErrors as VenueFieldErrors
  generalErrors.value = validationMessages.generalErrors

  if (validationMessages.generalErrors.length === 0 && result.message) {
    generalErrors.value = [result.message]
  }

  if (result.message) {
    showError(result.message)
  }

  isSubmitting.value = false
}

function requestDeleteVenue(venueId: string): void {
  venuePendingDeleteId.value = venueId
}

async function clearSearch(): Promise<void> {
  searchKeyword.value = ''
  await loadVenues()
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

watch(
  () => store.venues.value,
  async () => {
    await loadVenues()
  },
)

onMounted(async () => {
  store.reloadFromStorage()
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
        支持场地搜索、增删改查与删除保护提示，保存后列表立即刷新并保留到本地。
      </p>
    </header>

    <SharedPanel title="场地表单" :description="formDescription" tone="form">
      <div v-if="generalErrors.length > 0" class="shared-feedback-list">
        <SharedFeedbackMessage
          v-for="message in generalErrors"
          :key="message"
          variant="error"
          title="保存失败"
          :message="message"
        />
      </div>

      <SharedFeedbackMessage
        v-if="successMessage"
        variant="success"
        title="保存成功"
        :message="successMessage"
      />

      <form class="shared-form" @submit.prevent="submitVenue(draft)">
        <div class="shared-form__header">
          <p class="page-shell__metric">{{ formTitle }}</p>
        </div>

        <div class="shared-form__grid">
          <SharedFormField
            label="场地名称"
            for-id="venue-name"
            hint="列表搜索仅按场地名称关键字匹配。"
            :required="true"
            :error="fieldErrors.name"
          >
            <input
              id="venue-name"
              v-model.trim="draft.name"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.name }"
              type="text"
              placeholder="例如：主会场"
            />
          </SharedFormField>

          <SharedFormField label="场地位置" for-id="venue-location" :required="true" :error="fieldErrors.location">
            <input
              id="venue-location"
              v-model.trim="draft.location"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.location }"
              type="text"
              placeholder="例如：1F East Wing"
            />
          </SharedFormField>

          <SharedFormField
            label="容纳人数"
            for-id="venue-capacity"
            hint="需为大于 0 的整数。"
            :required="true"
            :error="fieldErrors.capacity"
          >
            <input
              id="venue-capacity"
              v-model.number="draft.capacity"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.capacity }"
              type="number"
              min="1"
              step="1"
            />
          </SharedFormField>

          <SharedFormField
            label="每小时价格"
            for-id="venue-hourly-price"
            hint="需为大于等于 0 的整数。"
            :required="true"
            :error="fieldErrors.hourlyPrice"
          >
            <input
              id="venue-hourly-price"
              v-model.number="draft.hourlyPrice"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.hourlyPrice }"
              type="number"
              min="0"
              step="1"
            />
          </SharedFormField>
        </div>

        <SharedFormField
          label="设施描述"
          for-id="venue-description"
          hint="用于描述设备、配套或场地特点。"
          :required="true"
          :error="fieldErrors.description"
        >
          <textarea
            id="venue-description"
            v-model.trim="draft.description"
            class="shared-control shared-control--textarea"
            :class="{ 'shared-control--error': fieldErrors.description }"
            rows="4"
            placeholder="例如：配备投影、音响、可移动桌椅。"
          />
        </SharedFormField>

        <div class="venue-management__form-actions">
          <button class="shared-button shared-button--primary" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? '保存中...' : submitLabel }}
          </button>
          <button class="shared-button shared-button--secondary" type="button" :disabled="isSubmitting" @click="resetVenueForm">
            {{ editingVenueId === null ? '重置表单' : '取消编辑' }}
          </button>
        </div>
      </form>
    </SharedPanel>

    <SharedPanel
      title="场地列表"
      description="支持按名称搜索；删除受未来预约保护，失败时直接展示业务提示。"
      tone="table"
    >
      <div class="shared-list">
        <div class="venue-management__toolbar">
          <SharedFormField label="按场地名称搜索" for-id="venue-search">
            <input
              id="venue-search"
              v-model.trim="searchKeyword"
              class="shared-control"
              type="search"
              placeholder="输入场地名称关键字"
              @input="loadVenues"
            />
          </SharedFormField>
          <p class="page-shell__metric">{{ statusMessage }}</p>
        </div>

        <SharedFeedbackMessage
          v-if="errorMessage"
          variant="error"
          title="加载失败"
          :message="errorMessage"
        />

        <SharedEmptyState
          v-else-if="!isLoading && venues.length === 0"
          title="暂无匹配场地"
          description="可调整搜索关键字，或先在上方新增场地。"
          action-label="清空搜索"
          @action="clearSearch"
        />

        <div v-else-if="venues.length > 0" class="shared-list__items">
          <article v-for="venue in venues" :key="venue.id" class="shared-list__item">
            <div class="shared-list__item-header">
              <div>
                <h3 class="shared-list__item-title">{{ venue.name }}</h3>
                <p class="shared-list__item-subtitle">{{ venue.location }} / {{ venue.status }}</p>
              </div>

              <div class="shared-list__actions">
                <button class="shared-button shared-button--secondary" type="button" @click="startEditVenue(venue)">
                  编辑场地
                </button>
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
                <span class="shared-list__detail-label">每小时价格</span>
                <span class="shared-list__detail-value">¥{{ venue.hourlyPrice }}</span>
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

            <p class="shared-list__item-description">{{ venue.description }}</p>
          </article>
        </div>
      </div>
    </SharedPanel>

    <SharedConfirmDialog
      :open="venuePendingDeleteId !== null"
      title="删除场地"
      message="若该场地仍有关联的未来预约，系统会阻止删除并提示先取消相关预约。确认继续吗？"
      confirm-label="确认删除"
      confirm-variant="danger"
      :pending="isDeleting"
      @cancel="closeDeleteDialog"
      @confirm="venuePendingDeleteId && confirmDeleteVenue(venuePendingDeleteId)"
    />
  </section>
</template>

<style scoped>
.venue-management__toolbar {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.venue-management__form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .venue-management__toolbar {
    align-items: end;
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
