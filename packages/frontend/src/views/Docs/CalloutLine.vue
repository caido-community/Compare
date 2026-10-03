<script setup lang="ts">
defineOptions({ name: "DocsCalloutLine" });

const { icon } = defineProps<{ icon: string }>();
</script>

<template>
  <p>
    <i :class="[icon, 'mr-2 text-blue-400']" />
    <slot />
  </p>
</template>
