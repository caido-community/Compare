import { type DiffMode, type DiffOptions, type RowKind } from "@/core/diff";
import { type Unit } from "@/presentation/format";

type ModeDetails = {
  title: string;
  buttonLabel: string;
  icon: string;
  unit: Unit;
};

type ChangeDetails = { label: string; chipClass: string; rowClass: string };

type ViewOption = "isWrapped" | "isSynced";

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
  added: {
    label: "Added",
    chipClass: "bg-green-700/60 text-green-100",
    rowClass: "bg-green-900/40",
  },
  deleted: {
    label: "Deleted",
    chipClass: "bg-red-700/60 text-red-100",
    rowClass: "bg-red-900/40",
  },
  modified: {
    label: "Modified",
    chipClass: "bg-orange-700/60 text-orange-100",
    rowClass: "bg-orange-900/30",
  },
  unchanged: {
    label: "Unchanged",
    chipClass: "bg-surface-600 text-surface-100",
    rowClass: "",
  },
};

export const FILLER_ROW_CLASS = "bg-surface-800/60";

export const DIFF_OPTION_LABELS: Record<keyof DiffOptions, string> = {
  ignoreWhitespace: "Ignore whitespace",
  ignoreCase: "Ignore case",
};

export const VIEW_OPTION_LABELS: Record<ViewOption, string> = {
  isWrapped: "Wrap lines",
  isSynced: "Sync Views",
};
