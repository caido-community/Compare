<script setup lang="ts">
import Button from "primevue/button";
import Column from "primevue/column";
import ContextMenu from "primevue/contextmenu";
import DataTable from "primevue/datatable";
import Toolbar from "primevue/toolbar";
import { computed, ref } from "vue";

import type { CompareItem, PanelState } from "@/types";

type Props = {
  panelNumber: 1 | 2;
  panelState: PanelState;
  comparisonInProgress: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  paste: [panelNumber: 1 | 2];
  load: [panelNumber: 1 | 2];
  remove: [panelNumber: 1 | 2];
  clear: [panelNumber: 1 | 2];
  transfer: [item: CompareItem, fromPanel: 1 | 2];
  "update:selection": [items: CompareItem[]];
}>();

const selectedItems = computed({
  get: () => props.panelState.selectedItems,
  set: (value: CompareItem[]) => emit("update:selection", value),
});

const panelTitle = computed(() =>
  props.panelNumber === 1 ? "Original" : "Modified",
);

const contextMenu = ref<InstanceType<typeof ContextMenu> | undefined>();
const selectedItemForTransfer = ref<CompareItem | undefined>(undefined);

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString();
};

const handleSelectionUpdate = (newSelection: CompareItem[]) => {
  selectedItems.value = newSelection;
};

const handlePaste = () => emit("paste", props.panelNumber);
const handleLoad = () => emit("load", props.panelNumber);
const handleRemove = () => emit("remove", props.panelNumber);
const handleClear = () => emit("clear", props.panelNumber);

const getBadgeClass = (type: string): string => {
  const baseClass = "text-xs font-semibold px-2 py-1 rounded-sm";
  switch (type) {
    case "clipboard":
      return `${baseClass} bg-pink-600 text-white`;
    case "file":
      return `${baseClass} bg-blue-600 text-white`;
    case "request":
      return `${baseClass} bg-purple-600 text-white`;
    case "response":
      return `${baseClass} bg-teal-600 text-white`;
    default:
      return `${baseClass} bg-gray-600 text-white`;
  }
};

const contextMenuItems = computed(() => {
  const selectedCount = props.panelState.selectedItems.length;
  const hasSelection = selectedCount > 0;
  const transferLabel = hasSelection
    ? `Transfer ${selectedCount} item${selectedCount > 1 ? "s" : ""} to ${props.panelNumber === 1 ? "Modified" : "Original"}`
    : `Transfer to ${props.panelNumber === 1 ? "Modified" : "Original"}`;

  return [
    {
      label: transferLabel,
      icon: "fas fa-exchange-alt",
      command: () => {
        if (hasSelection) {
          props.panelState.selectedItems.forEach((item) => {
            emit("transfer", item, props.panelNumber);
          });
        } else if (selectedItemForTransfer.value !== undefined) {
          emit("transfer", selectedItemForTransfer.value, props.panelNumber);
        }
      },
    },
  ];
});

type RowContextMenuEvent = { data: CompareItem; originalEvent: MouseEvent };

const onRowContextMenu = (event: RowContextMenuEvent) => {
  selectedItemForTransfer.value = event.data;
  contextMenu.value?.show(event.originalEvent);
};

type BodyRowContext = { selected?: boolean; index?: number };

const bodyRowPt = {
  root: { class: "h-full flex flex-col" },
  wrapper: { class: "flex-1 min-h-0" },
  table: { class: "min-w-full" },
  thead: { class: "bg-surface-100 dark:bg-surface-800" },
  tbody: { class: "bg-white dark:bg-surface-900" },
  bodyRow: (opts: { context: BodyRowContext }) => ({
    class: [
      "cursor-pointer",
      opts.context.selected === true
        ? "bg-surface-700 dark:bg-surface-700"
        : (opts.context.index ?? 0) % 2 === 0
          ? "bg-surface-800 dark:bg-surface-800"
          : "bg-surface-900 dark:bg-surface-900",
    ].join(" "),
  }),
};
</script>

<template>
  <div
    class="h-full flex flex-col bg-surface-50 dark:bg-surface-900 rounded-md border border-surface-200 dark:border-surface-700 overflow-hidden"
  >
    <div
      class="flex items-center justify-between px-3 py-2 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 flex-shrink-0"
    >
      <div class="flex items-center gap-2">
        <span class="font-semibold text-surface-800 dark:text-white">{{
          panelTitle
        }}</span>
      </div>
    </div>

    <Toolbar
      class="flex-shrink-0 border-b border-surface-200 dark:border-surface-700"
    >
      <template #start>
        <div class="flex gap-2">
          <Button
            label="Paste"
            icon="fas fa-paste"
            size="small"
            :disabled="comparisonInProgress || panelState.loading"
            :loading="panelState.loading"
            @click="handlePaste"
          />
          <Button
            label="Load"
            icon="fas fa-folder-open"
            size="small"
            :disabled="comparisonInProgress || panelState.loading"
            :loading="panelState.loading"
            @click="handleLoad"
          />
          <Button
            label="Remove"
            icon="fas fa-trash"
            severity="danger"
            size="small"
            :disabled="
              panelState.selectedItems.length === 0 ||
              comparisonInProgress ||
              panelState.loading
            "
            :loading="panelState.loading"
            @click="handleRemove"
          />
          <Button
            label="Clear"
            icon="fas fa-times"
            severity="secondary"
            size="small"
            :disabled="
              panelState.items.length === 0 ||
              comparisonInProgress ||
              panelState.loading
            "
            :loading="panelState.loading"
            @click="handleClear"
          />
        </div>
      </template>
    </Toolbar>

    <div class="flex-1 min-h-0 overflow-hidden">
      <DataTable
        :selection="selectedItems"
        :value="panelState.items"
        selection-mode="multiple"
        :meta-key-selection="false"
        scrollable
        scroll-height="flex"
        class="text-sm h-full"
        :loading="panelState.loading"
        removable-sort
        :pt="bodyRowPt"
        @update:selection="handleSelectionUpdate"
        @row-contextmenu="onRowContextMenu"
      >
        <Column selection-mode="multiple" header-style="width: 3rem" />
        <Column field="id" header="ID" sortable header-style="width: 4rem" />
        <Column
          field="length"
          header="Length"
          sortable
          header-style="width: 6rem"
        >
          <template #body="{ data }">
            <span class="font-mono text-xs">{{
              formatNumber(data.length)
            }}</span>
          </template>
        </Column>
        <Column field="preview" header="Data" header-style="width: auto">
          <template #body="{ data }">
            <div
              class="font-mono text-xs text-surface-700 dark:text-surface-300 truncate max-w-48"
            >
              {{ data.preview }}
            </div>
          </template>
        </Column>
        <Column field="type" header="Type" sortable header-style="width: 5rem">
          <template #body="{ data }">
            <span :class="getBadgeClass(data.type)">
              {{ data.type }}
            </span>
          </template>
        </Column>
        <Column
          field="timestamp"
          header="Time"
          sortable
          header-style="width: 9rem"
        >
          <template #body="{ data }">
            <span class="text-xs text-surface-400 dark:text-surface-300">
              {{ formatTimestamp(data.timestamp) }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>

    <ContextMenu ref="contextMenu" :model="contextMenuItems" class="text-sm" />
  </div>
</template>
