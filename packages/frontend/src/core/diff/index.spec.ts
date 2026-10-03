import { describe, expect, it } from "vitest";

import { compareTexts, type DiffInput, type Row } from "./index";

const PLAIN = { ignoreWhitespace: false, ignoreCase: false };

const input = (
  original: string,
  modified: string,
  overrides: Partial<DiffInput> = {},
): DiffInput => ({
  original,
  modified,
  mode: "words",
  options: PLAIN,
  ...overrides,
});

const rowAt = (rows: Row[], index: number): Row => {
  const row = rows[index];
  if (row === undefined) throw new Error(`row ${index} is missing`);
  return row;
};

const readSide = (row: Row, side: "original" | "modified") =>
  row[side]?.segments.map((segment) => segment.text).join("");

const changedText = (row: Row, side: "original" | "modified") =>
  row[side]?.segments
    .filter((segment) => segment.kind !== "unchanged")
    .map((segment) => segment.text)
    .join("");

describe("aligning lines", () => {
  it("marks identical text as unchanged rows with line numbers", () => {
    const { rows } = compareTexts(input("a\nb", "a\nb"));

    expect(rows.map((row) => row.kind)).toEqual(["unchanged", "unchanged"]);
    expect(rows[1]?.original?.lineNumber).toBe(2);
    expect(rows[1]?.modified?.lineNumber).toBe(2);
  });

  it("adds a filler on the original side for an inserted line", () => {
    const { rows } = compareTexts(input("a\nc", "a\nb\nc"));

    expect(rows.map((row) => row.kind)).toEqual([
      "unchanged",
      "added",
      "unchanged",
    ]);
    expect(rows[1]?.original).toBeUndefined();
    expect(readSide(rowAt(rows, 1), "modified")).toBe("b");
    expect(rows[2]?.original?.lineNumber).toBe(2);
    expect(rows[2]?.modified?.lineNumber).toBe(3);
  });

  it("adds a filler on the modified side for a removed line", () => {
    const { rows } = compareTexts(input("a\nb\nc", "a\nc"));

    expect(rows.map((row) => row.kind)).toEqual([
      "unchanged",
      "deleted",
      "unchanged",
    ]);
    expect(rows[1]?.modified).toBeUndefined();
  });

  it("treats CRLF and LF line endings as equal", () => {
    const { summary } = compareTexts(input("a\r\nb", "a\nb"));

    expect(summary.unchanged).toBe(2);
  });
});

describe("highlighting changed lines", () => {
  it("marks the changed word in words mode", () => {
    const row = rowAt(
      compareTexts(input('{"role": "user"}', '{"role": "admin"}')).rows,
      0,
    );

    expect(row.kind).toBe("modified");
    expect(changedText(row, "original")).toBe("user");
    expect(changedText(row, "modified")).toBe("admin");
  });

  it("marks the changed character in bytes mode", () => {
    const row = rowAt(
      compareTexts(input("abc", "axc", { mode: "bytes" })).rows,
      0,
    );

    expect(changedText(row, "original")).toBe("b");
    expect(changedText(row, "modified")).toBe("x");
  });

  it("marks the whole line in lines mode", () => {
    const row = rowAt(
      compareTexts(input("abc", "axc", { mode: "lines" })).rows,
      0,
    );

    expect(changedText(row, "original")).toBe("abc");
    expect(changedText(row, "modified")).toBe("axc");
  });

  it("keeps every character of both lines", () => {
    const row = rowAt(
      compareTexts(input("one two three", "one 2 three")).rows,
      0,
    );

    expect(readSide(row, "original")).toBe("one two three");
    expect(readSide(row, "modified")).toBe("one 2 three");
  });
});

describe("ignoring case and whitespace", () => {
  it("treats case differences as unchanged but shows the original text", () => {
    const { rows } = compareTexts(
      input("Content-Type: JSON", "content-type: json", {
        options: { ...PLAIN, ignoreCase: true },
      }),
    );

    expect(rows[0]?.kind).toBe("unchanged");
    expect(readSide(rowAt(rows, 0), "original")).toBe("Content-Type: JSON");
    expect(readSide(rowAt(rows, 0), "modified")).toBe("content-type: json");
  });

  it("treats indentation differences as unchanged but keeps the indentation", () => {
    const { rows } = compareTexts(
      input("    a  b", "a b", {
        options: { ...PLAIN, ignoreWhitespace: true },
      }),
    );

    expect(rows[0]?.kind).toBe("unchanged");
    expect(readSide(rowAt(rows, 0), "original")).toBe("    a  b");
  });
});

describe("classifying changes inside a line", () => {
  it("marks a replaced word as modified on both sides", () => {
    const row = rowAt(compareTexts(input("role user", "role admin")).rows, 0);

    expect(row.original?.segments.at(-1)).toEqual({
      text: "user",
      kind: "modified",
    });
    expect(row.modified?.segments.at(-1)).toEqual({
      text: "admin",
      kind: "modified",
    });
  });

  it("marks an inserted word as added", () => {
    const row = rowAt(compareTexts(input("a c", "a b c")).rows, 0);

    expect(
      row.modified?.segments.filter((part) => part.kind === "added"),
    ).toEqual([{ text: "b ", kind: "added" }]);
  });
});

describe("the summary", () => {
  it("counts lines in lines mode", () => {
    const { summary } = compareTexts(
      input("a\nb\nc", "a\nx\nc\nd", { mode: "lines" }),
    );

    expect(summary).toEqual({
      added: 1,
      deleted: 0,
      modified: 1,
      unchanged: 2,
    });
  });

  it("counts words in words mode", () => {
    const { summary } = compareTexts(
      input('{"role": "user", "id": 1}', '{"role": "admin", "id": 1}'),
    );

    expect(summary).toEqual({
      added: 0,
      deleted: 0,
      modified: 1,
      unchanged: 3,
    });
  });

  it("counts bytes in bytes mode", () => {
    const { summary } = compareTexts(input("abcd", "axcde", { mode: "bytes" }));

    expect(summary).toEqual({
      added: 1,
      deleted: 0,
      modified: 1,
      unchanged: 3,
    });
  });

  it("counts multi-byte characters by their encoded size", () => {
    const { summary } = compareTexts(input("é", "e", { mode: "bytes" }));

    expect(summary.modified).toBe(2);
  });

  it("counts whole added lines in the unit of the mode", () => {
    const { summary } = compareTexts(input("a", "a\nnew words here"));

    expect(summary.added).toBe(3);
  });
});

describe("staying responsive on hard inputs", () => {
  const unrelatedLines = (seed: number) =>
    Array.from({ length: 3000 }, (_, index) => `${seed}-${index * seed}`).join(
      "\n",
    );

  it("pairs lines by position when alignment runs out of time", () => {
    const result = compareTexts(input(unrelatedLines(3), unrelatedLines(7)), {
      alignmentMs: 0,
      highlightMs: 1000,
    });

    expect(result.isAlignmentComplete).toBe(false);
    expect(result.rows).toHaveLength(3000);
  });

  it("marks lines as a whole when the highlight budget is spent", () => {
    const result = compareTexts(input("abc", "axc", { mode: "bytes" }), {
      alignmentMs: 1000,
      highlightMs: 0,
    });

    expect(result.isHighlightingComplete).toBe(false);
    expect(changedText(rowAt(result.rows, 0), "original")).toBe("abc");
  });
});
