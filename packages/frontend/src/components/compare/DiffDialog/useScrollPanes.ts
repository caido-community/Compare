import { getOtherPanel, type Panel, PANELS } from "shared";
import { onUnmounted, reactive, ref, type Ref } from "vue";

import { GUTTER_WIDTH } from "./layout";

type ScrollAreaRef = (element: unknown) => void;

const FALLBACK_CHAR_WIDTH = 7;

const PROBE_LENGTH = 100;

const measureCharWidth = (element: HTMLElement): number => {
  const probe = document.createElement("span");
  probe.textContent = "0".repeat(PROBE_LENGTH);
  probe.style.visibility = "hidden";
  probe.style.position = "absolute";
  element.append(probe);
  const width = probe.getBoundingClientRect().width / PROBE_LENGTH;
  probe.remove();
  return width > 0 ? width : FALLBACK_CHAR_WIDTH;
};

export const useScrollPanes = (isSynced: Ref<boolean>) => {
  const scrollTops = reactive<Record<Panel, number>>({
    original: 0,
    modified: 0,
  });
  const viewportHeight = ref(0);
  const charsPerLine = ref(80);
  const scrollAreas: Record<Panel, HTMLElement | undefined> = {
    original: undefined,
    modified: undefined,
  };
  let charWidth = FALLBACK_CHAR_WIDTH;

  const measurePanes = () => {
    const widths = PANELS.flatMap((panel) => {
      const element = scrollAreas[panel];
      return element === undefined ? [] : [element.clientWidth];
    });
    const paneWidth = Math.min(...widths);
    if (!Number.isFinite(paneWidth)) return;

    const textWidth = paneWidth - GUTTER_WIDTH;
    charsPerLine.value = Math.max(1, Math.floor(textWidth / charWidth));
    viewportHeight.value = scrollAreas.original?.clientHeight ?? 0;
  };

  const resizeObserver = new ResizeObserver(measurePanes);
  onUnmounted(() => resizeObserver.disconnect());

  const bindScrollArea =
    (panel: Panel): ScrollAreaRef =>
    (element) => {
      const next = element instanceof HTMLElement ? element : undefined;
      const previous = scrollAreas[panel];
      if (next === previous) return;

      if (previous !== undefined) resizeObserver.unobserve(previous);
      scrollAreas[panel] = next;
      if (next === undefined) return;

      charWidth = measureCharWidth(next);
      scrollTops[panel] = 0;
      resizeObserver.observe(next);
      measurePanes();
    };

  const syncScroll = (from: Panel) => {
    const source = scrollAreas[from];
    if (source === undefined) return;
    scrollTops[from] = source.scrollTop;
    if (!isSynced.value) return;

    const target = scrollAreas[getOtherPanel(from)];
    if (target === undefined) return;
    if (target.scrollTop !== source.scrollTop) {
      target.scrollTop = source.scrollTop;
    }
    if (target.scrollLeft !== source.scrollLeft) {
      target.scrollLeft = source.scrollLeft;
    }
  };

  return {
    scrollTops,
    viewportHeight,
    charsPerLine,
    scrollAreaRefs: {
      original: bindScrollArea("original"),
      modified: bindScrollArea("modified"),
    },
    syncScroll,
  };
};
