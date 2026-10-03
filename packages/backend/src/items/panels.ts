import { type CompareItem, type Panel, PANELS } from "shared";

export type Panels = Record<Panel, CompareItem[]>;

export const sortById = (items: CompareItem[]): CompareItem[] =>
  [...items].sort((left, right) => left.id - right.id);

export const withPanel = (
  panels: Panels,
  panel: Panel,
  items: CompareItem[],
): Panels => ({ ...panels, [panel]: items });

export const withoutIds = (
  items: CompareItem[],
  ids: ReadonlySet<number>,
): CompareItem[] => items.filter((item) => !ids.has(item.id));

export const getNextId = (panels: Panels): number => {
  const ids = PANELS.flatMap((panel) => panels[panel].map((item) => item.id));
  return Math.max(0, ...ids) + 1;
};

export const hasSameItems = (left: Panels, right: Panels): boolean =>
  PANELS.every(
    (panel) =>
      left[panel].length === right[panel].length &&
      left[panel].every((item, index) => item === right[panel][index]),
  );
