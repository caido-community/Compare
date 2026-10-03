import { mapPanels, type Panel } from "shared";

import { type DiffMode, type DiffOptions, type RowKind } from "@/utils/diff";

export type Unit = { one: string; other: string };

type PanelAction = "paste" | "load" | "remove" | "clear" | "move";

type ModeDetails = {
  title: string;
  buttonLabel: string;
  icon: string;
  unit: Unit;
};

type ChangeDetails = { label: string; chipClass: string; rowClass: string };

export const PLUGIN_NAME = __PLUGIN_NAME__;

export const PLUGIN_ICON = "fas fa-columns";

export const INFO_ICON = "fas fa-circle-info";

export const ITEM_UNIT: Unit = { one: "item", other: "items" };

export const PANEL_TITLES: Record<Panel, string> = {
  original: "Original",
  modified: "Modified",
};

export const SEND_LABELS = mapPanels(
  (panel) => `Send to ${PANEL_TITLES[panel]}`,
);

export const PANEL_ACTIONS: Record<
  PanelAction,
  { label: string; icon: string }
> = {
  paste: { label: "Paste", icon: "fas fa-paste" },
  load: { label: "Load", icon: "fas fa-folder-open" },
  remove: { label: "Remove", icon: "fas fa-trash" },
  clear: { label: "Clear", icon: "fas fa-times" },
  move: { label: "Move", icon: "fas fa-exchange-alt" },
};

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

export const VIEW_OPTION_LABELS = {
  isWrapped: "Wrap lines",
  isSynced: "Sync Views",
};
