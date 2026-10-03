import { type CompareItem, type Panel, PANELS } from "shared";
import { computed, ref } from "vue";

import {
  buildRowTops,
  GUTTER_WIDTH,
  LINE_HEIGHT,
  measureLineLength,
  selectVisibleRange,
  TAB_SIZE,
} from "./layout";
import { useScrollPanes } from "./useScrollPanes";

import {
  CHANGE_DETAILS,
  DIFF_MODE_DETAILS,
} from "@/components/common/diffPresentation";
import {
  type DiffResult,
  type Row,
  ROW_KINDS,
  type RowKind,
  type Segment,
} from "@/core/diff";

export type DiffView = {
  original: CompareItem;
  modified: CompareItem;
  result: DiffResult;
};

type VisibleWindow = {
  offset: number;
  entries: Array<{ row: Row; index: number; height: number }>;
};

const ROW_CLASSES: Record<RowKind, string> = {
  unchanged: "",
  added: "bg-green-900/40",
  deleted: "bg-red-900/40",
  modified: "bg-orange-900/30",
};

const FILLER_CLASS = "bg-surface-800/60";

const ALIGNMENT_NOTICE =
  "These inputs are too different to align quickly, so lines are paired by position.";

const HIGHLIGHT_NOTICE =
  "Some changed lines were too large to highlight in detail, so they are marked as a whole.";

const measureContentWidth = (rows: Row[], panel: Panel): string => {
  const longest = rows.reduce(
    (length, row) => Math.max(length, measureLineLength(row, panel)),
    0,
  );
  return `calc(${longest}ch + ${GUTTER_WIDTH}px)`;
};

const buildNotices = (result: DiffResult | undefined): string[] => {
  if (result === undefined) return [];
  return [
    ...(result.isAlignmentComplete ? [] : [ALIGNMENT_NOTICE]),
    ...(result.isHighlightingComplete ? [] : [HIGHLIGHT_NOTICE]),
  ];
};

export const useForm = (view: () => DiffView | undefined) => {
  const isWrapped = ref(true);
  const isSynced = ref(true);
  const panes = useScrollPanes(isSynced);

  const rows = computed(() => view()?.result.rows ?? []);
  const tops = computed(() =>
    buildRowTops(
      rows.value,
      isWrapped.value ? panes.charsPerLine.value : undefined,
    ),
  );

  const buildWindow = (panel: Panel): VisibleWindow => {
    const { first, last } = selectVisibleRange(
      tops.value,
      panes.scrollTops[panel],
      panes.viewportHeight.value,
    );
    const entries = rows.value.slice(first, last + 1).map((row, offset) => {
      const index = first + offset;
      const height = (tops.value[index + 1] ?? 0) - (tops.value[index] ?? 0);
      return { row, index, height };
    });
    return { offset: tops.value[first] ?? 0, entries };
  };

  return {
    isWrapped,
    isSynced,
    panels: PANELS,
    modeDetails: DIFF_MODE_DETAILS,
    changeKinds: ROW_KINDS,
    changeDetails: CHANGE_DETAILS,
    tabSize: TAB_SIZE,
    lineHeight: LINE_HEIGHT,
    gutterWidth: GUTTER_WIDTH,
    windows: computed(() => ({
      original: buildWindow("original"),
      modified: buildWindow("modified"),
    })),
    contentWidths: computed(() => ({
      original: measureContentWidth(rows.value, "original"),
      modified: measureContentWidth(rows.value, "modified"),
    })),
    totalHeight: computed(() => tops.value.at(-1) ?? 0),
    notices: computed(() => buildNotices(view()?.result)),
    scrollAreaRefs: panes.scrollAreaRefs,
    syncScroll: panes.syncScroll,
    rowClass: (row: Row, panel: Panel) =>
      row[panel] === undefined ? FILLER_CLASS : ROW_CLASSES[row.kind],
    segmentClass: (segment: Segment, row: Row) =>
      row.kind === "modified" && segment.kind !== "unchanged"
        ? CHANGE_DETAILS[segment.kind].chipClass
        : "",
    formatCount: (kind: RowKind) => {
      const result = view()?.result;
      if (result === undefined) return "";
      const count = result.summary[kind];
      const unit = DIFF_MODE_DETAILS[result.mode].unit;
      return `${CHANGE_DETAILS[kind].label}: ${count} ${count === 1 ? unit.one : unit.other}`;
    },
  };
};
