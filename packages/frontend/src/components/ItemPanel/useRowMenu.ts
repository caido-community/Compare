import { type CompareItem } from "shared";
import { computed, ref, useTemplateRef } from "vue";

import { ITEM_UNIT, PANEL_ACTIONS } from "@/constants";
import { pluralize } from "@/utils/format";

type ContextMenuHandle = { show: (event: Event) => void };

type RowMenuEvent = { data: CompareItem; originalEvent: Event };

export const useRowMenu = (options: {
  targetTitle: string;
  getSelected: () => CompareItem[];
  move: (items: CompareItem[]) => void;
}) => {
  const menu = useTemplateRef<ContextMenuHandle>("menu");
  const targets = ref<CompareItem[]>([]);

  const menuItems = computed(() => {
    const count = pluralize(targets.value.length, ITEM_UNIT);
    return [
      {
        label: `${PANEL_ACTIONS.move.label} ${count} to ${options.targetTitle}`,
        icon: PANEL_ACTIONS.move.icon,
        command: () => options.move(targets.value),
      },
    ];
  });

  const openMenu = (event: RowMenuEvent) => {
    const selected = options.getSelected();
    const isSelected = selected.some((item) => item.id === event.data.id);
    targets.value = isSelected ? selected : [event.data];
    menu.value?.show(event.originalEvent);
  };

  return { menuItems, openMenu };
};
