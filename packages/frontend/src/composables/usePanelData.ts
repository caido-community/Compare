import type { CompareItem, FrontendSDK } from "@/types";

export function usePanelData(sdk: FrontendSDK) {
  async function loadPanelData(
    panelNumber: 1 | 2,
  ): Promise<CompareItem[] | undefined> {
    const result = await sdk.backend.loadPanelData(panelNumber);
    if (result.success && result.data !== undefined) {
      const data = result.data;
      return data.items.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    }
    const msg =
      result.error ??
      `Failed to load ${panelNumber === 1 ? "Original" : "Modified"} data`;
    sdk.window.showToast(msg, { variant: "error" });
    return undefined;
  }

  async function saveItemToBackend(
    panelNumber: 1 | 2,
    item: CompareItem,
  ): Promise<boolean> {
    const result = await sdk.backend.saveItemToPanel(
      panelNumber,
      item.data,
      item.type,
      item.source,
      item.metadata,
    );
    if (result.success && result.data !== undefined) {
      return true;
    }
    const msg =
      result.error ??
      `Failed to save to ${panelNumber === 1 ? "Original" : "Modified"}`;
    sdk.window.showToast(msg, { variant: "error" });
    return false;
  }

  return { loadPanelData, saveItemToBackend };
}
