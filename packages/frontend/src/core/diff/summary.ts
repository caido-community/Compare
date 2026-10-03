import { measureBytes } from "shared";

import { type DiffMode, type DiffSummary, type Row } from "./types";

type UnitCounter = (text: string) => number;

const WORD_PATTERN = /[\p{L}\p{N}_]+/gu;

const UNIT_COUNTERS: Record<Exclude<DiffMode, "lines">, UnitCounter> = {
  words: (text) => text.match(WORD_PATTERN)?.length ?? 0,
  bytes: measureBytes,
};

const buildEmptySummary = (): DiffSummary => ({
  added: 0,
  deleted: 0,
  modified: 0,
  unchanged: 0,
});

const countLines = (rows: Row[]): DiffSummary => {
  const summary = buildEmptySummary();
  for (const row of rows) summary[row.kind] += 1;
  return summary;
};

const countUnits = (rows: Row[], count: UnitCounter): DiffSummary => {
  const summary = buildEmptySummary();
  for (const row of rows) {
    for (const segment of row.original?.segments ?? []) {
      summary[segment.kind] += count(segment.text);
    }
    for (const segment of row.modified?.segments ?? []) {
      if (segment.kind === "added") summary.added += count(segment.text);
    }
  }
  return summary;
};

export const summarize = (rows: Row[], mode: DiffMode): DiffSummary =>
  mode === "lines" ? countLines(rows) : countUnits(rows, UNIT_COUNTERS[mode]);
