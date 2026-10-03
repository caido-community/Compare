import { type Panel } from "shared";

import { buildMigrator } from "../items/migrations";
import { buildItemStore, type ItemStore } from "../items/store";

import { FIXED_TIME, TEST_ROOT } from "./fixtures";
import { buildMemoryFileSystem } from "./memoryFileSystem";

export const buildTestStorage = () => {
  const fileSystem = buildMemoryFileSystem();
  const store = buildItemStore(fileSystem, TEST_ROOT);
  const now = () => FIXED_TIME;
  const migrate = buildMigrator({ fileSystem, store, root: TEST_ROOT, now });
  return { fileSystem, store, migrate, now };
};

export const listStoredIds = async (
  store: ItemStore,
  projectId: string,
  panel: Panel,
): Promise<number[]> => {
  const read = await store.readPanel(projectId, panel);
  return read.kind === "Ok" ? read.value.map((item) => item.id) : [];
};
