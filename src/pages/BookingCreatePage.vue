<script setup lang="ts">
import { reactive, ref } from 'vue'

import type { BookingDraft } from '../domain/booking'
import { createBooking } from '../services/booking'

const draft = reactive<BookingDraft>(createInitialDraft())
const isSubmitting = ref(false)
const statusMessage = ref('表单骨架已创建，后续可在这里挂接字段组件与校验提示。')

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

  const result = await createBooking(currentDraft)

  statusMessage.value = result.ok ? '预约草稿提交成功。' : result.message ?? '预约提交失败。'
  isSubmitting.value = false
}
</script>

<template>
  <section class="page-shell">
    <header class="page-shell__header">
      <div>
        <p class="page-shell__eyebrow">预约创建</p>
        <h2 class="page-shell__title">新建预约入口</h2>
      </div>
      <p class="page-shell__description">
        这里保留了预约草稿结构和提交方法签名，后续表单开发可以直接填充字段绑定。
      </p>
    </header>

    <div class="page-shell__panel">
      <div class="page-shell__stack">
        <p class="page-shell__metric">默认草稿参会人数：{{ draft.attendeeCount }}</p>
        <p class="page-shell__feedback">{{ statusMessage }}</p>
      </div>
      <button class="page-shell__action" type="button" :disabled="isSubmitting" @click="submitBooking(draft)">
        {{ isSubmitting ? '提交中...' : '验证提交链路' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
</style>
