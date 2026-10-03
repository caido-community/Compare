<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";

import {
  DIFF_MODE_DETAILS,
  DIFF_OPTION_LABELS,
  PRIMARY_DIFF_MODE,
} from "@/components/common/diffPresentation";
import { DIFF_MODES, type DiffMode } from "@/core/diff";

defineOptions({ name: "CompareControls" });

const { canCompare, isComparing } = defineProps<{
  canCompare: boolean;
  isComparing: boolean;
}>();

const ignoreWhitespace = defineModel<boolean>("ignoreWhitespace", {
  required: true,
});
const ignoreCase = defineModel<boolean>("ignoreCase", { required: true });

const emit = defineEmits<{ compare: [mode: DiffMode]; cancel: [] }>();
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-4 py-3">
    <Button
      v-for="mode in DIFF_MODES"
      :key="mode"
      :label="DIFF_MODE_DETAILS[mode].buttonLabel"
      :icon="DIFF_MODE_DETAILS[mode].icon"
      :severity="mode === PRIMARY_DIFF_MODE ? undefined : 'secondary'"
      :disabled="!canCompare"
      class="min-w-32"
      @click="emit('compare', mode)"
    />
    <div v-if="isComparing" class="flex items-center gap-2 text-sm">
      <i class="fas fa-circle-notch fa-spin" />
      <span>Comparing</span>
      <Button
        label="Cancel"
        size="small"
        severity="secondary"
        outlined
        @click="emit('cancel')"
      />
    </div>
    <label class="flex items-center gap-2 text-sm">
      <Checkbox v-model="ignoreWhitespace" binary />
      {{ DIFF_OPTION_LABELS.ignoreWhitespace }}
    </label>
    <label class="flex items-center gap-2 text-sm">
      <Checkbox v-model="ignoreCase" binary />
      {{ DIFF_OPTION_LABELS.ignoreCase }}
    </label>
  </div>
</template>
