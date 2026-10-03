import { type Panel } from "shared";

export const DIFF_MODES = ["words", "bytes", "lines"] as const;

export type DiffMode = (typeof DIFF_MODES)[number];

export type InlineDiffMode = Exclude<DiffMode, "lines">;

export type DiffOptions = {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
};

export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  ignoreWhitespace: false,
  ignoreCase: false,
};

export type DiffInput = {
  original: string;
  modified: string;
  mode: DiffMode;
  options: DiffOptions;
};

export type DiffBudgets = {
  alignmentMs: number;
  highlightMs: number;
};

export type Sides<T> = Record<Panel, T>;

export const ROW_KINDS = ["added", "deleted", "modified", "unchanged"] as const;

export type RowKind = (typeof ROW_KINDS)[number];

export type Segment = { text: string; kind: RowKind };

export type Cell = { lineNumber: number; segments: Segment[] };

export type Row = { kind: RowKind } & Sides<Cell | undefined>;

export type DiffSummary = Record<RowKind, number>;

export type DiffResult = {
  mode: DiffMode;
  rows: Row[];
  summary: DiffSummary;
  isAlignmentComplete: boolean;
  isHighlightingComplete: boolean;
};
