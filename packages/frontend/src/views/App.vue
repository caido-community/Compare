<script setup lang="ts">
import { onMounted, ref } from "vue";

import { useCompare } from "../composables/useCompare";
import { usePanelActions } from "../composables/usePanelActions";
import { usePanelData } from "../composables/usePanelData";
import { useTransfer } from "../composables/useTransfer";
import { useSDK } from "../plugins/sdk";
import type {
  CompareItem,
  CompareOptions,
  ComparisonViewResult,
  PanelState,
  UIState,
} from "../types";

import CompareControls from "@/components/CompareControls/Container.vue";
import CompareHeader from "@/components/CompareHeader/Container.vue";
import ComparePanel from "@/components/ComparePanel/Container.vue";
import ComparisonModal from "@/components/ComparisonModal/Container.vue";
import DocumentationTab from "@/components/DocumentationTab/Container.vue";

const sdk = useSDK();

const originalState = ref<PanelState>({
  items: [],
  selectedItems: [],
  loading: false,
  error: undefined,
});

const modifiedState = ref<PanelState>({
  items: [],
  selectedItems: [],
  loading: false,
  error: undefined,
});

const uiState = ref<UIState>({
  loading: false,
  error: undefined,
  comparisonInProgress: false,
  showComparisonModal: false,
});

const currentComparison = ref<ComparisonViewResult | undefined>(undefined);
const currentTab = ref<string>("compare");
const compareOptions = ref<CompareOptions>({
  ignoreWhitespace: false,
  ignoreCase: false,
});

const { loadPanelData: fetchPanelData, saveItemToBackend } = usePanelData(sdk);

async function loadPanelData(
  panelNumber: 1 | 2,
): Promise<CompareItem[] | undefined> {
  const panelState =
    panelNumber === 1 ? originalState.value : modifiedState.value;
  panelState.loading = true;
  panelState.error = undefined;
  const items = await fetchPanelData(panelNumber);
  if (items !== undefined) {
    panelState.items = items;
    panelState.selectedItems = [];
  }
  panelState.loading = false;
  return items;
}

const { handlePaste, handleLoad, handleRemove, handleClear } = usePanelActions(
  sdk,
  originalState,
  modifiedState,
  loadPanelData,
  saveItemToBackend,
);

const { performComparison } = useCompare(
  sdk,
  originalState,
  modifiedState,
  uiState,
  currentComparison,
);

const { handleTransfer } = useTransfer(
  sdk,
  originalState,
  modifiedState,
  loadPanelData,
  saveItemToBackend,
);

function handleCompareWords(): void {
  performComparison("words", compareOptions.value);
}

function handleCompareBytes(): void {
  performComparison("bytes", compareOptions.value);
}

function handleCompareLines(): void {
  performComparison("lines", compareOptions.value);
}

function handleComparisonModalClose(): void {
  uiState.value.showComparisonModal = false;
  currentComparison.value = undefined;
}

function handleModalVisibilityUpdate(value: boolean): void {
  uiState.value.showComparisonModal = value;
}

function handleTabSwitch(tab: string): void {
  currentTab.value = tab;
}

function updateOriginalSelection(items: CompareItem[]): void {
  originalState.value.selectedItems = items;
}

function updateModifiedSelection(items: CompareItem[]): void {
  modifiedState.value.selectedItems = items;
}

async function initializeData(): Promise<void> {
  uiState.value.loading = true;

  try {
    await Promise.all([loadPanelData(1), loadPanelData(2)]);
  } catch (error) {
    sdk.window.showToast("Failed to load plugin data", { variant: "error" });
  } finally {
    uiState.value.loading = false;
  }
}

onMounted(() => {
  void initializeData();

  const handleDataUpdate = (event: Event): void => {
    const { panel } = (event as CustomEvent<{ panel?: number }>).detail;
    if (panel === 1 || panel === 2) {
      void loadPanelData(panel);
    } else {
      void loadPanelData(1);
      void loadPanelData(2);
    }
  };

  window.addEventListener("compare-data-updated", handleDataUpdate);

  const sdkWithEvents = sdk as {
    events?: { onProjectChange?: (cb: () => void) => void };
  };
  const events = sdkWithEvents.events;
  if (events !== undefined && typeof events.onProjectChange === "function") {
    events.onProjectChange(() => void initializeData());
  }
});
</script>

<template>
  <div class="h-full flex flex-col gap-1">
    <CompareHeader :current-tab="currentTab" @switch-tab="handleTabSwitch" />

    <div class="flex-1 min-h-0">
      <div v-if="currentTab === 'compare'" class="h-full flex flex-col gap-1.5">
        <div class="flex-1 min-h-0 flex gap-1.5">
          <div class="w-1/2 min-w-0 h-full">
            <ComparePanel
              :panel-number="1"
              :panel-state="originalState"
              :comparison-in-progress="uiState.comparisonInProgress"
              @paste="handlePaste"
              @load="handleLoad"
              @remove="handleRemove"
              @clear="handleClear"
              @transfer="handleTransfer"
              @update:selection="updateOriginalSelection"
            />
          </div>
          <div class="w-1/2 min-w-0 h-full">
            <ComparePanel
              :panel-number="2"
              :panel-state="modifiedState"
              :comparison-in-progress="uiState.comparisonInProgress"
              @paste="handlePaste"
              @load="handleLoad"
              @remove="handleRemove"
              @clear="handleClear"
              @transfer="handleTransfer"
              @update:selection="updateModifiedSelection"
            />
          </div>
        </div>

        <CompareControls
          :panel1-state="originalState"
          :panel2-state="modifiedState"
          :comparison-in-progress="uiState.comparisonInProgress"
          :compare-options="compareOptions"
          @update:compare-options="(v) => (compareOptions = v)"
          @compare-words="handleCompareWords"
          @compare-bytes="handleCompareBytes"
          @compare-lines="handleCompareLines"
        />
      </div>

      <DocumentationTab
        v-else-if="currentTab === 'docs'"
        @switch-tab="handleTabSwitch"
      />
    </div>

    <ComparisonModal
      :visible="uiState.showComparisonModal"
      :comparison-result="currentComparison"
      @update:visible="handleModalVisibilityUpdate"
      @close="handleComparisonModalClose"
    />
  </div>
</template>
