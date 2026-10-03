import { type CompareItem } from "shared";

export type Unit = { one: string; other: string };

export const ITEM_UNIT: Unit = { one: "item", other: "items" };

export const pluralize = (count: number, unit: Unit): string =>
  `${count} ${count === 1 ? unit.one : unit.other}`;

export const formatLength = (item: CompareItem): string =>
  item.data.length.toLocaleString();
