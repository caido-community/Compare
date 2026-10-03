export type Panel = "original" | "modified";

export const PANELS: ReadonlyArray<Panel> = ["original", "modified"];

export type ItemKind = "request" | "response" | "file" | "clipboard";

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
