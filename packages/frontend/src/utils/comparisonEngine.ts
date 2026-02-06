import type { ComparisonDiff, ComparisonSummary } from "backend";
import { diffChars, diffLines, diffWords } from "diff";

export type CompareOptions = {
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
};

export function normalizeForComparison(
  text: string,
  options: CompareOptions = {},
): string {
  let out = text;
  if (options.ignoreCase === true) {
    out = out.toLowerCase();
  }
  if (options.ignoreWhitespace === true) {
    out = out
      .split("\n")
      .map((line) => line.trim().replace(/\s+/g, " "))
      .join("\n");
  }
  return out;
}

type DiffChange = { value: string; added?: boolean; removed?: boolean };

function buildDiffsFromChanges(parts: DiffChange[]): {
  diffs1: ComparisonDiff[];
  diffs2: ComparisonDiff[];
} {
  const diffs1: ComparisonDiff[] = [];
  const diffs2: ComparisonDiff[] = [];
  let pos1 = 0;
  let pos2 = 0;
  let i = 0;

  while (i < parts.length) {
    const part = parts[i]!;
    const next = parts[i + 1];

    if (part.removed === true && next?.added === true) {
      const oldVal = part.value;
      const newVal = next.value;
      diffs1.push({
        type: "modified",
        content: oldVal,
        position: pos1,
        length: oldVal.length,
      });
      diffs2.push({
        type: "modified",
        content: newVal,
        position: pos2,
        length: newVal.length,
      });
      pos1 += oldVal.length;
      pos2 += newVal.length;
      i += 2;
    } else if (part.removed === true) {
      diffs1.push({
        type: "deleted",
        content: part.value,
        position: pos1,
        length: part.value.length,
      });
      pos1 += part.value.length;
      i += 1;
    } else if (part.added === true) {
      diffs2.push({
        type: "added",
        content: part.value,
        position: pos2,
        length: part.value.length,
      });
      pos2 += part.value.length;
      i += 1;
    } else {
      const value = part.value;
      if (value.length > 0) {
        diffs1.push({
          type: "unchanged",
          content: value,
          position: pos1,
          length: value.length,
        });
        diffs2.push({
          type: "unchanged",
          content: value,
          position: pos2,
          length: value.length,
        });
        pos1 += value.length;
        pos2 += value.length;
      }
      i += 1;
    }
  }

  return { diffs1, diffs2 };
}

export function compareByWords(
  text1: string,
  text2: string,
  options: CompareOptions = {},
): { diffs1: ComparisonDiff[]; diffs2: ComparisonDiff[] } {
  const a = normalizeForComparison(text1, options);
  const b = normalizeForComparison(text2, options);
  const parts = diffWords(a, b);
  return buildDiffsFromChanges(parts);
}

export function compareByBytes(
  text1: string,
  text2: string,
  options: CompareOptions = {},
): { diffs1: ComparisonDiff[]; diffs2: ComparisonDiff[] } {
  const a = normalizeForComparison(text1, options);
  const b = normalizeForComparison(text2, options);
  const parts = diffChars(a, b);
  return buildDiffsFromChanges(parts);
}

export function compareByLines(
  text1: string,
  text2: string,
  options: CompareOptions = {},
): { diffs1: ComparisonDiff[]; diffs2: ComparisonDiff[] } {
  const a = normalizeForComparison(text1, options);
  const b = normalizeForComparison(text2, options);
  const parts = diffLines(a, b);
  return buildDiffsFromChanges(parts);
}

export function computeComparisonSummary(
  diffs1: ComparisonDiff[],
  diffs2: ComparisonDiff[],
  mode: "words" | "bytes" | "lines",
): ComparisonSummary {
  const summary: ComparisonSummary = {
    unchanged: 0,
    modified: 0,
    added: 0,
    deleted: 0,
  };

  if (mode === "words" || mode === "lines") {
    for (const d of diffs1) {
      summary[d.type] += 1;
    }
    for (const d of diffs2) {
      if (d.type === "added") {
        summary.added += 1;
      }
    }
  } else {
    for (const d of diffs1) {
      summary[d.type] += d.length;
    }
    for (const d of diffs2) {
      if (d.type === "added") {
        summary.added += d.length;
      }
    }
  }

  return summary;
}
