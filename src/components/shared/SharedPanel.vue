<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
    tone?: 'default' | 'table' | 'form'
  }>(),
  {
    title: '',
    description: '',
    tone: 'default',
  },
)
</script>

<template>
  <section class="shared-panel page-shell__panel" :class="`shared-panel--${tone}`">
    <header v-if="title || description" class="shared-panel__header">
      <h3 v-if="title" class="shared-panel__title">{{ title }}</h3>
      <p v-if="description" class="shared-panel__description">{{ description }}</p>
    </header>

    <slot />
  </section>
</template>

<style scoped>
</style>
