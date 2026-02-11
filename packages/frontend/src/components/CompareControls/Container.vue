<script setup lang="ts">
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import { computed } from "vue";

import type { CompareOptions, PanelState } from "@/types";

type Props = {
  panel1State: PanelState;
  panel2State: PanelState;
  comparisonInProgress: boolean;
  compareOptions: CompareOptions;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:compareOptions": [value: CompareOptions];
  compareWords: [];
  compareBytes: [];
  compareLines: [];
}>();

const canCompare = computed(() => {
  return (
    !props.comparisonInProgress &&
    props.panel1State.items.length > 0 &&
    props.panel2State.items.length > 0 &&
    props.panel1State.selectedItems.length === 1 &&
    props.panel2State.selectedItems.length === 1
  );
});

const ignoreWhitespace = computed({
  get: () => props.compareOptions.ignoreWhitespace === true,
  set: (v: boolean) =>
    emit("update:compareOptions", {
      ...props.compareOptions,
      ignoreWhitespace: v,
    }),
});

const ignoreCase = computed({
  get: () => props.compareOptions.ignoreCase === true,
  set: (v: boolean) =>
    emit("update:compareOptions", {
      ...props.compareOptions,
      ignoreCase: v,
    }),
});

const handleCompareWords = () => emit("compareWords");
const handleCompareBytes = () => emit("compareBytes");
const handleCompareLines = () => emit("compareLines");
</script>

<template>
  <div class="py-3">
    <div class="flex flex-wrap items-center justify-center gap-4">
      <Button
        label="Compare Words"
        icon="fas fa-spell-check"
        :disabled="!canCompare"
        class="min-w-32"
        @click="handleCompareWords"
      />
      <Button
        label="Compare Bytes"
        icon="fas fa-code"
        :disabled="!canCompare"
        severity="secondary"
        class="min-w-32"
        @click="handleCompareBytes"
      />
      <Button
        label="Compare Lines"
        icon="fas fa-align-left"
        :disabled="!canCompare"
        severity="secondary"
        class="min-w-32"
        @click="handleCompareLines"
      />
      <div class="flex items-center gap-2 text-sm">
        <Checkbox
          id="compare-ignore-whitespace"
          v-model="ignoreWhitespace"
          :binary="true"
          :disabled="!canCompare"
        />
        <label for="compare-ignore-whitespace">Ignore whitespace</label>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <Checkbox
          id="compare-ignore-case"
          v-model="ignoreCase"
          :binary="true"
          :disabled="!canCompare"
        />
        <label for="compare-ignore-case">Ignore case</label>
      </div>
    </div>
  </div>
</template>
