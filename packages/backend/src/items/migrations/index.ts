import { err, ok, type Result } from "shared";
import { z } from "zod";

import { buildPath, type FileSystem } from "../../runtime/fileSystem";
import { formatJson, readJsonFile } from "../../runtime/json";
import { type ItemStore } from "../store";

import { fromV1 } from "./v1";

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

type Migration = {
  from: number;
  run: (context: MigrationContext) => Promise<Result<number>>;
};

const CURRENT_VERSION = 2;

const MIGRATIONS: Migration[] = [{ from: 1, run: fromV1 }];

const versionPath = (root: string) => buildPath(root, "version.json");

const versionFileSchema = z.object({ version: z.number().int() });

const readVersion = async (
  context: MigrationContext,
): Promise<Result<number>> => {
  const read = await readJsonFile(
    context.fileSystem,
    versionPath(context.root),
  );
  if (read.kind === "Error") return read;

  const parsed = versionFileSchema.safeParse(read.value);
  if (!parsed.success) return ok(1);

  const { version } = parsed.data;
  if (version > CURRENT_VERSION) {
    return err(
      `The stored items were written by a newer version of Compare (format ${version}). Update the plugin to read them.`,
    );
  }
  return ok(version);
};

const writeVersion = async (
  context: MigrationContext,
): Promise<Result<number>> => {
  const written = await context.fileSystem.writeTextFile(
    versionPath(context.root),
    formatJson({ version: CURRENT_VERSION }),
  );
  if (written.kind === "Failed") {
    return err(`The storage version could not be saved: ${written.message}`);
  }
  return ok(CURRENT_VERSION);
};

export const migrateStorage = async (
  context: MigrationContext,
): Promise<Result<MigrationOutcome>> => {
  const version = await readVersion(context);
  if (version.kind === "Error") return version;

  const from = version.value;
  if (from === CURRENT_VERSION) {
    return ok({ from, to: CURRENT_VERSION, copiedItems: 0 });
  }

  let copiedItems = 0;
  for (const migration of MIGRATIONS.filter((step) => step.from >= from)) {
    const migrated = await migration.run(context);
    if (migrated.kind === "Error") return migrated;
    copiedItems += migrated.value;
  }

  const written = await writeVersion(context);
  if (written.kind === "Error") return written;
  return ok({ from, to: CURRENT_VERSION, copiedItems });
};
