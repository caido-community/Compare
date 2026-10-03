<script setup lang="ts">
import { type SectionId, SECTIONS } from "./content";

defineOptions({ name: "DocsSection" });

const { id } = defineProps<{ id: SectionId }>();

const title = SECTIONS.find((section) => section.id === id)?.title;
</script>

<template>
  <section :data-section="id" class="leading-relaxed text-surface-300">
    <h2 class="mb-4 text-2xl font-semibold text-surface-0">{{ title }}</h2>
    <slot />
  </section>
</template>
