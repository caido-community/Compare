import {
  type AddItemInput,
  type AddRequestsInput,
  type CompareItem,
  type ItemSelection,
  type Panel,
  type Result,
} from "shared";

import { callBackend } from "@/services/call";
import { type FrontendSDK } from "@/types";

export type ItemService = {
  listItems: (panel: Panel) => Promise<Result<CompareItem[]>>;
  addItem: (input: AddItemInput) => Promise<Result<CompareItem>>;
  addRequests: (input: AddRequestsInput) => Promise<Result<CompareItem[]>>;
  removeItems: (selection: ItemSelection) => Promise<Result<number[]>>;
  moveItems: (selection: ItemSelection) => Promise<Result<CompareItem[]>>;
  clearPanel: (panel: Panel) => Promise<Result<Panel>>;
  onItemsChanged: (listener: () => void) => () => void;
};

export const buildItemService = (sdk: FrontendSDK): ItemService => ({
  listItems: (panel) => callBackend(() => sdk.backend.listItems(panel)),
  addItem: (input) => callBackend(() => sdk.backend.addItem(input)),
  addRequests: (input) => callBackend(() => sdk.backend.addRequests(input)),
  removeItems: (selection) =>
    callBackend(() => sdk.backend.removeItems(selection)),
  moveItems: (selection) => callBackend(() => sdk.backend.moveItems(selection)),
  clearPanel: (panel) => callBackend(() => sdk.backend.clearPanel(panel)),
  onItemsChanged: (listener) => {
    const subscription = sdk.backend.onEvent("itemsChanged", listener);
    return () => subscription.stop();
  },
});
