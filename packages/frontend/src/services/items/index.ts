import {
  type AddFileItemInput,
  type AddItemInput,
  type AddRequestsInput,
  type CompareItem,
  err,
  ITEM_TOO_LARGE_MESSAGE,
  type ItemSelection,
  MAX_ITEM_BYTES,
  measureBytes,
  type Panel,
  type Result,
} from "shared";

import { callBackend } from "@/services/call";
import { withUploadedFile } from "@/services/upload";
import { type FrontendSDK } from "@/types";

type ItemTarget = Omit<AddFileItemInput, "path">;

type Transport = "Inline" | "Upload" | "TooLarge";

export type ItemService = {
  listItems: (panel: Panel) => Promise<Result<CompareItem[]>>;
  addItem: (input: AddItemInput) => Promise<Result<CompareItem>>;
  addFile: (panel: Panel, file: File) => Promise<Result<CompareItem>>;
  addRequests: (input: AddRequestsInput) => Promise<Result<CompareItem[]>>;
  removeItems: (selection: ItemSelection) => Promise<Result<number[]>>;
  moveItems: (selection: ItemSelection) => Promise<Result<CompareItem[]>>;
  clearPanel: (panel: Panel) => Promise<Result<Panel>>;
  onItemsChanged: (listener: () => void) => () => void;
};

const INLINE_LIMIT_BYTES = 256 * 1024;

const UPLOADED_TEXT_NAME = "compare-item.txt";

export const chooseTransport = (bytes: number): Transport => {
  if (bytes > MAX_ITEM_BYTES) return "TooLarge";
  return bytes <= INLINE_LIMIT_BYTES ? "Inline" : "Upload";
};

export const buildItemService = (sdk: FrontendSDK): ItemService => {
  const addUploaded = (file: File, target: ItemTarget) =>
    withUploadedFile(sdk.files, file, (path) =>
      callBackend(() => sdk.backend.addFileItem({ ...target, path })),
    );

  const addItem = (input: AddItemInput): Promise<Result<CompareItem>> => {
    const { data, ...target } = input;
    switch (chooseTransport(measureBytes(data))) {
      case "TooLarge":
        return Promise.resolve(err(ITEM_TOO_LARGE_MESSAGE));
      case "Inline":
        return callBackend(() => sdk.backend.addItem(input));
      case "Upload":
        return addUploaded(new File([data], UPLOADED_TEXT_NAME), target);
    }
  };

  const addFile = async (
    panel: Panel,
    file: File,
  ): Promise<Result<CompareItem>> => {
    const target: ItemTarget = { panel, kind: "file", source: file.name };
    switch (chooseTransport(file.size)) {
      case "TooLarge":
        return err(ITEM_TOO_LARGE_MESSAGE);
      case "Inline":
        return addItem({ ...target, data: await file.text() });
      case "Upload":
        return addUploaded(file, target);
    }
  };

  return {
    listItems: (panel) => callBackend(() => sdk.backend.listItems(panel)),
    addItem,
    addFile,
    addRequests: (input) => callBackend(() => sdk.backend.addRequests(input)),
    removeItems: (selection) =>
      callBackend(() => sdk.backend.removeItems(selection)),
    moveItems: (selection) =>
      callBackend(() => sdk.backend.moveItems(selection)),
    clearPanel: (panel) => callBackend(() => sdk.backend.clearPanel(panel)),
    onItemsChanged: (listener) => {
      const subscription = sdk.backend.onEvent("itemsChanged", listener);
      return () => subscription.stop();
    },
  };
};
