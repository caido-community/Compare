import type { Ref } from "vue";

import {
  compareByBytes,
  compareByLines,
  compareByWords,
  computeComparisonSummary,
} from "../utils/comparisonEngine";

import type {
  CompareItem,
  CompareOptions,
  ComparisonViewResult,
  FrontendSDK,
  PanelState,
  UIState,
} from "@/types";

export function useCompare(
  sdk: FrontendSDK,
  originalState: Ref<PanelState>,
  modifiedState: Ref<PanelState>,
  uiState: Ref<UIState>,
  currentComparison: Ref<ComparisonViewResult | undefined>,
) {
  function performComparison(
    type: "words" | "bytes" | "lines",
    options: CompareOptions,
  ): void {
    if (
      originalState.value.items.length === 0 ||
      modifiedState.value.items.length === 0
    ) {
      sdk.window.showToast(
        "Both Original and Modified must have data to compare",
        { variant: "warning" },
      );
      return;
    }

    if (originalState.value.selectedItems.length === 0) {
      sdk.window.showToast("Please select exactly one item from Original", {
        variant: "warning",
      });
      return;
    }

    if (modifiedState.value.selectedItems.length === 0) {
      sdk.window.showToast("Please select exactly one item from Modified", {
        variant: "warning",
      });
      return;
    }

    if (originalState.value.selectedItems.length > 1) {
      sdk.window.showToast(
        "Please select only one item from Original for comparison",
        { variant: "warning" },
      );
      return;
    }

    if (modifiedState.value.selectedItems.length > 1) {
      sdk.window.showToast(
        "Please select only one item from Modified for comparison",
        { variant: "warning" },
      );
      return;
    }

    const item1 = originalState.value.selectedItems[0] as CompareItem;
    const item2 = modifiedState.value.selectedItems[0] as CompareItem;

    uiState.value.comparisonInProgress = true;

    try {
      const text1 =
        typeof item1.data === "string"
          ? item1.data
          : JSON.stringify(item1.data, null, 2);
      const text2 =
        typeof item2.data === "string"
          ? item2.data
          : JSON.stringify(item2.data, null, 2);

      const { diffs1, diffs2 } =
        type === "words"
          ? compareByWords(text1, text2, options)
          : type === "bytes"
            ? compareByBytes(text1, text2, options)
            : compareByLines(text1, text2, options);

      const summary = computeComparisonSummary(diffs1, diffs2, type);
      currentComparison.value = {
        id1: item1.id,
        id2: item2.id,
        source1: item1.source ?? `${item1.type} data`,
        source2: item2.source ?? `${item2.type} data`,
        length1: text1.length,
        length2: text2.length,
        diffs1,
        diffs2,
        type,
        timestamp: new Date(),
        summary,
      };

      uiState.value.showComparisonModal = true;

      const typeLabel =
        type === "words" ? "Words" : type === "bytes" ? "Bytes" : "Lines";
      sdk.window.showToast(`${typeLabel} comparison completed`, {
        variant: "success",
      });
    } catch (error) {
      sdk.window.showToast(`Comparison failed: ${(error as Error).message}`, {
        variant: "error",
      });
    } finally {
      uiState.value.comparisonInProgress = false;
    }
  }

  return { performComparison };
}
