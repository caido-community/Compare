import { type Result } from "shared";

import { type FileSystem } from "../../runtime/fileSystem";
import { type ItemStore } from "../store";

export type MigrationContext = {
  fileSystem: FileSystem;
  store: ItemStore;
  root: string;
  projectId: string;
  now: () => string;
};

export type MigrationOutcome = {
  from: number;
  to: number;
  copiedItems: number;
};

export type Migration = {
  from: number;
  run: (context: MigrationContext) => Promise<Result<number>>;
};
