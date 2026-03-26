<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { getBusinessHourSlots, type BookingDraft, type BookingFieldErrors, type Venue } from '../domain/booking'
import { createBooking, getVenues } from '../services/booking'
import { SharedFeedbackMessage, SharedFormField, SharedPanel, mapBookingValidationToMessages } from '../components/shared'

const pageTitle = '创建预约'
const draft = reactive<BookingDraft>(createInitialDraft())
const venues = ref<Venue[]>([])
const isLoadingVenues = ref(false)
const isSubmitting = ref(false)
const fieldErrors = ref<BookingFieldErrors>({})
const generalErrors = ref<string[]>([])
const successMessage = ref('')
const loadErrorMessage = ref('')
const statusMessage = computed(() => {
  if (isLoadingVenues.value) {
    return '正在加载场地选项...'
  }

  if (venues.value.length === 0) {
    return '暂无可用场地，请先在场地管理中维护基础数据。'
  }

  return `当前可选场地：${venues.value.length} 个`
})

const businessHourSlots = getBusinessHourSlots()

function createInitialDraft(): BookingDraft {
  return {
    venueId: '',
    title: '',
    contactName: '',
    contactPhone: '',
    date: '',
    startTime: '',
    endTime: '',
    attendeeCount: 1,
    notes: '',
  }
}

async function submitBooking(currentDraft: BookingDraft): Promise<void> {
  isSubmitting.value = true
  fieldErrors.value = {}
  generalErrors.value = []
  successMessage.value = ''

  const result = await createBooking(currentDraft)

  if (result.ok) {
    successMessage.value = '预约草稿提交成功。'
    Object.assign(draft, createInitialDraft())
    isSubmitting.value = false
    return
  }

  const validationMessages = mapBookingValidationToMessages(result.validation)

  fieldErrors.value = validationMessages.fieldErrors
  generalErrors.value = validationMessages.generalErrors

  if (validationMessages.generalErrors.length === 0 && result.message) {
    generalErrors.value = [result.message]
  }

  isSubmitting.value = false
}

async function loadVenueOptions(): Promise<void> {
  isLoadingVenues.value = true
  loadErrorMessage.value = ''

  const result = await getVenues()

  if (!result.ok || result.data === undefined) {
    venues.value = []
    loadErrorMessage.value = result.message ?? '加载场地列表失败。'
    isLoadingVenues.value = false
    return
  }

  venues.value = result.data
  isLoadingVenues.value = false
}

onMounted(async () => {
  await loadVenueOptions()
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
        统一复用表单字段容器、校验提示和提交反馈，避免预约页重复实现基础输入结构。
      </p>
    </header>

    <SharedPanel
      title="预约表单"
      description="字段容器、说明文案和错误反馈均通过 shared-ui 统一输出。"
      tone="form"
    >
      <div class="page-shell__stack">
        <p class="page-shell__metric">{{ statusMessage }}</p>
        <p v-if="loadErrorMessage" class="page-shell__feedback page-shell__feedback--error">{{ loadErrorMessage }}</p>
      </div>

      <div v-if="generalErrors.length > 0" class="shared-feedback-list">
        <SharedFeedbackMessage
          v-for="message in generalErrors"
          :key="message"
          variant="error"
          title="提交失败"
          :message="message"
        />
      </div>

      <SharedFeedbackMessage
        v-if="successMessage"
        variant="success"
        title="提交成功"
        :message="successMessage"
      />

      <form class="shared-form" @submit.prevent="submitBooking(draft)">
        <div class="shared-form__grid">
          <SharedFormField
            label="预约场地"
            for-id="booking-venue"
            hint="先选择已维护的场地，再填写时段与联系人信息。"
            :required="true"
            :error="fieldErrors.venueId"
          >
            <select
              id="booking-venue"
              v-model="draft.venueId"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.venueId }"
            >
              <option value="">请选择场地</option>
              <option v-for="venue in venues" :key="venue.id" :value="venue.id">
                {{ venue.name }} / 容量 {{ venue.capacity }}
              </option>
            </select>
          </SharedFormField>

          <SharedFormField
            label="预约标题"
            for-id="booking-title"
            hint="建议使用会议、培训或活动主题，方便后续识别。"
            :required="true"
            :error="fieldErrors.title"
          >
            <input
              id="booking-title"
              v-model.trim="draft.title"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.title }"
              type="text"
              placeholder="例如：产品周会"
            />
          </SharedFormField>

          <SharedFormField
            label="联系人"
            for-id="booking-contact-name"
            :required="true"
            :error="fieldErrors.contactName"
          >
            <input
              id="booking-contact-name"
              v-model.trim="draft.contactName"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.contactName }"
              type="text"
              placeholder="请输入联系人姓名"
            />
          </SharedFormField>

          <SharedFormField
            label="联系电话"
            for-id="booking-contact-phone"
            hint="仅支持 11 位手机号。"
            :required="true"
            :error="fieldErrors.contactPhone"
          >
            <input
              id="booking-contact-phone"
              v-model.trim="draft.contactPhone"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.contactPhone }"
              type="tel"
              inputmode="numeric"
              placeholder="13800000000"
            />
          </SharedFormField>

          <SharedFormField label="预约日期" for-id="booking-date" :required="true" :error="fieldErrors.date">
            <input
              id="booking-date"
              v-model="draft.date"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.date }"
              type="date"
            />
          </SharedFormField>

          <SharedFormField
            label="参会人数"
            for-id="booking-attendee-count"
            hint="需为大于 0 的整数。"
            :required="true"
            :error="fieldErrors.attendeeCount"
          >
            <input
              id="booking-attendee-count"
              v-model.number="draft.attendeeCount"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.attendeeCount }"
              type="number"
              min="1"
              step="1"
            />
          </SharedFormField>

          <SharedFormField
            label="开始时间"
            for-id="booking-start-time"
            hint="仅支持 08:00-22:00 的整点时段。"
            :required="true"
            :error="fieldErrors.startTime"
          >
            <select
              id="booking-start-time"
              v-model="draft.startTime"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.startTime }"
            >
              <option value="">请选择开始时间</option>
              <option v-for="slot in businessHourSlots" :key="`start-${slot}`" :value="slot">
                {{ slot }}
              </option>
            </select>
          </SharedFormField>

          <SharedFormField
            label="结束时间"
            for-id="booking-end-time"
            hint="结束时间需晚于开始时间。"
            :required="true"
            :error="fieldErrors.endTime"
          >
            <select
              id="booking-end-time"
              v-model="draft.endTime"
              class="shared-control"
              :class="{ 'shared-control--error': fieldErrors.endTime }"
            >
              <option value="">请选择结束时间</option>
              <option v-for="slot in [...businessHourSlots, '22:00']" :key="`end-${slot}`" :value="slot">
                {{ slot }}
              </option>
            </select>
          </SharedFormField>
        </div>

        <SharedFormField
          label="备注"
          for-id="booking-notes"
          hint="用于记录设备、布场或特殊接待要求。"
          :error="fieldErrors.notes"
        >
          <textarea
            id="booking-notes"
            v-model.trim="draft.notes"
            class="shared-textarea"
            :class="{ 'shared-textarea--error': fieldErrors.notes }"
            placeholder="例如：需要无线麦克风和投影"
          />
        </SharedFormField>

        <div class="shared-form__actions">
          <button class="page-shell__action" type="submit" :disabled="isSubmitting || isLoadingVenues">
            {{ isSubmitting ? '提交中...' : '创建预约' }}
          </button>
        </div>
      </form>
    </SharedPanel>
  </section>
</template>

<style scoped>
</style>
