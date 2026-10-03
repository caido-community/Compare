<script setup lang="ts">
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";

import { type DiffView, useForm } from "./useForm";

import { formatLength } from "@/components/common/itemFormat";
import { PANEL_TITLES } from "@/core/panels";
import { PLUGIN_ICON } from "@/core/plugin";

defineOptions({ name: "DiffDialog" });

const { view } = defineProps<{ view: DiffView | undefined }>();

const emit = defineEmits<{ close: [] }>();

const form = useForm(() => view);
</script>

<template>
  <Dialog
    :visible="view !== undefined"
    modal
    :draggable="false"
    :style="{ width: '90vw', maxWidth: '1400px', minWidth: '800px' }"
    @update:visible="emit('close')"
  >
    <template #header>
      <div class="flex items-center gap-3 text-lg font-semibold">
        <i :class="[PLUGIN_ICON, 'text-primary']" />
        <span v-if="view">
          Comparison Results: {{ form.modeDetails[view.result.mode].title }}
        </span>
      </div>
    </template>

    <div v-if="view" class="flex flex-col gap-3">
      <div
        v-for="notice in form.notices.value"
        :key="notice"
        class="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
      >
        <i class="fas fa-circle-info" />
        {{ notice }}
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div
          v-for="panel in form.panels"
          :key="panel"
          class="border border-surface-700 rounded-lg overflow-hidden"
        >
          <div
            class="flex items-center gap-2 bg-surface-800 px-3 py-2 border-b border-surface-700 text-sm"
          >
            <span class="shrink-0 font-semibold">{{
              PANEL_TITLES[panel]
            }}</span>
            <span class="shrink-0 text-surface-400">#{{ view[panel].id }}</span>
            <span
              class="shrink-0 rounded-sm bg-surface-700 px-2 py-0.5 font-mono text-xs"
            >
              {{ formatLength(view[panel]) }}
            </span>
            <span
              class="min-w-0 truncate text-xs text-surface-400"
              :title="view[panel].source"
            >
              {{ view[panel].source }}
            </span>
          </div>
          <div
            :ref="form.scrollAreaRefs[panel]"
            class="h-[60vh] overflow-auto [scrollbar-color:auto] [scrollbar-gutter:stable] [scrollbar-width:auto] bg-surface-900 font-mono text-xs"
            :style="{ tabSize: form.tabSize }"
            @scroll="form.syncScroll(panel)"
          >
            <div
              class="relative"
              :style="{
                height: `${form.totalHeight.value}px`,
                minWidth: form.isWrapped.value
                  ? undefined
                  : form.contentWidths.value[panel],
              }"
            >
              <div
                class="absolute left-0 top-0 min-w-full"
                :class="form.isWrapped.value ? 'w-full' : 'w-max'"
                :style="{
                  transform: `translateY(${form.windows.value[panel].offset}px)`,
                }"
              >
                <div
                  v-for="entry in form.windows.value[panel].entries"
                  :key="entry.index"
                  data-row
                  class="flex overflow-hidden"
                  :class="form.rowClass(entry.row, panel)"
                  :style="{
                    height: `${entry.height}px`,
                    lineHeight: `${form.lineHeight}px`,
                  }"
                >
                  <span
                    class="box-border shrink-0 select-none pr-3 text-right text-surface-500"
                    :style="{ width: `${form.gutterWidth}px` }"
                    >{{ entry.row[panel]?.lineNumber }}</span
                  >
                  <span
                    class="min-w-0 flex-1 select-text"
                    :class="
                      form.isWrapped.value
                        ? 'whitespace-pre-wrap break-all'
                        : 'whitespace-pre'
                    "
                    ><span
                      v-for="(segment, index) in entry.row[panel]?.segments ??
                      []"
                      :key="index"
                      :class="form.segmentClass(segment, entry.row)"
                      >{{ segment.text }}</span
                    ></span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-4 pt-3">
        <div v-if="view" class="flex gap-4 text-xs">
          <span
            v-for="kind in form.changeKinds"
            :key="kind"
            class="flex items-center gap-1"
          >
            <span
              class="w-3 h-3 rounded-sm"
              :class="form.changeDetails[kind].chipClass"
            />
            {{ form.formatCount(kind) }}
          </span>
        </div>
        <div class="flex items-center gap-4 text-sm font-medium">
          <label class="flex items-center gap-2">
            <Checkbox v-model="form.isWrapped.value" binary />
            Wrap lines
          </label>
          <label class="flex items-center gap-2">
            <Checkbox v-model="form.isSynced.value" binary />
            Sync Views
          </label>
        </div>
      </div>
    </template>
  </Dialog>
</template>
