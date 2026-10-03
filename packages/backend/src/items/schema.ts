import {
  type CompareItem,
  err,
  ITEM_KINDS,
  MAX_ITEM_LENGTH,
  MAX_ITEM_MEGABYTES,
  MAX_REQUESTS_PER_ADD,
  ok,
  PANELS,
  type Result,
} from "shared";
import { z } from "zod";

export const panelSchema = z.enum(PANELS);

export const kindSchema = z.enum(ITEM_KINDS);

export const storedItemSchema: z.ZodType<CompareItem> = z.object({
  id: z.number().int().positive(),
  kind: kindSchema,
  source: z.string(),
  data: z.string(),
  createdAt: z.string(),
});

export const addItemSchema = z.object({
  panel: panelSchema,
  kind: kindSchema,
  source: z.string().max(2048),
  data: z
    .string()
    .min(1, "The item is empty.")
    .max(
      MAX_ITEM_LENGTH,
      `Items larger than ${MAX_ITEM_MEGABYTES} MB are not supported.`,
    ),
});

export const addRequestsSchema = z.object({
  panel: panelSchema,
  requestIds: z
    .array(z.string())
    .min(1, "Select at least one request.")
    .max(
      MAX_REQUESTS_PER_ADD,
      `Send at most ${MAX_REQUESTS_PER_ADD} requests at once.`,
    ),
});

export const selectionSchema = z.object({
  panel: panelSchema,
  ids: z.array(z.number().int()).min(1, "Select at least one item."),
});

export const parseInput = <T>(
  schema: z.ZodType<T>,
  input: unknown,
): Result<T> => {
  const parsed = schema.safeParse(input);
  if (parsed.success) return ok(parsed.data);
  return err(parsed.error.issues[0]?.message ?? "The input is not valid.");
};
