import type { Ref } from "vue";

import type { CompareItem, FrontendSDK, PanelState } from "@/types";

type LoadPanelDataFn = (
  panelNumber: 1 | 2,
) => Promise<CompareItem[] | undefined>;
type SaveItemToBackendFn = (
  panelNumber: 1 | 2,
  item: CompareItem,
) => Promise<boolean>;

export function usePanelActions(
  sdk: FrontendSDK,
  originalState: Ref<PanelState>,
  modifiedState: Ref<PanelState>,
  loadPanelData: LoadPanelDataFn,
  saveItemToBackend: SaveItemToBackendFn,
) {
  function getPanelState(panelNumber: 1 | 2): PanelState {
    return panelNumber === 1 ? originalState.value : modifiedState.value;
  }

  async function handlePaste(panelNumber: 1 | 2): Promise<void> {
    const panelState = getPanelState(panelNumber);
    panelState.loading = true;

    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText.trim() === "") {
        sdk.window.showToast("Clipboard is empty", { variant: "warning" });
        return;
      }

      const result = await sdk.backend.processClipboardData(clipboardText);
      if (result.success && result.item !== undefined) {
        const saved = await saveItemToBackend(panelNumber, result.item);
        if (saved) {
          sdk.window.showToast(
            `Data pasted to ${panelNumber === 1 ? "Original" : "Modified"}`,
            { variant: "success" },
          );
          const items = await loadPanelData(panelNumber);
          if (items !== undefined) {
            panelState.items = items;
            panelState.selectedItems = [];
          }
        }
      } else {
        sdk.window.showToast(
          result.error ?? "Failed to process clipboard data",
          { variant: "error" },
        );
      }
    } catch {
      sdk.window.showToast("Failed to read clipboard", { variant: "error" });
    } finally {
      panelState.loading = false;
    }
  }

  function handleLoad(panelNumber: 1 | 2): void {
    const panelState = getPanelState(panelNumber);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";

    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file === undefined) return;

      panelState.loading = true;

      try {
        const text = await file.text();
        const result = await sdk.backend.processFileUpload(text, file.name);

        if (result.success && result.item !== undefined) {
          const saved = await saveItemToBackend(panelNumber, result.item);
          if (saved) {
            sdk.window.showToast(
              `File "${file.name}" loaded to ${panelNumber === 1 ? "Original" : "Modified"}`,
              { variant: "success" },
            );
            const items = await loadPanelData(panelNumber);
            if (items !== undefined) {
              panelState.items = items;
              panelState.selectedItems = [];
            }
          }
        } else {
          sdk.window.showToast(result.error ?? "Failed to process file", {
            variant: "error",
          });
        }
      } catch {
        sdk.window.showToast("Failed to read file", { variant: "error" });
      } finally {
        panelState.loading = false;
      }
    };

    input.click();
  }

  async function handleRemove(panelNumber: 1 | 2): Promise<void> {
    const panelState = getPanelState(panelNumber);

    if (panelState.selectedItems.length === 0) {
      sdk.window.showToast("No items selected", { variant: "warning" });
      return;
    }

    panelState.loading = true;

    try {
      const removePromises = panelState.selectedItems.map((item: CompareItem) =>
        sdk.backend.removeItemFromPanel(panelNumber, item.id),
      );

      const results = await Promise.all(removePromises);
      const successCount = results.filter((r) => r.kind === "Success").length;

      if (successCount > 0) {
        const items = await loadPanelData(panelNumber);
        if (items !== undefined) {
          panelState.items = items;
          panelState.selectedItems = [];
        }
        sdk.window.showToast(
          `Removed ${successCount} item(s) from ${panelNumber === 1 ? "Original" : "Modified"}`,
          { variant: "success" },
        );
      }
    } finally {
      panelState.loading = false;
    }
  }

  async function handleClear(panelNumber: 1 | 2): Promise<void> {
    const panelState = getPanelState(panelNumber);

    if (panelState.items.length === 0) {
      sdk.window.showToast(
        `${panelNumber === 1 ? "Original" : "Modified"} is already empty`,
        { variant: "info" },
      );
      return;
    }

    panelState.loading = true;

    try {
      const result = await sdk.backend.clearPanelData(panelNumber);

      if (result.kind === "Success") {
        const items = await loadPanelData(panelNumber);
        if (items !== undefined) {
          panelState.items = items;
          panelState.selectedItems = [];
        }
        sdk.window.showToast(
          `${panelNumber === 1 ? "Original" : "Modified"} cleared`,
          { variant: "success" },
        );
      } else {
        sdk.window.showToast(
          result.error ??
            `Failed to clear ${panelNumber === 1 ? "Original" : "Modified"}`,
          { variant: "error" },
        );
      }
    } finally {
      panelState.loading = false;
    }
  }

  return { handlePaste, handleLoad, handleRemove, handleClear };
}
