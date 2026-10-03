<script setup lang="ts">
import Checkbox from "primevue/checkbox";

defineOptions({ name: "LabeledCheckbox" });

const { label } = defineProps<{ label: string }>();

const checked = defineModel<boolean>({ required: true });
</script>

<template>
  <label class="flex items-center gap-2 text-sm">
    <Checkbox v-model="checked" binary />
    {{ label }}
  </label>
</template>
