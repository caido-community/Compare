import { describe, expect, it } from "vitest";

import {
  compareTexts,
  type DiffOptions,
  normalizeText,
  type Segment,
  type SegmentKind,
} from "./index";

const PLAIN: DiffOptions = { ignoreWhitespace: false, ignoreCase: false };

const ofKind = (segments: Segment[], ...kinds: SegmentKind[]) =>
  segments.filter((segment) => kinds.includes(segment.kind));

describe("normalizeText", () => {
  it("leaves text unchanged without options", () => {
    expect(normalizeText("Hello  World", PLAIN)).toBe("Hello  World");
  });

  it("lowercases when ignoring case", () => {
    expect(normalizeText("Hello", { ...PLAIN, ignoreCase: true })).toBe(
      "hello",
    );
  });

  it("trims and collapses whitespace on each line", () => {
    const text = "  hello   world  \n  next  ";
    expect(normalizeText(text, { ...PLAIN, ignoreWhitespace: true })).toBe(
      "hello world\nnext",
    );
  });
});

describe("comparing words", () => {
  it("marks identical text as one unchanged segment per side", () => {
    const result = compareTexts("hello world", "hello world", "words", PLAIN);

    expect(result.original).toEqual([
      { kind: "unchanged", content: "hello world" },
    ]);
    expect(result.modified).toEqual([
      { kind: "unchanged", content: "hello world" },
    ]);
  });

  it("marks an inserted word as added on the modified side", () => {
    const result = compareTexts(
      "hello world",
      "hello new world",
      "words",
      PLAIN,
    );

    expect(ofKind(result.modified, "added")).toEqual([
      { kind: "added", content: "new " },
    ]);
    expect(ofKind(result.original, "deleted", "modified")).toEqual([]);
  });

  it("marks reordered words as changed on both sides", () => {
    const result = compareTexts("A B C", "C B A", "words", PLAIN);

    expect(
      ofKind(result.original, "deleted", "modified").length,
    ).toBeGreaterThan(0);
    expect(ofKind(result.modified, "added", "modified").length).toBeGreaterThan(
      0,
    );
  });

  it("treats case differences as equal when ignoring case", () => {
    const result = compareTexts("Hello", "HELLO", "words", {
      ...PLAIN,
      ignoreCase: true,
    });

    expect(ofKind(result.original, "unchanged")).toHaveLength(1);
    expect(ofKind(result.modified, "added", "modified")).toEqual([]);
  });

  it("treats spacing differences as equal when ignoring whitespace", () => {
    const result = compareTexts("hello  world", "hello world", "words", {
      ...PLAIN,
      ignoreWhitespace: true,
    });

    expect(result.original).toHaveLength(1);
    expect(result.original[0]?.kind).toBe("unchanged");
  });
});

describe("comparing lines", () => {
  it("marks an inserted line as added", () => {
    const result = compareTexts("a\nb\n", "a\nx\nb\n", "lines", PLAIN);

    expect(ofKind(result.modified, "added")).toEqual([
      { kind: "added", content: "x\n" },
    ]);
  });

  it("marks a removed line as deleted", () => {
    const result = compareTexts("a\nb\nc\n", "a\nc\n", "lines", PLAIN);

    expect(ofKind(result.original, "deleted")).toEqual([
      { kind: "deleted", content: "b\n" },
    ]);
  });

  it("pairs a replaced line as modified on both sides", () => {
    const result = compareTexts("a\nb\n", "a\nx\n", "lines", PLAIN);

    expect(ofKind(result.original, "modified")).toEqual([
      { kind: "modified", content: "b\n" },
    ]);
    expect(ofKind(result.modified, "modified")).toEqual([
      { kind: "modified", content: "x\n" },
    ]);
  });

  it("ignores indentation when ignoring whitespace", () => {
    const result = compareTexts("  a  \n", "a\n", "lines", {
      ...PLAIN,
      ignoreWhitespace: true,
    });

    expect(result.original).toEqual([{ kind: "unchanged", content: "a\n" }]);
  });
});

describe("comparing bytes", () => {
  it("marks a single changed character as modified", () => {
    const result = compareTexts("abc", "axc", "bytes", PLAIN);

    expect(ofKind(result.original, "modified")).toEqual([
      { kind: "modified", content: "b" },
    ]);
    expect(ofKind(result.modified, "modified")).toEqual([
      { kind: "modified", content: "x" },
    ]);
  });

  it("keeps the unchanged characters aligned on both sides", () => {
    const result = compareTexts("aba", "aca", "bytes", PLAIN);

    expect(ofKind(result.original, "unchanged")).toEqual(
      ofKind(result.modified, "unchanged"),
    );
  });
});

describe("the summary", () => {
  it("counts segments in words mode", () => {
    const { summary } = compareTexts("a b", "a x b", "words", PLAIN);

    expect(summary).toEqual({
      added: 1,
      deleted: 0,
      modified: 0,
      unchanged: 2,
    });
  });

  it("counts characters in bytes mode", () => {
    const { summary } = compareTexts("abc", "axc", "bytes", PLAIN);

    expect(summary).toEqual({
      added: 0,
      deleted: 0,
      modified: 1,
      unchanged: 2,
    });
  });
});
