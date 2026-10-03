import {
  type AddFileItemInput,
  type AddItemInput,
  type AddRequestsInput,
  type CompareItem,
  err,
  getOtherPanel,
  ITEM_TOO_LARGE_MESSAGE,
  type ItemSelection,
  MAX_ITEM_BYTES,
  ok,
  type Panel,
  type Result,
} from "shared";

import { type FileSystem } from "../runtime/fileSystem";
import { type RequestReader } from "../runtime/requests";
import { applyInOrder, mapInOrder, toResult } from "../runtime/sequence";

import { UPLOAD_MISSING_MESSAGE } from "./messages";
import { getNextId, sortById, withoutIds, withPanel } from "./panels";
import { type Mutation, type OpenProject, type ProjectState } from "./project";
import {
  addFileItemSchema,
  addItemSchema,
  addRequestsSchema,
  panelSchema,
  parseInput,
  selectionSchema,
} from "./schema";
import { type ItemStore } from "./store";

type ItemDraft = Omit<AddItemInput, "panel">;

export const buildItemsApi = (deps: {
  project: ProjectState;
  store: ItemStore;
  fileSystem: FileSystem;
  readRequest: RequestReader;
  now: () => string;
}) => {
  const buildItem = (
    open: OpenProject,
    draft: ItemDraft,
    offset: number,
  ): CompareItem => ({
    ...draft,
    id: getNextId(open.panels) + offset,
    createdAt: deps.now(),
  });

  const insertItems = async (
    open: OpenProject,
    panel: Panel,
    drafts: ItemDraft[],
  ): Promise<Mutation<CompareItem[]>> => {
    const items = drafts.map((draft, offset) => buildItem(open, draft, offset));
    const applied = await applyInOrder(items, (item) =>
      deps.store.writeItem(open.id, panel, item),
    );
    const panelItems = [...open.panels[panel], ...applied.done];
    return {
      panels: withPanel(open.panels, panel, panelItems),
      result: toResult(applied),
    };
  };

  const insertItem = async (
    open: OpenProject,
    panel: Panel,
    draft: ItemDraft,
  ): Promise<Mutation<CompareItem>> => {
    const item = buildItem(open, draft, 0);
    const written = await deps.store.writeItem(open.id, panel, item);
    if (written.kind === "Error") {
      return { panels: open.panels, result: written };
    }

    const panelItems = [...open.panels[panel], item];
    return {
      panels: withPanel(open.panels, panel, panelItems),
      result: written,
    };
  };

  const readRequestDrafts = (panel: Panel, requestIds: string[]) =>
    mapInOrder(requestIds, async (requestId): Promise<Result<ItemDraft>> => {
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
    });

  const moveItem = async (
    open: OpenProject,
    from: Panel,
    item: CompareItem,
  ): Promise<Result<CompareItem>> => {
    const to = getOtherPanel(from);
    const written = await deps.store.writeItem(open.id, to, item);
    if (written.kind === "Error") return written;

    const removed = await deps.store.removeItem(open.id, from, item.id);
    if (removed.kind === "Ok") return ok(item);

    await deps.store.removeItem(open.id, to, item.id);
    return removed;
  };

  const readUploadedFile = async (path: string): Promise<Result<string>> => {
    const size = await deps.fileSystem.readFileSize(path);
    if (size.kind === "Missing") return err(UPLOAD_MISSING_MESSAGE);
    if (size.kind === "Failed")
      return err(`The uploaded file could not be read: ${size.message}`);
    if (size.bytes > MAX_ITEM_BYTES) return err(ITEM_TOO_LARGE_MESSAGE);

    const read = await deps.fileSystem.readTextFile(path);
    if (read.kind === "Found") return ok(read.content);
    if (read.kind === "Missing") return err(UPLOAD_MISSING_MESSAGE);
    return err(`The uploaded file could not be read: ${read.message}`);
  };

  const listItems = async (panel: Panel): Promise<Result<CompareItem[]>> => {
    const parsed = parseInput(panelSchema, panel);
    if (parsed.kind === "Error") return parsed;
    return ok(await deps.project.readPanel(parsed.value));
  };

  const addItem = async (input: AddItemInput): Promise<Result<CompareItem>> => {
    const parsed = parseInput(addItemSchema, input);
    if (parsed.kind === "Error") return parsed;

    const { panel, ...draft } = parsed.value;
    return deps.project.mutate((open) => insertItem(open, panel, draft));
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
    const drafts = await readRequestDrafts(panel, requestIds);
    if (drafts.kind === "Error") return drafts;

    return deps.project.mutate((open) =>
      insertItems(open, panel, drafts.value),
    );
  };

  const removeItems = async (
    selection: ItemSelection,
  ): Promise<Result<number[]>> => {
    const parsed = parseInput(selectionSchema, selection);
    if (parsed.kind === "Error") return parsed;

    const { panel, ids } = parsed.value;
    return deps.project.mutate(async (open) => {
      const stored = open.panels[panel].map((item) => item.id);
      const existing = ids.filter((id) => stored.includes(id));
      const applied = await applyInOrder(existing, (id) =>
        deps.store.removeItem(open.id, panel, id),
      );
      const kept = withoutIds(open.panels[panel], new Set(applied.done));
      return {
        panels: withPanel(open.panels, panel, kept),
        result: toResult(applied),
      };
    });
  };

  const moveItems = async (
    selection: ItemSelection,
  ): Promise<Result<CompareItem[]>> => {
    const parsed = parseInput(selectionSchema, selection);
    if (parsed.kind === "Error") return parsed;

    const { panel, ids } = parsed.value;
    const target = getOtherPanel(panel);
    return deps.project.mutate(async (open) => {
      const selected = new Set(ids);
      const moving = open.panels[panel].filter((item) => selected.has(item.id));
      const applied = await applyInOrder(moving, (item) =>
        moveItem(open, panel, item),
      );

      const moved = new Set(applied.done.map((item) => item.id));
      const kept = withoutIds(open.panels[panel], moved);
      const arrived = sortById([...open.panels[target], ...applied.done]);
      return {
        panels: withPanel(withPanel(open.panels, panel, kept), target, arrived),
        result: toResult(applied),
      };
    });
  };

  const clearPanel = async (panel: Panel): Promise<Result<Panel>> => {
    const parsed = parseInput(panelSchema, panel);
    if (parsed.kind === "Error") return parsed;

    return deps.project.mutate(async (open) => {
      const removed = await deps.store.removePanel(open.id, parsed.value);
      const panels =
        removed.kind === "Ok"
          ? withPanel(open.panels, parsed.value, [])
          : open.panels;
      return { panels, result: removed };
    });
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
