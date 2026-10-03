<script setup lang="ts">
defineOptions({ name: "DocsCallout" });
</script>

<template>
  <div
    class="mt-6 space-y-3 rounded border border-surface-700 bg-surface-800 p-4 text-sm"
  >
    <slot />
  </div>
</template>
