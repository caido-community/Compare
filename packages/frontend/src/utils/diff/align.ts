import { type ArrayChange, diffArrays } from "diff";

import { type DiffOptions, type Sides } from "./types";

export type LineBlock = { kind: "unchanged" | "changed" } & Sides<number[]>;

export type Alignment = { blocks: LineBlock[]; isComplete: boolean };

const range = (start: number, count: number): number[] =>
  Array.from({ length: count }, (_, offset) => start + offset);

export const splitLines = (text: string): string[] => text.split(/\r?\n/);

const normalizeLine = (line: string, options: DiffOptions): string => {
  const cased = options.ignoreCase ? line.toLowerCase() : line;
  return options.ignoreWhitespace ? cased.trim().replace(/\s+/g, " ") : cased;
};

const normalizeLines = (lines: string[], options: DiffOptions): string[] =>
  lines.map((line) => normalizeLine(line, options));

const buildBlock = (
  change: ArrayChange<string>,
  originalIndex: number,
  modifiedIndex: number,
): LineBlock => ({
  kind: change.added || change.removed ? "changed" : "unchanged",
  original: change.added ? [] : range(originalIndex, change.count),
  modified: change.removed ? [] : range(modifiedIndex, change.count),
});

const joinBlocks = (first: LineBlock, second: LineBlock): LineBlock => ({
  kind: "changed",
  original: first.original.concat(second.original),
  modified: first.modified.concat(second.modified),
});

const mergeChangedBlocks = (blocks: LineBlock[]): LineBlock[] => {
  const merged: LineBlock[] = [];
  for (const block of blocks) {
    const last = merged.at(-1);
    if (last?.kind === "changed" && block.kind === "changed") {
      merged[merged.length - 1] = joinBlocks(last, block);
      continue;
    }
    merged.push(block);
  }
  return merged;
};

const alignByDiff = (
  original: string[],
  modified: string[],
  timeoutMs: number,
): LineBlock[] | undefined => {
  const changes = diffArrays(original, modified, { timeout: timeoutMs });
  if (changes === undefined) return undefined;

  const blocks: LineBlock[] = [];
  let originalIndex = 0;
  let modifiedIndex = 0;
  for (const change of changes) {
    const block = buildBlock(change, originalIndex, modifiedIndex);
    blocks.push(block);
    originalIndex += block.original.length;
    modifiedIndex += block.modified.length;
  }
  return mergeChangedBlocks(blocks);
};

const alignByPosition = (original: string[], modified: string[]): LineBlock[] =>
  range(0, Math.max(original.length, modified.length)).map((index) => ({
    kind: original[index] === modified[index] ? "unchanged" : "changed",
    original: index < original.length ? [index] : [],
    modified: index < modified.length ? [index] : [],
  }));

export const alignLines = (
  lines: Sides<string[]>,
  options: DiffOptions,
  timeoutMs: number,
): Alignment => {
  const original = normalizeLines(lines.original, options);
  const modified = normalizeLines(lines.modified, options);
  const blocks = alignByDiff(original, modified, timeoutMs);
  if (blocks !== undefined) return { blocks, isComplete: true };
  return { blocks: alignByPosition(original, modified), isComplete: false };
};
