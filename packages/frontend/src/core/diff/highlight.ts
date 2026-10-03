import { type ChangeObject, diffChars, diffWordsWithSpace } from "diff";

import { type DiffMode, type Segment } from "./types";

type HighlightedPair = { original: Segment[]; modified: Segment[] };

export type Highlighter = {
  highlightPair: (original: string, modified: string) => HighlightedPair;
  isComplete: () => boolean;
};

const DIFFERS = {
  words: diffWordsWithSpace,
  bytes: diffChars,
};

const markWhole = (original: string, modified: string): HighlightedPair => ({
  original: [{ text: original, kind: "modified" }],
  modified: [{ text: modified, kind: "modified" }],
});

const toSegments = (changes: ChangeObject<string>[]): HighlightedPair => {
  const pair: HighlightedPair = { original: [], modified: [] };
  for (const [index, change] of changes.entries()) {
    const text = change.value;
    if (change.removed) {
      const isReplaced = changes[index + 1]?.added === true;
      pair.original.push({ text, kind: isReplaced ? "modified" : "deleted" });
      continue;
    }
    if (change.added) {
      const isReplacement = changes[index - 1]?.removed === true;
      pair.modified.push({ text, kind: isReplacement ? "modified" : "added" });
      continue;
    }
    pair.original.push({ text, kind: "unchanged" });
    pair.modified.push({ text, kind: "unchanged" });
  }
  return pair;
};

export const buildHighlighter = (
  mode: DiffMode,
  budgetMs: number,
): Highlighter => {
  let remainingMs = budgetMs;
  let isComplete = true;

  const highlightPair = (original: string, modified: string) => {
    if (mode === "lines") return markWhole(original, modified);
    if (remainingMs <= 0) {
      isComplete = false;
      return markWhole(original, modified);
    }

    const startedAt = performance.now();
    const changes = DIFFERS[mode](original, modified, { timeout: remainingMs });
    remainingMs -= performance.now() - startedAt;
    if (changes === undefined) {
      isComplete = false;
      return markWhole(original, modified);
    }
    return toSegments(changes);
  };

  return { highlightPair, isComplete: () => isComplete };
};
