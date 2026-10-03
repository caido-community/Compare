export const PANELS = ["original", "modified"] as const;

export type Panel = (typeof PANELS)[number];

export const ITEM_KINDS = ["request", "response", "file", "clipboard"] as const;

export type ItemKind = (typeof ITEM_KINDS)[number];

export const MAX_ITEM_MEGABYTES = 10;

export const MAX_ITEM_LENGTH = MAX_ITEM_MEGABYTES * 1024 * 1024;

export const MAX_REQUESTS_PER_ADD = 25;

export type CompareItem = {
  id: number;
  kind: ItemKind;
  source: string;
  data: string;
  createdAt: string;
};

export type AddItemInput = {
  panel: Panel;
  kind: ItemKind;
  source: string;
  data: string;
};

export type AddRequestsInput = {
  panel: Panel;
  requestIds: string[];
};

export type ItemSelection = {
  panel: Panel;
  ids: number[];
};

export const getOtherPanel = (panel: Panel): Panel =>
  panel === "original" ? "modified" : "original";
