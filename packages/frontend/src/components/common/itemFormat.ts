import { type CompareItem } from "shared";

export const getPreview = (item: CompareItem): string =>
  item.data.split("\n", 1)[0] ?? "";

export const formatTime = (item: CompareItem): string =>
  new Date(item.createdAt).toLocaleTimeString();

export const formatLength = (item: CompareItem): string =>
  item.data.length.toLocaleString();
