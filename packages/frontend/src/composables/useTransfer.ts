import type { Ref } from "vue";

import type { CompareItem, FrontendSDK, PanelState } from "@/types";

type LoadPanelDataFn = (
  panelNumber: 1 | 2,
) => Promise<CompareItem[] | undefined>;
type SaveItemToBackendFn = (
  panelNumber: 1 | 2,
  item: CompareItem,
) => Promise<boolean>;

export function useTransfer(
  sdk: FrontendSDK,
  originalState: Ref<PanelState>,
  modifiedState: Ref<PanelState>,
  loadPanelData: LoadPanelDataFn,
  saveItemToBackend: SaveItemToBackendFn,
) {
  let batchTransferQueue: CompareItem[] = [];
  let batchTransferTimeout: ReturnType<typeof setTimeout> | undefined;
  let currentTransferPanel: 1 | 2 | undefined;

  function handleTransfer(item: CompareItem, fromPanel: 1 | 2): void {
    batchTransferQueue.push(item);
    currentTransferPanel = fromPanel;

    if (batchTransferTimeout !== undefined) {
      clearTimeout(batchTransferTimeout);
    }

    batchTransferTimeout = setTimeout(() => {
      if (currentTransferPanel !== undefined) {
        void processBatchTransfer(currentTransferPanel);
      }
      batchTransferTimeout = undefined;
    }, 100);
  }

  async function processBatchTransfer(fromPanel: 1 | 2): Promise<void> {
    if (batchTransferQueue.length === 0) return;

    const toPanel = fromPanel === 1 ? 2 : 1;
    const fromPanelState =
      fromPanel === 1 ? originalState.value : modifiedState.value;
    const toPanelState =
      fromPanel === 1 ? modifiedState.value : originalState.value;
    const itemsToTransfer = [...batchTransferQueue];

    batchTransferQueue = [];
    currentTransferPanel = undefined;

    fromPanelState.loading = true;
    toPanelState.loading = true;

    try {
      let successCount = 0;
      let failureCount = 0;

      for (const item of itemsToTransfer) {
        try {
          const saved = await saveItemToBackend(toPanel, item);

          if (saved) {
            const removeResult = await sdk.backend.removeItemFromPanel(
              fromPanel,
              item.id,
            );

            if (removeResult.kind === "Success") {
              successCount++;
            } else {
              failureCount++;
            }
          } else {
            failureCount++;
          }
        } catch (error) {
          failureCount++;
        }
      }

      if (successCount > 0) {
        const message =
          itemsToTransfer.length === 1
            ? `Item transferred from ${fromPanel === 1 ? "Original" : "Modified"} to ${toPanel === 1 ? "Original" : "Modified"}`
            : `${successCount} item${successCount > 1 ? "s" : ""} transferred from ${fromPanel === 1 ? "Original" : "Modified"} to ${toPanel === 1 ? "Original" : "Modified"}`;

        sdk.window.showToast(message, { variant: "success" });
      }

      if (failureCount > 0) {
        const message =
          itemsToTransfer.length === 1
            ? "Failed to transfer item"
            : `${failureCount} item${failureCount > 1 ? "s" : ""} failed to transfer`;

        sdk.window.showToast(message, { variant: "error" });
      }
    } catch (error) {
      sdk.window.showToast(
        `Batch transfer failed: ${(error as Error).message}`,
        {
          variant: "error",
        },
      );
    } finally {
      fromPanelState.loading = false;
      toPanelState.loading = false;

      const [itemsFrom, itemsTo] = await Promise.all([
        loadPanelData(fromPanel),
        loadPanelData(toPanel),
      ]);
      if (itemsFrom !== undefined) {
        fromPanelState.items = itemsFrom;
        fromPanelState.selectedItems = [];
      }
      if (itemsTo !== undefined) {
        toPanelState.items = itemsTo;
        toPanelState.selectedItems = [];
      }
    }
  }

  return { handleTransfer };
}
