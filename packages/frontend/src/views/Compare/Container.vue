<script setup lang="ts">
import { CompareControls } from "@/components/CompareControls";
import { DiffDialog } from "@/components/DiffDialog";
import { ItemPanel } from "@/components/ItemPanel";
import { useCompareStore } from "@/stores/compare";

defineOptions({ name: "ComparePage" });

const compareStore = useCompareStore();
</script>

<template>
  <div class="h-full flex flex-col gap-1.5">
    <div class="flex-1 min-h-0 flex gap-1.5">
      <div class="w-1/2 min-w-0">
        <ItemPanel panel="original" />
      </div>
      <div class="w-1/2 min-w-0">
        <ItemPanel panel="modified" />
      </div>
    </div>
    <CompareControls
      v-model:ignore-whitespace="compareStore.options.ignoreWhitespace"
      v-model:ignore-case="compareStore.options.ignoreCase"
      :can-compare="compareStore.canCompare"
      :is-comparing="compareStore.isComparing"
      @compare="compareStore.compare"
      @cancel="compareStore.cancel"
    />
    <DiffDialog :view="compareStore.diffView" @close="compareStore.close" />
  </div>
</template>
