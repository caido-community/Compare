import { type CompareItem, err, ok, type Panel, type Result } from "shared";

import { buildMutex } from "../runtime/mutex";

import { NO_PROJECT_MESSAGE } from "./messages";
import { type MigrationOutcome } from "./migrations/types";
import { hasSameItems, type Panels } from "./panels";
import { type ItemStore } from "./store";

export type OpenProject = { id: string; panels: Panels };

type LoadedProject = { project: OpenProject; migration: MigrationOutcome };

export type Mutation<T> = { panels: Panels; result: Result<T> };

export type ProjectState = {
  open: (projectId: string) => Promise<Result<MigrationOutcome>>;
  close: () => Promise<void>;
  readPanel: (panel: Panel) => Promise<CompareItem[]>;
  mutate: <T>(
    operation: (project: OpenProject) => Promise<Mutation<T>>,
  ) => Promise<Result<T>>;
};

export const buildProjectState = (deps: {
  store: ItemStore;
  migrate: (projectId: string) => Promise<Result<MigrationOutcome>>;
  notifyChange: () => void;
}): ProjectState => {
  const serialise = buildMutex();
  let current: OpenProject | undefined = undefined;

  const commit = (project: OpenProject | undefined) => {
    current = project;
    deps.notifyChange();
  };

  const loadPanels = async (projectId: string): Promise<Result<Panels>> => {
    const original = await deps.store.readPanel(projectId, "original");
    if (original.kind === "Error") return original;

    const modified = await deps.store.readPanel(projectId, "modified");
    if (modified.kind === "Error") return modified;

    return ok({ original: original.value, modified: modified.value });
  };

  const loadProject = async (
    projectId: string,
  ): Promise<Result<LoadedProject>> => {
    const migrated = await deps.migrate(projectId);
    if (migrated.kind === "Error") return migrated;

    const panels = await loadPanels(projectId);
    if (panels.kind === "Error") return panels;

    return ok({
      project: { id: projectId, panels: panels.value },
      migration: migrated.value,
    });
  };

  const openProject = async (
    projectId: string,
  ): Promise<Result<MigrationOutcome>> => {
    const loaded = await loadProject(projectId);
    commit(loaded.kind === "Ok" ? loaded.value.project : undefined);
    return loaded.kind === "Ok" ? ok(loaded.value.migration) : loaded;
  };

  const closeProject = (): Promise<void> => {
    commit(undefined);
    return Promise.resolve();
  };

  const readPanel = (panel: Panel): Promise<CompareItem[]> =>
    Promise.resolve(current?.panels[panel] ?? []);

  const mutate = async <T>(
    operation: (project: OpenProject) => Promise<Mutation<T>>,
  ): Promise<Result<T>> => {
    if (current === undefined) return err(NO_PROJECT_MESSAGE);

    const project = current;
    const { panels, result } = await operation(project);
    if (!hasSameItems(project.panels, panels)) commit({ ...project, panels });
    return result;
  };

  return {
    open: (projectId) => serialise(() => openProject(projectId)),
    close: () => serialise(closeProject),
    readPanel: (panel) => serialise(() => readPanel(panel)),
    mutate: (operation) => serialise(() => mutate(operation)),
  };
};
