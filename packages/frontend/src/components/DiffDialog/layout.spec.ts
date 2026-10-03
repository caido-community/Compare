import { describe, expect, it } from "vitest";

import {
  buildRowTops,
  findRowAt,
  LINE_HEIGHT,
  measureLineLength,
  selectVisibleRange,
} from "./layout";

import { type Row } from "@/utils/diff";

const row = (
  original: string | undefined,
  modified: string | undefined,
): Row => ({
  kind: "modified",
  original:
    original === undefined
      ? undefined
      : { lineNumber: 1, segments: [{ text: original, kind: "unchanged" }] },
  modified:
    modified === undefined
      ? undefined
      : { lineNumber: 1, segments: [{ text: modified, kind: "unchanged" }] },
});

describe("measureLineLength", () => {
  it("counts a tab as four columns", () => {
    expect(measureLineLength(row("\tab", "x"), "original")).toBe(6);
  });

  it("treats a filler side as empty", () => {
    expect(measureLineLength(row(undefined, "x"), "original")).toBe(0);
  });
});

describe("buildRowTops", () => {
  it("gives every row one line when lines are not wrapped", () => {
    const tops = buildRowTops(
      [row("a".repeat(500), "b"), row("c", "d")],
      undefined,
    );

    expect(tops).toEqual([0, LINE_HEIGHT, LINE_HEIGHT * 2]);
  });

  it("sizes a wrapped row by its taller side so both sides stay aligned", () => {
    const tops = buildRowTops(
      [row("a".repeat(25), "b".repeat(5)), row("", "")],
      10,
    );

    expect(tops).toEqual([0, LINE_HEIGHT * 3, LINE_HEIGHT * 4]);
  });
});

describe("finding visible rows", () => {
  const tops = [0, 20, 60, 80, 100];

  it("finds the row that contains an offset", () => {
    expect(findRowAt(tops, 0)).toBe(0);
    expect(findRowAt(tops, 59)).toBe(1);
    expect(findRowAt(tops, 60)).toBe(2);
    expect(findRowAt(tops, 5000)).toBe(3);
    expect(findRowAt(tops, -100)).toBe(0);
  });

  it("includes rows around the viewport", () => {
    expect(selectVisibleRange(tops, 0, 40)).toEqual({ first: 0, last: 3 });
  });
});
