<script setup lang="ts">
import Button from "primevue/button";
import Column from "primevue/column";
import ContextMenu from "primevue/contextmenu";
import DataTable from "primevue/datatable";
import { type CompareItem, type Panel } from "shared";

import { useForm } from "./useForm";

import { ItemKindTag } from "@/components/common/ItemKindTag";
import { formatLength } from "@/presentation/format";
import { type Services } from "@/services";

defineOptions({ name: "ItemPanel" });

const { panel, services } = defineProps<{ panel: Panel; services: Services }>();

const selected = defineModel<CompareItem[]>("selected", { required: true });

const form = useForm({ panel, services, selected });
</script>

<template>
  <div
    class="h-full flex flex-col bg-surface-800 rounded-md border border-surface-700 overflow-hidden"
  >
    <div
      class="flex items-center justify-between gap-2 px-3 py-2 border-b border-surface-700"
    >
      <span class="font-semibold text-surface-0">{{ form.title }}</span>
      <div class="flex gap-2">
        <Button
          v-for="action in form.toolbar.value"
          :key="action.label"
          :label="action.label"
          :icon="action.icon"
          :severity="action.severity"
          size="small"
          :disabled="action.isDisabled"
          @click="action.run"
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
        v-model:selection="selected"
        :value="form.items.value"
        selection-mode="multiple"
        :meta-key-selection="false"
        data-key="id"
        striped-rows
        scrollable
        scroll-height="flex"
        class="h-full text-sm"
        :loading="form.isBusy.value"
        @row-contextmenu="form.openMenu"
      >
        <Column selection-mode="multiple" header-class="w-12" />
        <Column field="id" header="ID" sortable header-class="w-16" />
        <Column header="Length" header-class="w-24">
          <template #body="{ data }">
            <span class="font-mono text-xs">{{ formatLength(data) }}</span>
          </template>
        </Column>
        <Column header="Data">
          <template #body="{ data }">
            <div class="font-mono text-xs text-surface-300 truncate max-w-48">
              {{ form.getPreview(data) }}
            </div>
          </template>
        </Column>
        <Column field="kind" header="Type" sortable header-class="w-28">
          <template #body="{ data }">
            <ItemKindTag :kind="data.kind" />
          </template>
        </Column>
        <Column header="Time" header-class="w-32">
          <template #body="{ data }">
            <span class="text-xs text-surface-400">
              {{ form.formatTime(data) }}
            </span>
          </template>
        </Column>
      </DataTable>
    </div>

    <ContextMenu ref="menu" :model="form.menuItems.value" class="text-sm" />
  </div>
</template>
