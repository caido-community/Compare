import { defineStore } from "pinia";
import { type CompareItem, type Panel } from "shared";
import { computed, ref, shallowRef } from "vue";

import { useItemsStore } from "./items";

import { useSDK } from "@/plugins/sdk";
import { type DiffView } from "@/types";
import {
  DEFAULT_DIFF_OPTIONS,
  type DiffMode,
  type DiffOptions,
} from "@/utils/diff";
import { runDiff } from "@/utils/diff/run";

type CompareState =
  | { kind: "Idle" }
  | { kind: "Running"; cancel: () => void }
  | { kind: "Done"; view: DiffView };

const IDLE: CompareState = { kind: "Idle" };

export const useCompareStore = defineStore("compare", () => {
  const sdk = useSDK();
  const itemsStore = useItemsStore();

  const options = ref<DiffOptions>({ ...DEFAULT_DIFF_OPTIONS });
  const state = shallowRef<CompareState>(IDLE);

  const isComparing = computed(() => state.value.kind === "Running");

  const selectedPair = computed((): Record<Panel, CompareItem> | undefined => {
    const { original, modified } = itemsStore.selections;
    if (original.length !== 1 || modified.length !== 1) return undefined;

    const [left] = original;
    const [right] = modified;
    if (left === undefined || right === undefined) return undefined;
    return { original: left, modified: right };
  });

  const canCompare = computed(
    () => !isComparing.value && selectedPair.value !== undefined,
  );

  const diffView = computed(() =>
    state.value.kind === "Done" ? state.value.view : undefined,
  );

  const compare = async (mode: DiffMode) => {
    const pair = selectedPair.value;
    if (pair === undefined) return;

    const run = runDiff({
      original: pair.original.data,
      modified: pair.modified.data,
      mode,
      options: { ...options.value },
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
      sdk.window.showToast(`Unable to compare: ${outcome.error}`, {
        variant: "error",
      });
      return;
    }
    state.value = {
      kind: "Done",
      view: { ...pair, result: outcome.value },
    };
  };

  const cancel = () => {
    if (state.value.kind === "Running") state.value.cancel();
  };

  const close = () => {
    state.value = IDLE;
  };

  return { options, isComparing, canCompare, diffView, compare, cancel, close };
});
