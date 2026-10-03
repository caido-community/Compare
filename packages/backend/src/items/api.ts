import {
  type AddFileItemInput,
  type AddItemInput,
  type AddRequestsInput,
  type CompareItem,
  err,
  ITEM_TOO_LARGE_MESSAGE,
  type ItemSelection,
  MAX_ITEM_BYTES,
  ok,
  type Panel,
  type Result,
} from "shared";

import { type FileSystem } from "../runtime/fileSystem";
import { type RequestReader } from "../runtime/requests";

import { UPLOAD_MISSING_MESSAGE } from "./messages";
import {
  addFileItemSchema,
  addItemSchema,
  addRequestsSchema,
  panelSchema,
  parseInput,
  selectionSchema,
} from "./schema";
import { type ItemDraft, type ItemState } from "./state";

export const buildItemsApi = (deps: {
  state: ItemState;
  fileSystem: FileSystem;
  readRequest: RequestReader;
}) => {
  const readUploadedFile = async (path: string): Promise<Result<string>> => {
    const size = await deps.fileSystem.readFileSize(path);
    if (size.kind === "Missing") return err(UPLOAD_MISSING_MESSAGE);
    if (size.kind === "Failed") {
      return err(`The uploaded file could not be read: ${size.message}`);
    }
    if (size.bytes > MAX_ITEM_BYTES) return err(ITEM_TOO_LARGE_MESSAGE);

    const read = await deps.fileSystem.readTextFile(path);
    if (read.kind === "Found") return ok(read.content);
    if (read.kind === "Missing") return err(UPLOAD_MISSING_MESSAGE);
    return err(`The uploaded file could not be read: ${read.message}`);
  };

  const readRequestDraft = async (
    panel: Panel,
    requestId: string,
  ): Promise<Result<ItemDraft>> => {
    const read = await deps.readRequest(requestId);
    if (read.kind === "Error") return read;

    const draft: ItemDraft = { kind: "request", ...read.value };
    const valid = parseInput(addItemSchema, { panel, ...draft });
    if (valid.kind === "Error") {
      return err(
        `The request to ${draft.source} cannot be added. ${valid.error}`,
      );
    }
    return ok(draft);
  };

  const listItems = async (panel: Panel): Promise<Result<CompareItem[]>> => {
    const parsed = parseInput(panelSchema, panel);
    if (parsed.kind === "Error") return parsed;
    return ok(await deps.state.list(parsed.value));
  };

  const addItem = async (input: AddItemInput): Promise<Result<CompareItem>> => {
    const parsed = parseInput(addItemSchema, input);
    if (parsed.kind === "Error") return parsed;

    const { panel, ...draft } = parsed.value;
    const added = await deps.state.add(panel, [draft]);
    if (added.kind === "Error") return added;

    const [item] = added.value;
    return item === undefined ? err("The item was not added.") : ok(item);
  };

  const addFileItem = async (
    input: AddFileItemInput,
  ): Promise<Result<CompareItem>> => {
    const parsed = parseInput(addFileItemSchema, input);
    if (parsed.kind === "Error") return parsed;

    const { path, ...target } = parsed.value;
    const content = await readUploadedFile(path);
    if (content.kind === "Error") return content;

    return addItem({ ...target, data: content.value });
  };

  const addRequests = async (
    input: AddRequestsInput,
  ): Promise<Result<CompareItem[]>> => {
    const parsed = parseInput(addRequestsSchema, input);
    if (parsed.kind === "Error") return parsed;

    const { panel, requestIds } = parsed.value;
    const drafts: ItemDraft[] = [];
    for (const requestId of requestIds) {
      const draft = await readRequestDraft(panel, requestId);
      if (draft.kind === "Error") return draft;
      drafts.push(draft.value);
    }
    return deps.state.add(panel, drafts);
  };

  const removeItems = async (
    selection: ItemSelection,
  ): Promise<Result<number[]>> => {
    const parsed = parseInput(selectionSchema, selection);
    if (parsed.kind === "Error") return parsed;
    return deps.state.remove(parsed.value.panel, parsed.value.ids);
  };

  const moveItems = async (
    selection: ItemSelection,
  ): Promise<Result<CompareItem[]>> => {
    const parsed = parseInput(selectionSchema, selection);
    if (parsed.kind === "Error") return parsed;
    return deps.state.move(parsed.value.panel, parsed.value.ids);
  };

  const clearPanel = async (panel: Panel): Promise<Result<Panel>> => {
    const parsed = parseInput(panelSchema, panel);
    if (parsed.kind === "Error") return parsed;
    return deps.state.clear(parsed.value);
  };

  return {
    listItems,
    addItem,
    addFileItem,
    addRequests,
    removeItems,
    moveItems,
    clearPanel,
  };
};
