<script setup lang="ts">
defineProps<{
  title: string
  description: string
  actionLabel?: string
}>()

const emit = defineEmits<{
  action: []
}>()

function handleAction(): void {
  emit('action')
}
</script>

<template>
  <section class="shared-empty-state">
    <div class="shared-empty-state__copy">
      <h3 class="shared-empty-state__title">{{ title }}</h3>
      <p class="shared-empty-state__description">{{ description }}</p>
    </div>

    <button
      v-if="actionLabel"
      class="page-shell__action"
      type="button"
      @click="handleAction"
    >
      {{ actionLabel }}
    </button>
  </section>
</template>

<style scoped>
</style>
