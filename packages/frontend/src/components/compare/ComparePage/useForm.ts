import { computed, onMounted, onUnmounted, ref, shallowRef } from "vue";

import { type DiffView } from "@/components/compare/DiffDialog";
import { usePanel } from "@/components/compare/ItemPanel";
import { type DiffMode, type DiffOptions } from "@/core/diff";
import { type Services } from "@/services";

type CompareState =
  | { kind: "Idle" }
  | { kind: "Running"; cancel: () => void }
  | { kind: "Done"; view: DiffView };

const IDLE: CompareState = { kind: "Idle" };

export const useForm = (services: Services) => {
  const original = usePanel("original", services);
  const modified = usePanel("modified", services);
  const diffOptions = ref<DiffOptions>({
    ignoreWhitespace: false,
    ignoreCase: false,
  });
  const state = shallowRef<CompareState>(IDLE);

  const isComparing = computed(() => state.value.kind === "Running");

  const canCompare = computed(
    () =>
      !isComparing.value &&
      original.selected.value.length === 1 &&
      modified.selected.value.length === 1,
  );

  const diffView = computed(() =>
    state.value.kind === "Done" ? state.value.view : undefined,
  );

  const compare = async (mode: DiffMode) => {
    const left = original.selected.value[0];
    const right = modified.selected.value[0];
    if (left === undefined || right === undefined) return;

    const run = services.runDiff({
      original: left.data,
      modified: right.data,
      mode,
      options: { ...diffOptions.value },
    });
    const running: CompareState = {
      kind: "Running",
      cancel: () => {
        state.value = IDLE;
        run.cancel();
      },
    };
    state.value = running;

    const outcome = await run.result;
    if (state.value !== running) return;
    if (outcome.kind === "Error") {
      state.value = IDLE;
      services.notifications.showError(`Unable to compare: ${outcome.error}`);
      return;
    }
    state.value = {
      kind: "Done",
      view: { original: left, modified: right, result: outcome.value },
    };
  };

  const cancelCompare = () => {
    if (state.value.kind === "Running") state.value.cancel();
  };

  const reload = () => Promise.all([original.load(), modified.load()]);

  let stopListening: () => void = () => undefined;
  onMounted(() => {
    void reload();
    stopListening = services.items.onItemsChanged(() => void reload());
  });
  onUnmounted(() => {
    stopListening();
    cancelCompare();
  });

  return {
    original,
    modified,
    diffOptions,
    diffView,
    isComparing,
    canCompare,
    compare,
    cancelCompare,
    closeDiff: () => {
      state.value = IDLE;
    },
  };
};
