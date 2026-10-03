import { type CompareItem } from "shared";

import {
  compareTexts,
  DEFAULT_DIFF_OPTIONS,
  type DiffResult,
} from "@/utils/diff";

const FIXED_TIME = "2026-10-03T00:00:00.000Z";

export const buildItem = (id: number, data = `item ${id}`): CompareItem => ({
  id,
  kind: "clipboard",
  source: "clipboard",
  data,
  createdAt: FIXED_TIME,
});

export const buildDiffResult = (original = "a", modified = "a"): DiffResult =>
  compareTexts({
    original,
    modified,
    mode: "words",
    options: DEFAULT_DIFF_OPTIONS,
  });
