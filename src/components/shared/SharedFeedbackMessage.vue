<script setup lang="ts">
defineProps<{
  variant: 'error' | 'success' | 'info'
  message: string
  title?: string
}>()
</script>

<template>
  <article class="shared-feedback" :class="`shared-feedback--${variant}`" role="status">
    <p v-if="title" class="shared-feedback__title">{{ title }}</p>
    <p class="shared-feedback__message">{{ message }}</p>
  </article>
</template>

<style scoped>
</style>
