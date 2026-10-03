import { type CompareItem, getOtherPanel, type Panel, PANELS } from "shared";
import { ref } from "vue";

import { type DiffMode, type DiffResult, type SegmentKind } from "@/core/diff";

export type DiffView = {
  original: CompareItem;
  modified: CompareItem;
  result: DiffResult;
};

type ScrollAreaRef = (element: unknown) => void;

const MODE_TITLES: Record<DiffMode, string> = {
  words: "Words",
  bytes: "Bytes",
  lines: "Lines",
};

const SEGMENT_CLASSES: Record<SegmentKind, string> = {
  added: "bg-green-700/50 text-green-100",
  deleted: "bg-red-700/50 text-red-100",
  modified: "bg-orange-700/50 text-orange-100",
  unchanged: "text-surface-300",
};

const LEGEND: ReadonlyArray<{ kind: SegmentKind; label: string }> = [
  { kind: "added", label: "Added" },
  { kind: "deleted", label: "Deleted" },
  { kind: "modified", label: "Modified" },
  { kind: "unchanged", label: "Unchanged" },
];

export const useForm = () => {
  const isSynced = ref(false);
  const scrollAreas: Record<Panel, HTMLElement | undefined> = {
    original: undefined,
    modified: undefined,
  };

  const bindScrollArea =
    (panel: Panel): ScrollAreaRef =>
    (element) => {
      scrollAreas[panel] = element instanceof HTMLElement ? element : undefined;
    };

  const syncScroll = (from: Panel) => {
    if (!isSynced.value) return;
    const source = scrollAreas[from];
    const target = scrollAreas[getOtherPanel(from)];
    if (source === undefined || target === undefined) return;
    target.scrollTop = source.scrollTop;
    target.scrollLeft = source.scrollLeft;
  };

  const scrollAreaRefs: Record<Panel, ScrollAreaRef> = {
    original: bindScrollArea("original"),
    modified: bindScrollArea("modified"),
  };

  return {
    isSynced,
    panels: PANELS,
    modeTitles: MODE_TITLES,
    legend: LEGEND,
    scrollAreaRefs,
    segmentClass: (kind: SegmentKind) => SEGMENT_CLASSES[kind],
    syncScroll,
  };
};
