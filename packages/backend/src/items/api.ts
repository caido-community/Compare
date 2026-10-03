import {
  type AddFileItemInput,
  type AddItemInput,
  type AddRequestsInput,
  type CompareItem,
  err,
  getOtherPanel,
  type ItemSelection,
  ok,
  type Panel,
  type Result,
} from "shared";

import { type FileSystem } from "../runtime/fileSystem";

import {
  getNextId,
  type Mutation,
  type OpenProject,
  type ProjectState,
  withPanel,
} from "./project";
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

type RequestContent = { source: string; data: string };

export type RequestReader = (
  requestId: string,
) => Promise<Result<RequestContent>>;

type Applied<T> = { done: T[]; error: string | undefined };

const applyInOrder = async <T>(
  entries: T[],
  apply: (entry: T) => Promise<Result<unknown>>,
): Promise<Applied<T>> => {
  const done: T[] = [];
  for (const entry of entries) {
    const result = await apply(entry);
    if (result.kind === "Error") return { done, error: result.error };
    done.push(entry);
  }
  return { done, error: undefined };
};

const toResult = <T>(applied: Applied<T>): Result<T[]> =>
  applied.error === undefined ? ok(applied.done) : err(applied.error);

const sortById = (items: CompareItem[]) =>
  [...items].sort((a, b) => a.id - b.id);

export const buildItemsApi = (deps: {
  project: ProjectState;
  store: ItemStore;
  fileSystem: FileSystem;
  readRequest: RequestReader;
  now: () => string;
}) => {
  const { project, store } = deps;

  const insertItems = async (
    open: OpenProject,
    panel: Panel,
    drafts: ItemDraft[],
  ): Promise<Mutation<CompareItem[]>> => {
    const firstId = getNextId(open.panels);
    const items = drafts.map((draft, index) => ({
      ...draft,
      id: firstId + index,
      createdAt: deps.now(),
    }));
    const applied = await applyInOrder(items, (item) =>
      store.writeItem(open.id, panel, item),
    );
    const panelItems = [...open.panels[panel], ...applied.done];
    return {
      panels: withPanel(open.panels, panel, panelItems),
      result: toResult(applied),
    };
  };

  const readRequests = async (
    requestIds: string[],
  ): Promise<Result<ItemDraft[]>> => {
    const drafts: ItemDraft[] = [];
    for (const requestId of requestIds) {
      const read = await deps.readRequest(requestId);
      if (read.kind === "Error") return read;
      drafts.push({ kind: "request", ...read.value });
    }
    return ok(drafts);
  };

  const validateDrafts = (
    panel: Panel,
    drafts: ItemDraft[],
  ): Result<ItemDraft[]> => {
    for (const draft of drafts) {
      const parsed = parseInput(addItemSchema, { panel, ...draft });
      if (parsed.kind === "Error") {
        return err(
          `The request to ${draft.source} cannot be added. ${parsed.error}`,
        );
      }
    }
    return ok(drafts);
  };

  const moveItem = async (
    open: OpenProject,
    from: Panel,
    item: CompareItem,
  ): Promise<Result<CompareItem>> => {
    const written = await store.writeItem(open.id, getOtherPanel(from), item);
    if (written.kind === "Error") return written;

    const removed = await store.removeItem(open.id, from, item.id);
    return removed.kind === "Error" ? removed : ok(item);
  };

  const listItems = async (panel: Panel): Promise<Result<CompareItem[]>> => {
    const parsed = parseInput(panelSchema, panel);
    if (parsed.kind === "Error") return parsed;
    return ok(await project.readPanel(parsed.value));
  };

  const addItem = async (input: AddItemInput): Promise<Result<CompareItem>> => {
    const parsed = parseInput(addItemSchema, input);
    if (parsed.kind === "Error") return parsed;

    const { panel, ...draft } = parsed.value;
    const added = await project.mutate((open) =>
      insertItems(open, panel, [draft]),
    );
    if (added.kind === "Error") return added;

    const item = added.value[0];
    return item === undefined ? err("The item was not added.") : ok(item);
  };

  const readUploadedFile = async (path: string): Promise<Result<string>> => {
    const read = await deps.fileSystem.readTextFile(path);
    if (read.kind === "Found") return ok(read.content);
    if (read.kind === "Missing")
      return err("The uploaded file no longer exists.");
    return err(`The uploaded file could not be read: ${read.message}`);
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
    const drafts = await readRequests(requestIds);
    if (drafts.kind === "Error") return drafts;

    const valid = validateDrafts(panel, drafts.value);
    if (valid.kind === "Error") return valid;

    return project.mutate((open) => insertItems(open, panel, valid.value));
  };

  const removeItems = async (
    selection: ItemSelection,
  ): Promise<Result<number[]>> => {
    const parsed = parseInput(selectionSchema, selection);
    if (parsed.kind === "Error") return parsed;

    const { panel, ids } = parsed.value;
    return project.mutate(async (open) => {
      const applied = await applyInOrder(ids, (id) =>
        store.removeItem(open.id, panel, id),
      );
      const removed = new Set(applied.done);
      const kept = open.panels[panel].filter((item) => !removed.has(item.id));
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
    return project.mutate(async (open) => {
      const selected = new Set(ids);
      const moving = open.panels[panel].filter((item) => selected.has(item.id));
      const applied = await applyInOrder(moving, (item) =>
        moveItem(open, panel, item),
      );

      const moved = new Set(applied.done.map((item) => item.id));
      const kept = open.panels[panel].filter((item) => !moved.has(item.id));
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

    return project.mutate(async (open) => {
      const removed = await store.removePanel(open.id, parsed.value);
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
