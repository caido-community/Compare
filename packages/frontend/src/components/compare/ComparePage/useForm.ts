import { computed, onMounted, onUnmounted, ref } from "vue";

import { type DiffView } from "@/components/compare/DiffDialog";
import { usePanel } from "@/components/compare/ItemPanel";
import { compareTexts, type DiffMode, type DiffOptions } from "@/core/diff";
import { type Services } from "@/services";

export const useForm = (services: Services) => {
  const original = usePanel("original", services);
  const modified = usePanel("modified", services);
  const diffOptions = ref<DiffOptions>({
    ignoreWhitespace: false,
    ignoreCase: false,
  });
  const diffView = ref<DiffView | undefined>(undefined);

  const canCompare = computed(
    () =>
      original.selected.value.length === 1 &&
      modified.selected.value.length === 1,
  );

  const compare = (mode: DiffMode) => {
    const left = original.selected.value[0];
    const right = modified.selected.value[0];
    if (left === undefined || right === undefined) return;

    const result = compareTexts(left.data, right.data, mode, diffOptions.value);
    diffView.value = { original: left, modified: right, result };
  };

  const reload = () => Promise.all([original.load(), modified.load()]);

  let stopListening: () => void = () => undefined;
  onMounted(() => {
    void reload();
    stopListening = services.items.onItemsChanged(() => void reload());
  });
  onUnmounted(() => stopListening());

  return {
    original,
    modified,
    diffOptions,
    diffView,
    canCompare,
    compare,
    closeDiff: () => {
      diffView.value = undefined;
    },
  };
};
