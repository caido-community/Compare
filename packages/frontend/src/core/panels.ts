import { type Panel } from "shared";

export const PANEL_TITLES: Record<Panel, string> = {
  original: "Original",
  modified: "Modified",
};

export const getSendLabel = (panel: Panel): string =>
  `Send to ${PANEL_TITLES[panel]}`;

export const PANEL_ACTION_LABELS = {
  paste: "Paste",
  load: "Load",
  remove: "Remove",
  clear: "Clear",
  move: "Move",
} as const;
