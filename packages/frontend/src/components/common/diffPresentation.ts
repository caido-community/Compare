import { type DiffMode, type DiffOptions, type RowKind } from "@/core/diff";

type ModeDetails = {
  title: string;
  buttonLabel: string;
  icon: string;
  unit: { one: string; other: string };
};

type ChangeDetails = { label: string; chipClass: string };

export const PRIMARY_DIFF_MODE: DiffMode = "words";

export const DIFF_MODE_DETAILS: Record<DiffMode, ModeDetails> = {
  words: {
    title: "Words",
    buttonLabel: "Compare Words",
    icon: "fas fa-spell-check",
    unit: { one: "word", other: "words" },
  },
  bytes: {
    title: "Bytes",
    buttonLabel: "Compare Bytes",
    icon: "fas fa-code",
    unit: { one: "byte", other: "bytes" },
  },
  lines: {
    title: "Lines",
    buttonLabel: "Compare Lines",
    icon: "fas fa-align-left",
    unit: { one: "line", other: "lines" },
  },
};

export const CHANGE_DETAILS: Record<RowKind, ChangeDetails> = {
  added: { label: "Added", chipClass: "bg-green-700/60 text-green-100" },
  deleted: { label: "Deleted", chipClass: "bg-red-700/60 text-red-100" },
  modified: {
    label: "Modified",
    chipClass: "bg-orange-700/60 text-orange-100",
  },
  unchanged: {
    label: "Unchanged",
    chipClass: "bg-surface-600 text-surface-100",
  },
};

export const DIFF_OPTION_LABELS: Record<keyof DiffOptions, string> = {
  ignoreWhitespace: "Ignore whitespace",
  ignoreCase: "Ignore case",
};
