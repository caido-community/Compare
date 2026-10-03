<script setup lang="ts">
import { useForm } from "./useForm";

import { CompareControls } from "@/components/compare/CompareControls";
import { DiffDialog } from "@/components/compare/DiffDialog";
import { ItemPanel } from "@/components/compare/ItemPanel";
import { type Services } from "@/services";

defineOptions({ name: "ComparePage" });

const { services } = defineProps<{ services: Services }>();

const form = useForm(services);
</script>

<template>
  <div class="h-full flex flex-col gap-1.5">
    <div class="flex-1 min-h-0 flex gap-1.5">
      <div class="w-1/2 min-w-0">
        <ItemPanel
          v-model:selected="form.originalSelection.value"
          panel="original"
          :services="services"
        />
      </div>
      <div class="w-1/2 min-w-0">
        <ItemPanel
          v-model:selected="form.modifiedSelection.value"
          panel="modified"
          :services="services"
        />
      </div>
    </div>
    <CompareControls
      v-model:ignore-whitespace="form.diffOptions.value.ignoreWhitespace"
      v-model:ignore-case="form.diffOptions.value.ignoreCase"
      :can-compare="form.canCompare.value"
      :is-comparing="form.isComparing.value"
      @compare="form.compare"
      @cancel="form.cancelCompare"
    />
    <DiffDialog :view="form.diffView.value" @close="form.closeDiff" />
  </div>
</template>
