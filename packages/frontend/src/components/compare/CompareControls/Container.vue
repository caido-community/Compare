<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";

import { type DiffMode } from "@/core/diff";

defineOptions({ name: "CompareControls" });

const { canCompare } = defineProps<{ canCompare: boolean }>();

const ignoreWhitespace = defineModel<boolean>("ignoreWhitespace", {
  required: true,
});
const ignoreCase = defineModel<boolean>("ignoreCase", { required: true });

const emit = defineEmits<{ compare: [mode: DiffMode] }>();

type ModeButton = {
  mode: DiffMode;
  label: string;
  icon: string;
  isPrimary: boolean;
};

const MODES: ReadonlyArray<ModeButton> = [
  {
    mode: "words",
    label: "Compare Words",
    icon: "fas fa-spell-check",
    isPrimary: true,
  },
  {
    mode: "bytes",
    label: "Compare Bytes",
    icon: "fas fa-code",
    isPrimary: false,
  },
  {
    mode: "lines",
    label: "Compare Lines",
    icon: "fas fa-align-left",
    isPrimary: false,
  },
];
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-4 py-3">
    <Button
      v-for="entry in MODES"
      :key="entry.mode"
      :label="entry.label"
      :icon="entry.icon"
      :severity="entry.isPrimary ? undefined : 'secondary'"
      :disabled="!canCompare"
      class="min-w-32"
      @click="emit('compare', entry.mode)"
    />
    <label class="flex items-center gap-2 text-sm">
      <Checkbox v-model="ignoreWhitespace" binary />
      Ignore whitespace
    </label>
    <label class="flex items-center gap-2 text-sm">
      <Checkbox v-model="ignoreCase" binary />
      Ignore case
    </label>
  </div>
</template>
