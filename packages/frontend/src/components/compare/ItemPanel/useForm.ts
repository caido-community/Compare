import { type CompareItem, getOtherPanel } from "shared";
import { computed, ref, useTemplateRef } from "vue";

import { type PanelForm } from "./usePanel";

import { PANEL_ACTION_LABELS, PANEL_TITLES } from "@/core/panels";

type ContextMenuHandle = { show: (event: Event) => void };

type RowMenuEvent = { data: CompareItem; originalEvent: Event };

export const getPreview = (item: CompareItem): string =>
  item.data.split("\n", 1)[0] ?? "";

export const formatTime = (item: CompareItem): string =>
  new Date(item.createdAt).toLocaleTimeString();

export const useForm = (panel: PanelForm) => {
  const menu = useTemplateRef<ContextMenuHandle>("menu");
  const fileInput = useTemplateRef<HTMLInputElement>("fileInput");
  const menuTargets = ref<CompareItem[]>([]);

  const menuItems = computed(() => {
    const count = menuTargets.value.length;
    const target = PANEL_TITLES[getOtherPanel(panel.panel)];
    const noun = count === 1 ? "item" : "items";
    return [
      {
        label: `${PANEL_ACTION_LABELS.move} ${count} ${noun} to ${target}`,
        icon: "fas fa-exchange-alt",
        command: () => void panel.moveToOtherPanel(menuTargets.value),
      },
    ];
  });

  const openMenu = (event: RowMenuEvent) => {
    const isSelected = panel.selected.value.some(
      (item) => item.id === event.data.id,
    );
    menuTargets.value = isSelected ? panel.selected.value : [event.data];
    menu.value?.show(event.originalEvent);
  };

  const chooseFile = () => fileInput.value?.click();

  const addChosenFile = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    const file = input.files?.[0];
    input.value = "";
    if (file !== undefined) void panel.addFile(file);
  };

  return { menuItems, openMenu, chooseFile, addChosenFile };
};
