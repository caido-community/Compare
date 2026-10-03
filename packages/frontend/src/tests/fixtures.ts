import { type CompareItem } from "shared";

const FIXED_TIME = "2026-10-03T00:00:00.000Z";

export const buildItem = (id: number, data = `item ${id}`): CompareItem => ({
  id,
  kind: "clipboard",
  source: "clipboard",
  data,
  createdAt: FIXED_TIME,
});
