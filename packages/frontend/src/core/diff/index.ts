import { alignLines, type LineBlock, splitLines } from "./align";
import { buildHighlighter, type Highlighter } from "./highlight";
import { summarize } from "./summary";
import {
  type Cell,
  type DiffBudgets,
  type DiffInput,
  type DiffResult,
  type Row,
  type RowKind,
} from "./types";

export { DIFF_MODES, ROW_KINDS } from "./types";

export type {
  DiffInput,
  DiffMode,
  DiffOptions,
  DiffResult,
  Row,
  RowKind,
  Segment,
} from "./types";

type Lines = { original: string[]; modified: string[] };

const DEFAULT_BUDGETS: DiffBudgets = { alignmentMs: 10_000, highlightMs: 3000 };

const buildCell = (
  lines: string[],
  index: number | undefined,
  kind: RowKind,
): Cell | undefined =>
  index === undefined
    ? undefined
    : { lineNumber: index + 1, segments: [{ text: lines[index] ?? "", kind }] };

const highlightRow = (
  lines: Lines,
  originalIndex: number,
  modifiedIndex: number,
  highlighter: Highlighter,
): Row => {
  const pair = highlighter.highlightPair(
    lines.original[originalIndex] ?? "",
    lines.modified[modifiedIndex] ?? "",
  );
  return {
    kind: "modified",
    original: { lineNumber: originalIndex + 1, segments: pair.original },
    modified: { lineNumber: modifiedIndex + 1, segments: pair.modified },
  };
};

const buildRow = (
  block: LineBlock,
  offset: number,
  lines: Lines,
  highlighter: Highlighter,
): Row => {
  const originalIndex = block.original[offset];
  const modifiedIndex = block.modified[offset];
  if (block.kind === "unchanged") {
    return {
      kind: "unchanged",
      original: buildCell(lines.original, originalIndex, "unchanged"),
      modified: buildCell(lines.modified, modifiedIndex, "unchanged"),
    };
  }
  if (originalIndex === undefined) {
    const modified = buildCell(lines.modified, modifiedIndex, "added");
    return { kind: "added", original: undefined, modified };
  }
  if (modifiedIndex === undefined) {
    const original = buildCell(lines.original, originalIndex, "deleted");
    return { kind: "deleted", original, modified: undefined };
  }
  return highlightRow(lines, originalIndex, modifiedIndex, highlighter);
};

const buildRows = (
  block: LineBlock,
  lines: Lines,
  highlighter: Highlighter,
): Row[] => {
  const count = Math.max(block.original.length, block.modified.length);
  return Array.from({ length: count }, (_, offset) =>
    buildRow(block, offset, lines, highlighter),
  );
};

export const compareTexts = (
  input: DiffInput,
  budgets: DiffBudgets = DEFAULT_BUDGETS,
): DiffResult => {
  const lines = {
    original: splitLines(input.original),
    modified: splitLines(input.modified),
  };
  const alignment = alignLines(
    lines.original,
    lines.modified,
    input.options,
    budgets.alignmentMs,
  );
  const highlighter = buildHighlighter(input.mode, budgets.highlightMs);
  const rows = alignment.blocks.flatMap((block) =>
    buildRows(block, lines, highlighter),
  );

  return {
    mode: input.mode,
    rows,
    summary: summarize(rows, input.mode),
    isAlignmentComplete: alignment.isComplete,
    isHighlightingComplete: highlighter.isComplete(),
  };
};
