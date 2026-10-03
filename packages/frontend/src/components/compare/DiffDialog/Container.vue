<script setup lang="ts">
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";

import { type DiffView, useForm } from "./useForm";

import { PANEL_TITLES } from "@/core/panels";

defineOptions({ name: "DiffDialog" });

const { view } = defineProps<{ view: DiffView | undefined }>();

const emit = defineEmits<{ close: [] }>();

const form = useForm();
</script>

<template>
  <Dialog
    :visible="view !== undefined"
    modal
    :draggable="false"
    :style="{ width: '90vw', maxWidth: '1400px', minWidth: '800px' }"
    :pt="{ root: { class: 'max-h-[90vh] bg-surface-900' } }"
    @update:visible="emit('close')"
  >
    <template #header>
      <div class="flex items-center gap-3 text-lg font-semibold">
        <i class="fas fa-columns text-primary" />
        <span v-if="view">
          Comparison Results: {{ form.modeTitles[view.result.mode] }}
        </span>
      </div>
    </template>

    <div v-if="view" class="grid grid-cols-2 gap-4 px-4">
      <div
        v-for="side in form.panels"
        :key="side"
        class="border border-surface-700 rounded-lg overflow-hidden"
      >
        <div
          class="flex flex-wrap items-center gap-2 bg-surface-800 px-3 py-2 border-b border-surface-700 text-sm"
        >
          <span class="font-medium">
            {{ PANEL_TITLES[side] }} (ID: {{ view[side].id }})
          </span>
          <span class="px-2 py-0.5 rounded-sm bg-surface-600 text-xs">
            Length: {{ view[side].data.length }}
          </span>
          <span class="px-2 py-0.5 rounded-sm bg-surface-600 text-xs truncate">
            {{ view[side].source }}
          </span>
        </div>
        <div
          :ref="form.scrollAreaRefs[side]"
          class="min-h-[150px] max-h-[calc(90vh-15rem)] overflow-auto bg-surface-900 p-4 font-mono text-sm whitespace-pre-wrap break-words"
          @scroll="form.syncScroll(side)"
        >
          <span
            v-for="(segment, index) in view.result[side]"
            :key="index"
            :class="[
              form.segmentClass(segment.kind),
              view.result.mode === 'lines' ? 'block' : '',
            ]"
            >{{ segment.content }}</span
          >
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between pt-3">
        <div v-if="view" class="flex gap-4 text-xs">
          <span
            v-for="entry in form.legend"
            :key="entry.kind"
            class="flex items-center gap-1"
          >
            <span
              class="w-3 h-3 rounded-sm"
              :class="form.segmentClass(entry.kind)"
            />
            {{ entry.label }}: {{ view.result.summary[entry.kind] }}
          </span>
        </div>
        <label class="flex items-center gap-2 text-sm font-medium">
          <Checkbox v-model="form.isSynced.value" binary />
          Sync Views
        </label>
      </div>
    </template>
  </Dialog>
</template>
