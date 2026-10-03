import { type CompareItem, err, ok, type Panel, type Result } from "shared";

import { buildPath, type FileSystem } from "../runtime/fileSystem";
import { formatJson, readJsonDirectory } from "../runtime/json";

import { sortById } from "./panels";
import { storedItemSchema } from "./schema";

export type ItemStore = {
  readPanel: (
    projectId: string,
    panel: Panel,
  ) => Promise<Result<CompareItem[]>>;
  writeItem: (
    projectId: string,
    panel: Panel,
    item: CompareItem,
  ) => Promise<Result<CompareItem>>;
  removeItem: (
    projectId: string,
    panel: Panel,
    id: number,
  ) => Promise<Result<number>>;
  removePanel: (projectId: string, panel: Panel) => Promise<Result<Panel>>;
};

const toItems = (contents: unknown[]): CompareItem[] =>
  sortById(
    contents.flatMap((content) => {
      const parsed = storedItemSchema.safeParse(content);
      return parsed.success ? [parsed.data] : [];
    }),
  );

export const buildItemStore = (
  fileSystem: FileSystem,
  root: string,
): ItemStore => {
  const panelPath = (projectId: string, panel: Panel) =>
    buildPath(root, "projects", projectId, panel);

  const itemPath = (projectId: string, panel: Panel, id: number) =>
    buildPath(panelPath(projectId, panel), `${id}.json`);

  return {
    readPanel: async (projectId, panel) => {
      const read = await readJsonDirectory(
        fileSystem,
        panelPath(projectId, panel),
      );
      if (read.kind === "Error") {
        return err(`The ${panel} items could not be read: ${read.error}`);
      }
      return ok(toItems(read.value));
    },

    writeItem: async (projectId, panel, item) => {
      const written = await fileSystem.writeTextFile(
        itemPath(projectId, panel, item.id),
        formatJson(item),
      );
      if (written.kind === "Failed") {
        return err(`The item could not be saved: ${written.message}`);
      }
      return ok(item);
    },

    removeItem: async (projectId, panel, id) => {
      const removed = await fileSystem.removeFile(
        itemPath(projectId, panel, id),
      );
      if (removed.kind === "Failed") {
        return err(`The item could not be removed: ${removed.message}`);
      }
      return ok(id);
    },

    removePanel: async (projectId, panel) => {
      const removed = await fileSystem.removeDirectory(
        panelPath(projectId, panel),
      );
      if (removed.kind === "Failed") {
        return err(
          `The ${panel} items could not be cleared: ${removed.message}`,
        );
      }
      return ok(panel);
    },
  };
};
