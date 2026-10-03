import { type Panel, PANELS } from "shared";

import { type Row } from "@/core/diff";

export const LINE_HEIGHT = 20;

export const GUTTER_WIDTH = 48;

export const TAB_SIZE = 4;

const OVERSCAN_PX = 600;

export type VisibleRange = { first: number; last: number };

export const measureLineLength = (row: Row, panel: Panel): number => {
  const cell = row[panel];
  if (cell === undefined) return 0;
  return cell.segments.reduce((length, segment) => {
    const tabs = segment.text.split("\t").length - 1;
    return length + segment.text.length + tabs * (TAB_SIZE - 1);
  }, 0);
};

const countWrappedLines = (length: number, charsPerLine: number): number =>
  Math.max(1, Math.ceil(length / charsPerLine));

const measureRowHeight = (row: Row, charsPerLine: number | undefined) => {
  if (charsPerLine === undefined) return LINE_HEIGHT;
  const lines = PANELS.map((panel) =>
    countWrappedLines(measureLineLength(row, panel), charsPerLine),
  );
  return Math.max(...lines) * LINE_HEIGHT;
};

export const buildRowTops = (
  rows: Row[],
  charsPerLine: number | undefined,
): number[] => {
  const tops = [0];
  let top = 0;
  for (const row of rows) {
    top += measureRowHeight(row, charsPerLine);
    tops.push(top);
  }
  return tops;
};

export const findRowAt = (tops: number[], offset: number): number => {
  let low = 0;
  let high = Math.max(0, tops.length - 2);
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if ((tops[middle] ?? 0) <= offset) {
      low = middle;
      continue;
    }
    high = middle - 1;
  }
  return low;
};

export const selectVisibleRange = (
  tops: number[],
  scrollTop: number,
  viewportHeight: number,
): VisibleRange => ({
  first: findRowAt(tops, scrollTop - OVERSCAN_PX),
  last: findRowAt(tops, scrollTop + viewportHeight + OVERSCAN_PX),
});
