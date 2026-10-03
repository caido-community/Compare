import { type CompareItem, ok } from "shared";

import { type ItemService } from "@/services/items";

const FIXED_TIME = "2026-10-03T00:00:00.000Z";

export const buildItem = (id: number, data = `item ${id}`): CompareItem => ({
  id,
  kind: "clipboard",
  source: "clipboard",
  data,
  createdAt: FIXED_TIME,
});

export const buildItemServiceDouble = (
  overrides: Partial<ItemService> = {},
): ItemService => ({
  listItems: () => Promise.resolve(ok([])),
  addItem: (input) => Promise.resolve(ok(buildItem(1, input.data))),
  addFile: (_panel, file) => Promise.resolve(ok(buildItem(1, file.name))),
  addRequests: () => Promise.resolve(ok([])),
  removeItems: (selection) => Promise.resolve(ok(selection.ids)),
  moveItems: () => Promise.resolve(ok([])),
  clearPanel: (panel) => Promise.resolve(ok(panel)),
  onItemsChanged: () => () => undefined,
  ...overrides,
});
