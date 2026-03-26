<script setup lang="ts">
defineProps<{
  label: string
  forId: string
  error?: string
  hint?: string
  required?: boolean
}>()
</script>

<template>
  <div class="shared-field">
    <div class="shared-field__header">
      <label class="shared-field__label" :for="forId">
        {{ label }}
        <span v-if="required" class="shared-field__required" aria-hidden="true">*</span>
      </label>
      <p v-if="hint" class="shared-field__hint">{{ hint }}</p>
    </div>

    <div class="shared-field__control">
      <slot />
    </div>

    <p v-if="error" class="shared-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
</style>
