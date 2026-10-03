import {
  type AddFileItemInput,
  type AddItemInput,
  type AddRequestsInput,
  type CompareItem,
  err,
  ITEM_KINDS,
  ITEM_TOO_LARGE_MESSAGE,
  type ItemSelection,
  MAX_ITEM_BYTES,
  MAX_REQUESTS_PER_ADD,
  measureBytes,
  ok,
  PANELS,
  type Result,
} from "shared";
import { z } from "zod";

import { EMPTY_ITEM_MESSAGE } from "./messages";

export const panelSchema = z.enum(PANELS);

export const kindSchema = z.enum(ITEM_KINDS);

export const idSchema = z.number().int().positive();

const targetSchema = z.object({
  panel: panelSchema,
  kind: kindSchema,
  source: z.string(),
});

const dataSchema = z
  .string()
  .min(1, EMPTY_ITEM_MESSAGE)
  .refine(
    (data) => measureBytes(data) <= MAX_ITEM_BYTES,
    ITEM_TOO_LARGE_MESSAGE,
  );

export const storedItemSchema: z.ZodType<CompareItem> = z.object({
  id: idSchema,
  kind: kindSchema,
  source: z.string(),
  data: z.string(),
  createdAt: z.string(),
});

export const addItemSchema: z.ZodType<AddItemInput> = targetSchema.extend({
  data: dataSchema,
});

export const addFileItemSchema: z.ZodType<AddFileItemInput> =
  targetSchema.extend({
    path: z.string().min(1, "The uploaded file has no path."),
  });

export const addRequestsSchema: z.ZodType<AddRequestsInput> = z.object({
  panel: panelSchema,
  requestIds: z
    .array(z.string())
    .min(1, "Select at least one request.")
    .max(
      MAX_REQUESTS_PER_ADD,
      `Send at most ${MAX_REQUESTS_PER_ADD} requests at once.`,
    ),
});

export const selectionSchema: z.ZodType<ItemSelection> = z.object({
  panel: panelSchema,
  ids: z.array(idSchema).min(1, "Select at least one item."),
});

export const parseInput = <T>(
  schema: z.ZodType<T>,
  input: unknown,
): Result<T> => {
  const parsed = schema.safeParse(input);
  if (parsed.success) return ok(parsed.data);
  return err(parsed.error.issues[0]?.message ?? "The input is not valid.");
};
