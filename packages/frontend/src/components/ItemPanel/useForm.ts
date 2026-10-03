import { getOtherPanel, type Panel } from "shared";
import { computed, useTemplateRef } from "vue";

import { useRowMenu } from "./useRowMenu";

import { PANEL_ACTIONS, PANEL_TITLES } from "@/constants";
import { useItemsStore } from "@/stores/items";

type ToolbarAction = {
  label: string;
  icon: string;
  severity: "danger" | "secondary" | undefined;
  isDisabled: boolean;
  run: () => void;
};

export const useForm = (panel: Panel) => {
  const itemsStore = useItemsStore();
  const fileInput = useTemplateRef<HTMLInputElement>("fileInput");

  const isBusy = computed(() => itemsStore.isBusy(panel));

  const toolbar = computed((): ToolbarAction[] => [
    {
      ...PANEL_ACTIONS.paste,
      severity: undefined,
      isDisabled: isBusy.value,
      run: () => void itemsStore.pasteClipboard(panel),
    },
    {
      ...PANEL_ACTIONS.load,
      severity: undefined,
      isDisabled: isBusy.value,
      run: () => fileInput.value?.click(),
    },
    {
      ...PANEL_ACTIONS.remove,
      severity: "danger",
      isDisabled: isBusy.value || itemsStore.selections[panel].length === 0,
      run: () => void itemsStore.removeSelected(panel),
    },
    {
      ...PANEL_ACTIONS.clear,
      severity: "secondary",
      isDisabled: isBusy.value || itemsStore.items[panel].length === 0,
      run: () => void itemsStore.clear(panel),
    },
  ]);

  const addChosenFile = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    const file = input.files?.[0];
    input.value = "";
    if (file !== undefined) void itemsStore.addFile(panel, file);
  };

  return {
    title: PANEL_TITLES[panel],
    isBusy,
    toolbar,
    addChosenFile,
    ...useRowMenu({
      targetTitle: PANEL_TITLES[getOtherPanel(panel)],
      getSelected: () => itemsStore.selections[panel],
      move: (items) => void itemsStore.move(panel, items),
    }),
  };
};
