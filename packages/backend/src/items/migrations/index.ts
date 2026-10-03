import { err, ok, type Result } from "shared";
import { z } from "zod";

import { buildPath } from "../../runtime/fileSystem";
import { formatJson, readJsonFile } from "../../runtime/json";
import { CORRUPT_VERSION_MESSAGE } from "../messages";

import {
  type Migration,
  type MigrationContext,
  type MigrationOutcome,
} from "./types";
import { fromV1 } from "./v1";

const FIRST_VERSION = 1;

const CURRENT_VERSION = 2;

const MIGRATIONS: Migration[] = [{ from: 1, run: fromV1 }];

const versionFileSchema = z.object({ version: z.number().int().positive() });

const versionPath = (root: string) => buildPath(root, "version.json");

const readVersion = async (
  context: MigrationContext,
): Promise<Result<number>> => {
  const read = await readJsonFile(
    context.fileSystem,
    versionPath(context.root),
  );
  if (read.kind === "Error") return read;
  if (read.value.kind === "Missing") return ok(FIRST_VERSION);
  if (read.value.kind === "Invalid") return err(CORRUPT_VERSION_MESSAGE);

  const parsed = versionFileSchema.safeParse(read.value.value);
  if (!parsed.success) return err(CORRUPT_VERSION_MESSAGE);
  if (parsed.data.version > CURRENT_VERSION) {
    return err(
      `The stored items were written by a newer version of Compare (format ${parsed.data.version}). Update the plugin to read them.`,
    );
  }
  return ok(parsed.data.version);
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

const runMigrations = async (
  context: MigrationContext,
  from: number,
): Promise<Result<number>> => {
  let copiedItems = 0;
  for (const migration of MIGRATIONS.filter((step) => step.from >= from)) {
    const migrated = await migration.run(context);
    if (migrated.kind === "Error") return migrated;
    copiedItems += migrated.value;
  }
  return ok(copiedItems);
};

const migrateStorage = async (
  context: MigrationContext,
): Promise<Result<MigrationOutcome>> => {
  const version = await readVersion(context);
  if (version.kind === "Error") return version;

  const from = version.value;
  if (from === CURRENT_VERSION) {
    return ok({ from, to: CURRENT_VERSION, copiedItems: 0 });
  }

  const copied = await runMigrations(context, from);
  if (copied.kind === "Error") return copied;

  const written = await writeVersion(context);
  if (written.kind === "Error") return written;
  return ok({ from, to: CURRENT_VERSION, copiedItems: copied.value });
};

export const buildMigrator =
  (context: Omit<MigrationContext, "projectId">) => (projectId: string) =>
    migrateStorage({ ...context, projectId });
