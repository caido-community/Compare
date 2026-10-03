import { type CompareItem } from "shared";

import { type Unit } from "@/constants";

export const pluralize = (count: number, unit: Unit): string =>
  `${count} ${count === 1 ? unit.one : unit.other}`;

export const formatLength = (item: CompareItem): string =>
  item.data.length.toLocaleString();

export const formatTime = (item: CompareItem): string =>
  new Date(item.createdAt).toLocaleTimeString();

export const getPreview = (item: CompareItem): string =>
  item.data.split("\n", 1)[0] ?? "";
