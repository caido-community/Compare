import type { ComparisonDiff } from "backend";
import { describe, expect, it } from "vitest";

import {
  compareByBytes,
  compareByLines,
  compareByWords,
  computeComparisonSummary,
  normalizeForComparison,
} from "./comparisonEngine";

describe("normalizeForComparison", () => {
  it("returns text unchanged when options empty", () => {
    expect(normalizeForComparison("Hello  World")).toBe("Hello  World");
  });

  it("applies ignoreCase when set", () => {
    expect(normalizeForComparison("Hello", { ignoreCase: true })).toBe("hello");
  });

  it("trims and collapses whitespace when ignoreWhitespace set", () => {
    expect(
      normalizeForComparison("  hello   world  ", { ignoreWhitespace: true }),
    ).toBe("hello world");
  });

  it("applies both options when both set", () => {
    expect(
      normalizeForComparison("  Hello   World  ", {
        ignoreCase: true,
        ignoreWhitespace: true,
      }),
    ).toBe("hello world");
  });
});

describe("compareByWords", () => {
  it("returns only unchanged segments for identical strings", () => {
    const text = "hello world";
    const { diffs1, diffs2 } = compareByWords(text, text);
    expect(diffs1).toHaveLength(1);
    expect(diffs2).toHaveLength(1);
    expect(diffs1[0]).toMatchObject({ type: "unchanged", content: text });
    expect(diffs2[0]).toMatchObject({ type: "unchanged", content: text });
  });

  it("reports added segment for single word insertion", () => {
    const { diffs1, diffs2 } = compareByWords("hello world", "hello new world");
    const added = diffs2.filter((d) => d.type === "added");
    expect(added).toHaveLength(1);
    expect(added[0]?.content).toBe("new ");
    expect(diffs1.every((d) => d.type === "unchanged")).toBe(true);
  });

  it("reports reordering as changes (deleted/added or modified)", () => {
    const { diffs1, diffs2 } = compareByWords("A B C", "C B A");
    const changed1 = diffs1.filter(
      (d) => d.type === "deleted" || d.type === "modified",
    );
    const changed2 = diffs2.filter(
      (d) => d.type === "added" || d.type === "modified",
    );
    expect(changed1.length).toBeGreaterThan(0);
    expect(changed2.length).toBeGreaterThan(0);
    const leftContent = changed1.map((d) => d.content).join("");
    const rightContent = changed2.map((d) => d.content).join("");
    expect(leftContent).toContain("A");
    expect(leftContent).toContain("C");
    expect(rightContent).toContain("A");
    expect(rightContent).toContain("C");
  });

  it("respects ignoreCase option", () => {
    const { diffs1, diffs2 } = compareByWords("Hello", "HELLO", {
      ignoreCase: true,
    });
    expect(diffs1).toHaveLength(1);
    expect(diffs2).toHaveLength(1);
    expect(diffs1[0]?.type).toBe("unchanged");
    expect(diffs2[0]?.type).toBe("unchanged");
  });

  it("respects ignoreWhitespace option", () => {
    const { diffs1, diffs2 } = compareByWords("hello  world", "hello world", {
      ignoreWhitespace: true,
    });
    expect(diffs1).toHaveLength(1);
    expect(diffs2).toHaveLength(1);
    expect(diffs1[0]?.type).toBe("unchanged");
    expect(diffs2[0]?.type).toBe("unchanged");
  });
});

describe("compareByLines", () => {
  it("returns only unchanged for identical strings", () => {
    const text = "line1\nline2\n";
    const { diffs1, diffs2 } = compareByLines(text, text);
    expect(diffs1).toHaveLength(1);
    expect(diffs2).toHaveLength(1);
    expect(diffs1[0]?.type).toBe("unchanged");
    expect(diffs2[0]?.type).toBe("unchanged");
  });

  it("reports added line when one line is inserted", () => {
    const { diffs2 } = compareByLines("a\nb\n", "a\nx\nb\n");
    const added = diffs2.filter((d: ComparisonDiff) => d.type === "added");
    expect(added.length).toBeGreaterThan(0);
  });

  it("reports deleted line when one line is removed", () => {
    const { diffs1 } = compareByLines("a\nb\nc\n", "a\nc\n");
    const deleted = diffs1.filter((d: ComparisonDiff) => d.type === "deleted");
    expect(deleted.length).toBeGreaterThan(0);
  });

  it("reports modified when a line changes", () => {
    const { diffs1, diffs2 } = compareByLines("a\nb\n", "a\nx\n");
    const mod1 = diffs1.filter(
      (d: ComparisonDiff) => d.type === "modified" || d.type === "deleted",
    );
    const mod2 = diffs2.filter(
      (d: ComparisonDiff) => d.type === "modified" || d.type === "added",
    );
    expect(mod1.length).toBeGreaterThan(0);
    expect(mod2.length).toBeGreaterThan(0);
  });

  it("respects ignoreWhitespace option (per-line)", () => {
    const { diffs1, diffs2 } = compareByLines("  a  \n", "a\n", {
      ignoreWhitespace: true,
    });
    expect(diffs1).toHaveLength(1);
    expect(diffs2).toHaveLength(1);
    expect(diffs1[0]?.type).toBe("unchanged");
    expect(diffs2[0]?.type).toBe("unchanged");
  });

  it("respects ignoreCase option", () => {
    const { diffs1, diffs2 } = compareByLines("Line1\n", "LINE1\n", {
      ignoreCase: true,
    });
    expect(diffs1).toHaveLength(1);
    expect(diffs2).toHaveLength(1);
    expect(diffs1[0]?.type).toBe("unchanged");
    expect(diffs2[0]?.type).toBe("unchanged");
  });
});

describe("compareByBytes", () => {
  it("returns only unchanged for identical strings", () => {
    const text = "abc";
    const { diffs1, diffs2 } = compareByBytes(text, text);
    expect(diffs1).toHaveLength(1);
    expect(diffs2).toHaveLength(1);
    expect(diffs1[0]).toMatchObject({ type: "unchanged", content: text });
    expect(diffs2[0]).toMatchObject({ type: "unchanged", content: text });
  });

  it("reports one added and one deleted for single char change", () => {
    const { diffs1, diffs2 } = compareByBytes("abc", "axc");
    const modified1 = diffs1.filter(
      (d) => d.type === "modified" || d.type === "deleted",
    );
    const modified2 = diffs2.filter(
      (d) => d.type === "modified" || d.type === "added",
    );
    expect(modified1.length).toBeGreaterThan(0);
    expect(modified2.length).toBeGreaterThan(0);
  });

  it("aligns correctly for repeated characters", () => {
    const { diffs1, diffs2 } = compareByBytes("aba", "aca");
    const unchanged1 = diffs1.filter((d) => d.type === "unchanged");
    const unchanged2 = diffs2.filter((d) => d.type === "unchanged");
    expect(unchanged1.length).toBeGreaterThan(0);
    expect(unchanged2.length).toBeGreaterThan(0);
    const allUnchanged = unchanged1.every(
      (u, i) => unchanged2[i]?.content === u.content,
    );
    expect(allUnchanged).toBe(true);
  });
});

describe("computeComparisonSummary", () => {
  it("counts segments in word mode", () => {
    const { diffs1, diffs2 } = compareByWords("a b", "a x b");
    const summary = computeComparisonSummary(diffs1, diffs2, "words");
    expect(summary.unchanged).toBeGreaterThan(0);
    expect(summary.added + summary.deleted + summary.modified).toBeGreaterThan(
      0,
    );
  });

  it("counts by length in bytes mode", () => {
    const { diffs1, diffs2 } = compareByBytes("abc", "axc");
    const summary = computeComparisonSummary(diffs1, diffs2, "bytes");
    expect(summary.unchanged).toBeGreaterThan(0);
    expect(
      summary.added + summary.deleted + summary.modified + summary.unchanged,
    ).toBeGreaterThan(0);
  });
});
