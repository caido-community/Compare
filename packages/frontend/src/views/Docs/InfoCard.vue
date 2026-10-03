<script setup lang="ts">
defineOptions({ name: "DocsInfoCard" });

const { title, titleClass = "text-surface-0" } = defineProps<{
  title: string;
  titleClass?: string;
}>();
</script>

<template>
  <div class="rounded border border-surface-700 p-4">
    <h3 class="mb-3 text-lg font-semibold" :class="titleClass">{{ title }}</h3>
    <slot />
  </div>
</template>
