export const DIFF_MODES = ["words", "bytes", "lines"] as const;

export type DiffMode = (typeof DIFF_MODES)[number];

export type DiffOptions = {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
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

export const ROW_KINDS = ["added", "deleted", "modified", "unchanged"] as const;

export type RowKind = (typeof ROW_KINDS)[number];

export type Segment = { text: string; kind: RowKind };

export type Cell = { lineNumber: number; segments: Segment[] };

export type Row = {
  kind: RowKind;
  original: Cell | undefined;
  modified: Cell | undefined;
};

export type DiffSummary = Record<RowKind, number>;

export type DiffResult = {
  mode: DiffMode;
  rows: Row[];
  summary: DiffSummary;
  isAlignmentComplete: boolean;
  isHighlightingComplete: boolean;
};
