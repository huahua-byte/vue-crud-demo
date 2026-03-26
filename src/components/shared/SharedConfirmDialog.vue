<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    confirmVariant?: 'danger' | 'primary'
    pending?: boolean
  }>(),
  {
    confirmLabel: '确认',
    cancelLabel: '取消',
    confirmVariant: 'primary',
    pending: false,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function handleConfirm(): void {
  emit('confirm')
}

function handleCancel(): void {
  emit('cancel')
}

const dialogTitleId = computed(() => `shared-dialog-title-${props.confirmVariant}`)
</script>

<template>
  <div v-if="props.open" class="shared-dialog" role="presentation">
    <div class="shared-dialog__backdrop" @click="handleCancel" />
    <section
      class="shared-dialog__panel"
      role="alertdialog"
      aria-modal="true"
      :aria-busy="props.pending"
      :aria-labelledby="dialogTitleId"
    >
      <div class="shared-dialog__content">
        <h3 :id="dialogTitleId" class="shared-dialog__title">{{ props.title }}</h3>
        <p class="shared-dialog__message">{{ props.message }}</p>
      </div>

      <div class="shared-dialog__actions">
        <button
          class="shared-dialog__button shared-dialog__button--secondary"
          type="button"
          :disabled="props.pending"
          @click="handleCancel"
        >
          {{ props.cancelLabel }}
        </button>
        <button
          class="shared-dialog__button"
          :class="`shared-dialog__button--${props.confirmVariant}`"
          type="button"
          :disabled="props.pending"
          @click="handleConfirm"
        >
          {{ props.pending ? '处理中...' : props.confirmLabel }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
</style>
