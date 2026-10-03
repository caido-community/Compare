import { mapPanels, type Panel } from "shared";

type PanelAction = "paste" | "load" | "remove" | "clear" | "move";

type ActionDetails = { label: string; icon: string };

export const PANEL_TITLES: Record<Panel, string> = {
  original: "Original",
  modified: "Modified",
};

export const SEND_LABELS = mapPanels(
  (panel) => `Send to ${PANEL_TITLES[panel]}`,
);

export const PANEL_ACTIONS: Record<PanelAction, ActionDetails> = {
  paste: { label: "Paste", icon: "fas fa-paste" },
  load: { label: "Load", icon: "fas fa-folder-open" },
  remove: { label: "Remove", icon: "fas fa-trash" },
  clear: { label: "Clear", icon: "fas fa-times" },
  move: { label: "Move", icon: "fas fa-exchange-alt" },
};
