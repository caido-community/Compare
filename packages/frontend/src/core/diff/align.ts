import { diffArrays } from "diff";

import { type DiffOptions } from "./types";

export type LineBlock = {
  kind: "unchanged" | "changed";
  original: number[];
  modified: number[];
};

export type Alignment = { blocks: LineBlock[]; isComplete: boolean };

const range = (start: number, count: number): number[] =>
  Array.from({ length: count }, (_, offset) => start + offset);

export const splitLines = (text: string): string[] => text.split(/\r?\n/);

const normalizeLine = (line: string, options: DiffOptions): string => {
  const cased = options.ignoreCase ? line.toLowerCase() : line;
  return options.ignoreWhitespace ? cased.trim().replace(/\s+/g, " ") : cased;
};

const openChangedBlock = (blocks: LineBlock[]): LineBlock => {
  const last = blocks.at(-1);
  if (last?.kind === "changed") return last;

  const block: LineBlock = { kind: "changed", original: [], modified: [] };
  blocks.push(block);
  return block;
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
  for (const { added, removed, count } of changes) {
    if (!added && !removed) {
      blocks.push({
        kind: "unchanged",
        original: range(originalIndex, count),
        modified: range(modifiedIndex, count),
      });
      originalIndex += count;
      modifiedIndex += count;
      continue;
    }

    const block = openChangedBlock(blocks);
    if (removed) {
      block.original = block.original.concat(range(originalIndex, count));
      originalIndex += count;
    }
    if (added) {
      block.modified = block.modified.concat(range(modifiedIndex, count));
      modifiedIndex += count;
    }
  }
  return blocks;
};

const alignByPosition = (original: string[], modified: string[]): LineBlock[] =>
  range(0, Math.max(original.length, modified.length)).map((index) => ({
    kind: original[index] === modified[index] ? "unchanged" : "changed",
    original: index < original.length ? [index] : [],
    modified: index < modified.length ? [index] : [],
  }));

export const alignLines = (
  original: string[],
  modified: string[],
  options: DiffOptions,
  timeoutMs: number,
): Alignment => {
  const normalizedOriginal = original.map((line) =>
    normalizeLine(line, options),
  );
  const normalizedModified = modified.map((line) =>
    normalizeLine(line, options),
  );
  const blocks = alignByDiff(normalizedOriginal, normalizedModified, timeoutMs);
  if (blocks !== undefined) return { blocks, isComplete: true };
  return {
    blocks: alignByPosition(normalizedOriginal, normalizedModified),
    isComplete: false,
  };
};
