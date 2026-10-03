<script setup lang="ts">
import Tag from "primevue/tag";
import { type ItemKind } from "shared";

defineOptions({ name: "ItemKindTag" });

const { kind } = defineProps<{ kind: ItemKind }>();

const KIND_CLASSES: Record<ItemKind, string> = {
  request: "bg-violet-700/60 text-violet-200 border-violet-700/40",
  response: "bg-teal-700/60 text-teal-200 border-teal-700/40",
  file: "bg-sky-700/60 text-sky-200 border-sky-700/40",
  clipboard: "bg-pink-700/60 text-pink-200 border-pink-700/40",
};
</script>

<template>
  <Tag
    :value="kind"
    class="inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-xs"
    :class="KIND_CLASSES[kind]"
  />
</template>
