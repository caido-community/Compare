<script setup lang="ts">
import Dialog from "primevue/dialog";
import { PANELS } from "shared";

import { type DiffView, useForm } from "./useForm";

import { LabeledCheckbox } from "@/components/common/LabeledCheckbox";
import { ROW_KINDS } from "@/core/diff";
import {
  CHANGE_DETAILS,
  DIFF_MODE_DETAILS,
  VIEW_OPTION_LABELS,
} from "@/presentation/diff";
import { formatLength } from "@/presentation/format";
import { PANEL_TITLES } from "@/presentation/panels";
import { INFO_ICON, PLUGIN_ICON } from "@/presentation/plugin";

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
    class="w-[90vw] min-w-[800px] max-w-[1400px]"
    @update:visible="emit('close')"
  >
    <template #header>
      <div class="flex items-center gap-3 text-lg font-semibold">
        <i :class="[PLUGIN_ICON, 'text-primary']" />
        <span v-if="view">
          Comparison Results: {{ DIFF_MODE_DETAILS[view.result.mode].title }}
        </span>
      </div>
    </template>

    <div v-if="view" class="flex flex-col gap-3">
      <div
        v-for="notice in form.notices.value"
        :key="notice"
        class="flex items-center gap-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
      >
        <i :class="INFO_ICON" />
        {{ notice }}
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div
          v-for="panel in PANELS"
          :key="panel"
          class="border border-surface-700 rounded-lg overflow-hidden"
        >
          <div
            class="flex items-center gap-2 bg-surface-800 px-3 py-2 border-b border-surface-700 text-sm"
          >
            <span class="shrink-0 font-semibold">
              {{ PANEL_TITLES[panel] }}
            </span>
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
            :style="form.paneStyle"
            @scroll="form.syncScroll(panel)"
          >
            <div class="relative" :style="form.contentStyle(panel)">
              <div
                class="absolute left-0 top-0 min-w-full"
                :class="form.wrapClasses.value.window"
                :style="form.windowStyle(panel)"
              >
                <div
                  v-for="entry in form.windows.value[panel].entries"
                  :key="entry.index"
                  data-row
                  class="flex overflow-hidden"
                  :class="form.rowClass(entry.row, panel)"
                  :style="form.rowStyle(entry)"
                >
                  <span
                    class="box-border shrink-0 select-none pr-3 text-right text-surface-500"
                    :style="form.gutterStyle"
                    >{{ entry.row[panel]?.lineNumber }}</span
                  >
                  <span
                    class="min-w-0 flex-1 select-text"
                    :class="form.wrapClasses.value.text"
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
            v-for="kind in ROW_KINDS"
            :key="kind"
            class="flex items-center gap-1"
          >
            <span
              class="w-3 h-3 rounded-sm"
              :class="CHANGE_DETAILS[kind].chipClass"
            />
            {{ form.formatCount(kind) }}
          </span>
        </div>
        <div class="flex items-center gap-4 font-medium">
          <LabeledCheckbox
            v-model="form.isWrapped.value"
            :label="VIEW_OPTION_LABELS.isWrapped"
          />
          <LabeledCheckbox
            v-model="form.isSynced.value"
            :label="VIEW_OPTION_LABELS.isSynced"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>
