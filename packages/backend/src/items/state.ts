import {
  type CompareItem,
  err,
  getOtherPanel,
  ok,
  type Panel,
  type Result,
} from "shared";

import { buildMutex } from "../runtime/mutex";

import { NO_PROJECT_MESSAGE } from "./messages";
import { type MigrationOutcome } from "./migrations/types";
import { type ItemStore } from "./store";

export type ItemDraft = Omit<CompareItem, "id" | "createdAt">;

type Panels = Record<Panel, CompareItem[]>;

const EMPTY_PANELS: Panels = { original: [], modified: [] };

export type ItemState = {
  open: (projectId: string) => Promise<Result<MigrationOutcome>>;
  close: () => Promise<void>;
  list: (panel: Panel) => Promise<CompareItem[]>;
  add: (panel: Panel, drafts: ItemDraft[]) => Promise<Result<CompareItem[]>>;
  remove: (panel: Panel, ids: number[]) => Promise<Result<number[]>>;
  move: (from: Panel, ids: number[]) => Promise<Result<CompareItem[]>>;
  clear: (panel: Panel) => Promise<Result<Panel>>;
};

export const buildItemState = (deps: {
  store: ItemStore;
  migrate: (projectId: string) => Promise<Result<MigrationOutcome>>;
  now: () => string;
  notifyChange: () => void;
}): ItemState => {
  const queue = buildMutex();
  let projectId: string | undefined = undefined;
  let panels: Panels = EMPTY_PANELS;

  const finish = <T>(hasChanged: boolean, result: Result<T>): Result<T> => {
    if (hasChanged) deps.notifyChange();
    return result;
  };

  const getNextId = (): number => {
    const ids = [...panels.original, ...panels.modified].map((item) => item.id);
    return Math.max(0, ...ids) + 1;
  };

  const setPanel = (panel: Panel, items: CompareItem[]) => {
    panels = { ...panels, [panel]: items };
  };

  const loadPanels = async (id: string): Promise<Result<Panels>> => {
    const original = await deps.store.readPanel(id, "original");
    if (original.kind === "Error") return original;

    const modified = await deps.store.readPanel(id, "modified");
    if (modified.kind === "Error") return modified;

    return ok({ original: original.value, modified: modified.value });
  };

  const open = (id: string) =>
    queue(async (): Promise<Result<MigrationOutcome>> => {
      projectId = undefined;
      panels = EMPTY_PANELS;

      const migrated = await deps.migrate(id);
      if (migrated.kind === "Error") return finish(true, migrated);

      const loaded = await loadPanels(id);
      if (loaded.kind === "Error") return finish(true, loaded);

      projectId = id;
      panels = loaded.value;
      return finish(true, migrated);
    });

  const close = () =>
    queue(() => {
      projectId = undefined;
      panels = EMPTY_PANELS;
      deps.notifyChange();
      return Promise.resolve();
    });

  const list = (panel: Panel) => queue(() => Promise.resolve(panels[panel]));

  const add = (panel: Panel, drafts: ItemDraft[]) =>
    queue(async (): Promise<Result<CompareItem[]>> => {
      if (projectId === undefined) return err(NO_PROJECT_MESSAGE);

      const added: CompareItem[] = [];
      for (const draft of drafts) {
        const item = { ...draft, id: getNextId(), createdAt: deps.now() };
        const written = await deps.store.writeItem(projectId, panel, item);
        if (written.kind === "Error") return finish(added.length > 0, written);

        setPanel(panel, [...panels[panel], item]);
        added.push(item);
      }
      return finish(added.length > 0, ok(added));
    });

  const remove = (panel: Panel, ids: number[]) =>
    queue(async (): Promise<Result<number[]>> => {
      if (projectId === undefined) return err(NO_PROJECT_MESSAGE);

      const existing = ids.filter((id) =>
        panels[panel].some((item) => item.id === id),
      );
      const removed: number[] = [];
      for (const id of existing) {
        const result = await deps.store.removeItem(projectId, panel, id);
        if (result.kind === "Error") return finish(removed.length > 0, result);

        setPanel(
          panel,
          panels[panel].filter((item) => item.id !== id),
        );
        removed.push(id);
      }
      return finish(removed.length > 0, ok(removed));
    });

  const moveItem = async (
    id: string,
    from: Panel,
    item: CompareItem,
  ): Promise<Result<CompareItem>> => {
    const to = getOtherPanel(from);
    const written = await deps.store.writeItem(id, to, item);
    if (written.kind === "Error") return written;

    const removed = await deps.store.removeItem(id, from, item.id);
    if (removed.kind === "Ok") return ok(item);

    await deps.store.removeItem(id, to, item.id);
    return removed;
  };

  const move = (from: Panel, ids: number[]) =>
    queue(async (): Promise<Result<CompareItem[]>> => {
      if (projectId === undefined) return err(NO_PROJECT_MESSAGE);

      const to = getOtherPanel(from);
      const moving = panels[from].filter((item) => ids.includes(item.id));
      const moved: CompareItem[] = [];
      for (const item of moving) {
        const result = await moveItem(projectId, from, item);
        if (result.kind === "Error") return finish(moved.length > 0, result);

        setPanel(
          from,
          panels[from].filter((other) => other.id !== item.id),
        );
        setPanel(
          to,
          [...panels[to], item].sort((a, b) => a.id - b.id),
        );
        moved.push(item);
      }
      return finish(moved.length > 0, ok(moved));
    });

  const clear = (panel: Panel) =>
    queue(async (): Promise<Result<Panel>> => {
      if (projectId === undefined) return err(NO_PROJECT_MESSAGE);

      const removed = await deps.store.removePanel(projectId, panel);
      if (removed.kind === "Error") return removed;

      setPanel(panel, []);
      return finish(true, removed);
    });

  return { open, close, list, add, remove, move, clear };
};
