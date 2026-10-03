import { type CompareItem } from "shared";
import { computed, onUnmounted, ref, shallowRef } from "vue";

import { type DiffView } from "@/components/compare/DiffDialog";
import {
  DEFAULT_DIFF_OPTIONS,
  type DiffMode,
  type DiffOptions,
} from "@/core/diff";
import { type Services } from "@/services";

type CompareState =
  | { kind: "Idle" }
  | { kind: "Running"; cancel: () => void }
  | { kind: "Done"; view: DiffView };

const IDLE: CompareState = { kind: "Idle" };

export const useForm = (services: Services) => {
  const originalSelection = ref<CompareItem[]>([]);
  const modifiedSelection = ref<CompareItem[]>([]);
  const diffOptions = ref<DiffOptions>({ ...DEFAULT_DIFF_OPTIONS });
  const state = shallowRef<CompareState>(IDLE);

  const isComparing = computed(() => state.value.kind === "Running");

  const canCompare = computed(
    () =>
      !isComparing.value &&
      originalSelection.value.length === 1 &&
      modifiedSelection.value.length === 1,
  );

  const diffView = computed(() =>
    state.value.kind === "Done" ? state.value.view : undefined,
  );

  const compare = async (mode: DiffMode) => {
    const original = originalSelection.value[0];
    const modified = modifiedSelection.value[0];
    if (original === undefined || modified === undefined) return;

    const run = services.runDiff({
      original: original.data,
      modified: modified.data,
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
      view: { original, modified, result: outcome.value },
    };
  };

  const cancelCompare = () => {
    if (state.value.kind === "Running") state.value.cancel();
  };

  const closeDiff = () => {
    state.value = IDLE;
  };

  onUnmounted(cancelCompare);

  return {
    originalSelection,
    modifiedSelection,
    diffOptions,
    diffView,
    isComparing,
    canCompare,
    compare,
    cancelCompare,
    closeDiff,
  };
};
