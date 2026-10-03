<script setup lang="ts">
import Button from "primevue/button";
import Column from "primevue/column";
import ContextMenu from "primevue/contextmenu";
import DataTable from "primevue/datatable";

import { useForm } from "./useForm";
import { type PanelForm } from "./usePanel";

import {
  formatLength,
  formatTime,
  getPreview,
} from "@/components/common/itemFormat";
import { ItemKindTag } from "@/components/common/ItemKindTag";
import { PANEL_ACTION_LABELS } from "@/core/panels";

defineOptions({ name: "ItemPanel" });

const { panel } = defineProps<{ panel: PanelForm }>();

const form = useForm(panel);
</script>

<template>
  <div
    class="h-full flex flex-col bg-surface-800 rounded-md border border-surface-700 overflow-hidden"
  >
    <div
      class="flex items-center justify-between gap-2 px-3 py-2 border-b border-surface-700"
    >
      <span class="font-semibold text-white">{{ panel.title }}</span>
      <div class="flex gap-2">
        <Button
          :label="PANEL_ACTION_LABELS.paste"
          icon="fas fa-paste"
          size="small"
          :disabled="panel.isBusy.value"
          @click="panel.pasteClipboard"
        />
        <Button
          :label="PANEL_ACTION_LABELS.load"
          icon="fas fa-folder-open"
          size="small"
          :disabled="panel.isBusy.value"
          @click="form.chooseFile"
        />
        <Button
          :label="PANEL_ACTION_LABELS.remove"
          icon="fas fa-trash"
          severity="danger"
          size="small"
          :disabled="panel.isBusy.value || panel.selected.value.length === 0"
          @click="panel.removeSelected"
        />
        <Button
          :label="PANEL_ACTION_LABELS.clear"
          icon="fas fa-times"
          severity="secondary"
          size="small"
          :disabled="panel.isBusy.value || panel.items.value.length === 0"
          @click="panel.clear"
        />
      </div>
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        @change="form.addChosenFile"
      />
    </div>

    <div class="flex-1 min-h-0">
      <DataTable
        :value="panel.items.value"
        :selection="panel.selected.value"
        selection-mode="multiple"
        :meta-key-selection="false"
        data-key="id"
        striped-rows
        scrollable
        scroll-height="flex"
        class="h-full text-sm"
        :loading="panel.isBusy.value"
        @update:selection="panel.select"
        @row-contextmenu="form.openMenu"
      >
        <Column selection-mode="multiple" header-style="width: 3rem" />
        <Column field="id" header="ID" sortable header-style="width: 4rem" />
        <Column header="Length" header-style="width: 6rem">
          <template #body="{ data }">
            <span class="font-mono text-xs">
              {{ formatLength(data) }}
            </span>
          </template>
        </Column>
        <Column header="Data">
          <template #body="{ data }">
            <div class="font-mono text-xs text-surface-300 truncate max-w-48">
              {{ getPreview(data) }}
            </div>
          </template>
        </Column>
        <Column field="kind" header="Type" sortable header-style="width: 7rem">
          <template #body="{ data }">
            <ItemKindTag :kind="data.kind" />
          </template>
        </Column>
        <Column header="Time" header-style="width: 8rem">
          <template #body="{ data }">
            <span class="text-xs text-surface-400">{{ formatTime(data) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <ContextMenu ref="menu" :model="form.menuItems.value" class="text-sm" />
  </div>
</template>
