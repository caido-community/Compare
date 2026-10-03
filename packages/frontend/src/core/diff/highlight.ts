import { type ChangeObject, diffChars, diffWordsWithSpace } from "diff";

import {
  type DiffMode,
  type InlineDiffMode,
  type Segment,
  type Sides,
} from "./types";

type HighlightedPair = Sides<Segment[]>;

type Differ = (
  original: string,
  modified: string,
  options: { timeout: number },
) => ChangeObject<string>[] | undefined;

export type Highlighter = {
  highlightPair: (original: string, modified: string) => HighlightedPair;
  isComplete: () => boolean;
};

const DIFFERS: Record<InlineDiffMode, Differ> = {
  words: diffWordsWithSpace,
  bytes: diffChars,
};

const markWhole = (original: string, modified: string): HighlightedPair => ({
  original: [{ text: original, kind: "modified" }],
  modified: [{ text: modified, kind: "modified" }],
});

const buildHighlightedPair = (
  changes: ChangeObject<string>[],
): HighlightedPair => {
  const pair: HighlightedPair = { original: [], modified: [] };
  for (const [index, change] of changes.entries()) {
    if (change.removed) {
      const isReplaced = changes[index + 1]?.added === true;
      const kind = isReplaced ? "modified" : "deleted";
      pair.original.push({ text: change.value, kind });
      continue;
    }
    if (change.added) {
      const isReplacement = changes[index - 1]?.removed === true;
      const kind = isReplacement ? "modified" : "added";
      pair.modified.push({ text: change.value, kind });
      continue;
    }
    pair.original.push({ text: change.value, kind: "unchanged" });
    pair.modified.push({ text: change.value, kind: "unchanged" });
  }
  return pair;
};

const buildBudgetedHighlighter = (
  differ: Differ,
  budgetMs: number,
): Highlighter => {
  let remainingMs = budgetMs;
  let hasRunOut = false;

  const highlightPair = (original: string, modified: string) => {
    if (remainingMs <= 0) {
      hasRunOut = true;
      return markWhole(original, modified);
    }

    const startedAt = performance.now();
    const changes = differ(original, modified, { timeout: remainingMs });
    remainingMs -= performance.now() - startedAt;
    if (changes === undefined) {
      hasRunOut = true;
      return markWhole(original, modified);
    }
    return buildHighlightedPair(changes);
  };

  return { highlightPair, isComplete: () => !hasRunOut };
};

export const buildHighlighter = (
  mode: DiffMode,
  budgetMs: number,
): Highlighter =>
  mode === "lines"
    ? { highlightPair: markWhole, isComplete: () => true }
    : buildBudgetedHighlighter(DIFFERS[mode], budgetMs);
