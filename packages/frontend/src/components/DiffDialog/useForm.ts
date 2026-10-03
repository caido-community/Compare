import { mapPanels, type Panel } from "shared";
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
  FILLER_ROW_CLASS,
} from "@/constants";
import { type DiffView } from "@/types";
import {
  type DiffResult,
  type Row,
  type RowKind,
  type Segment,
} from "@/utils/diff";
import { pluralize } from "@/utils/format";

type VisibleEntry = { row: Row; index: number; height: number };

type VisibleWindow = { offset: number; entries: VisibleEntry[] };

const ALIGNMENT_NOTICE =
  "These inputs are too different to align quickly, so lines are paired by position.";

const HIGHLIGHT_NOTICE =
  "Some changed lines were too large to highlight in detail, so they are marked as a whole.";

const WRAPPED_CLASSES = {
  window: "w-full",
  text: "whitespace-pre-wrap break-all",
};

const UNWRAPPED_CLASSES = { window: "w-max", text: "whitespace-pre" };

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
  const totalHeight = computed(() => tops.value.at(-1) ?? 0);
  const contentWidths = computed(() =>
    mapPanels((panel) => measureContentWidth(rows.value, panel)),
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

  const windows = computed(() => mapPanels(buildWindow));

  const formatCount = (kind: RowKind): string => {
    const result = view()?.result;
    if (result === undefined) return "";
    const unit = DIFF_MODE_DETAILS[result.mode].unit;
    return `${CHANGE_DETAILS[kind].label}: ${pluralize(result.summary[kind], unit)}`;
  };

  return {
    isWrapped,
    isSynced,
    windows,
    notices: computed(() => buildNotices(view()?.result)),
    wrapClasses: computed(() =>
      isWrapped.value ? WRAPPED_CLASSES : UNWRAPPED_CLASSES,
    ),
    scrollAreaRefs: panes.scrollAreaRefs,
    syncScroll: panes.syncScroll,
    formatCount,
    paneStyle: { tabSize: TAB_SIZE },
    gutterStyle: { width: `${GUTTER_WIDTH}px` },
    contentStyle: (panel: Panel) => ({
      height: `${totalHeight.value}px`,
      minWidth: isWrapped.value ? undefined : contentWidths.value[panel],
    }),
    windowStyle: (panel: Panel) => ({
      transform: `translateY(${windows.value[panel].offset}px)`,
    }),
    rowStyle: (entry: VisibleEntry) => ({
      height: `${entry.height}px`,
      lineHeight: `${LINE_HEIGHT}px`,
    }),
    rowClass: (row: Row, panel: Panel) =>
      row[panel] === undefined
        ? FILLER_ROW_CLASS
        : CHANGE_DETAILS[row.kind].rowClass,
    segmentClass: (segment: Segment, row: Row) =>
      row.kind === "modified" && segment.kind !== "unchanged"
        ? CHANGE_DETAILS[segment.kind].chipClass
        : "",
  };
};
