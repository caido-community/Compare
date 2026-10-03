import { type CompareItem, ok, type Panel, PANELS, type Result } from "shared";
import { z } from "zod";

import { buildPath } from "../../runtime/fileSystem";
import { readJsonDirectory } from "../../runtime/json";
import { mapInOrder } from "../../runtime/sequence";
import { idSchema, kindSchema } from "../schema";

import { type MigrationContext } from "./types";

const V1_DIRECTORIES: Record<Panel, string> = {
  original: "panel1",
  modified: "panel2",
};

const V1_UNKNOWN_SOURCE = "Imported from an earlier version";

const v1ItemSchema = z.object({
  id: idSchema,
  type: kindSchema,
  data: z.string(),
  source: z.string().optional(),
  timestamp: z.string().optional(),
});

type V1Item = z.infer<typeof v1ItemSchema>;

const buildItem = (v1: V1Item, now: string): CompareItem => ({
  id: v1.id,
  kind: v1.type,
  source: v1.source ?? V1_UNKNOWN_SOURCE,
  data: v1.data,
  createdAt: v1.timestamp ?? now,
});

const readV1Panel = async (
  context: MigrationContext,
  panel: Panel,
): Promise<Result<CompareItem[]>> => {
  const directory = buildPath(context.root, V1_DIRECTORIES[panel]);
  const read = await readJsonDirectory(context.fileSystem, directory);
  if (read.kind === "Error") return read;

  return ok(
    read.value.flatMap((content) => {
      const parsed = v1ItemSchema.safeParse(content);
      return parsed.success ? [buildItem(parsed.data, context.now())] : [];
    }),
  );
};

const copyV1Panel = async (
  context: MigrationContext,
  panel: Panel,
): Promise<Result<number>> => {
  const v1Items = await readV1Panel(context, panel);
  if (v1Items.kind === "Error") return v1Items;

  const existing = await context.store.readPanel(context.projectId, panel);
  if (existing.kind === "Error") return existing;

  const existingIds = new Set(existing.value.map((item) => item.id));
  const missing = v1Items.value.filter((item) => !existingIds.has(item.id));
  const written = await mapInOrder(missing, (item) =>
    context.store.writeItem(context.projectId, panel, item),
  );
  return written.kind === "Error" ? written : ok(written.value.length);
};

export const fromV1 = async (
  context: MigrationContext,
): Promise<Result<number>> => {
  const copied = await mapInOrder([...PANELS], (panel) =>
    copyV1Panel(context, panel),
  );
  if (copied.kind === "Error") return copied;
  return ok(copied.value.reduce((total, count) => total + count, 0));
};
