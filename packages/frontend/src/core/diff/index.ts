import { type Change, diffChars, diffLines, diffWords } from "diff";

export type DiffMode = "words" | "bytes" | "lines";

export type DiffOptions = {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
};

export type SegmentKind = "added" | "deleted" | "modified" | "unchanged";

export type Segment = { kind: SegmentKind; content: string };

type DiffSummary = Record<SegmentKind, number>;

export type DiffResult = {
  mode: DiffMode;
  original: Segment[];
  modified: Segment[];
  summary: DiffSummary;
};

type Sides = { original: Segment[]; modified: Segment[] };

const DIFFERS: Record<DiffMode, (left: string, right: string) => Change[]> = {
  words: diffWords,
  bytes: diffChars,
  lines: diffLines,
};

export const normalizeText = (text: string, options: DiffOptions): string => {
  const cased = options.ignoreCase ? text.toLowerCase() : text;
  if (!options.ignoreWhitespace) return cased;
  return cased
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .join("\n");
};

type Piece = { kind: SegmentKind; original: string; modified: string };

const toPiece = (change: Change): Piece => {
  if (change.removed === true) {
    return { kind: "deleted", original: change.value, modified: "" };
  }
  if (change.added === true) {
    return { kind: "added", original: "", modified: change.value };
  }
  return { kind: "unchanged", original: change.value, modified: change.value };
};

const pairReplacements = (pieces: Piece[]): Piece[] => {
  const paired: Piece[] = [];
  for (const piece of pieces) {
    const previous = paired.at(-1);
    if (piece.kind === "added" && previous?.kind === "deleted") {
      paired.pop();
      paired.push({ ...previous, kind: "modified", modified: piece.modified });
      continue;
    }
    paired.push(piece);
  }
  return paired;
};

const toSegments = (pieces: Piece[], side: keyof Sides): Segment[] =>
  pieces
    .filter((piece) => piece[side] !== "")
    .map((piece) => ({ kind: piece.kind, content: piece[side] }));

const buildSides = (changes: Change[]): Sides => {
  const pieces = pairReplacements(changes.map(toPiece));
  return {
    original: toSegments(pieces, "original"),
    modified: toSegments(pieces, "modified"),
  };
};

const summarize = (sides: Sides, mode: DiffMode): DiffSummary => {
  const weigh = (segment: Segment) =>
    mode === "bytes" ? segment.content.length : 1;
  const summary: DiffSummary = {
    added: 0,
    deleted: 0,
    modified: 0,
    unchanged: 0,
  };
  for (const segment of sides.original) summary[segment.kind] += weigh(segment);
  for (const segment of sides.modified) {
    if (segment.kind === "added") summary.added += weigh(segment);
  }
  return summary;
};

export const compareTexts = (
  original: string,
  modified: string,
  mode: DiffMode,
  options: DiffOptions,
): DiffResult => {
  const changes = DIFFERS[mode](
    normalizeText(original, options),
    normalizeText(modified, options),
  );
  const sides = buildSides(changes);
  return { mode, ...sides, summary: summarize(sides, mode) };
};
