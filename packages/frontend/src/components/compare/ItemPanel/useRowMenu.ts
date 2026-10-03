import { type CompareItem } from "shared";
import { computed, ref, type Ref, useTemplateRef } from "vue";

import { ITEM_UNIT, pluralize } from "@/presentation/format";
import { PANEL_ACTIONS } from "@/presentation/panels";

type ContextMenuHandle = { show: (event: Event) => void };

type RowMenuEvent = { data: CompareItem; originalEvent: Event };

export const useRowMenu = (options: {
  targetTitle: string;
  selected: Ref<CompareItem[]>;
  move: (items: CompareItem[]) => Promise<void>;
}) => {
  const menu = useTemplateRef<ContextMenuHandle>("menu");
  const targets = ref<CompareItem[]>([]);

  const menuItems = computed(() => {
    const count = pluralize(targets.value.length, ITEM_UNIT);
    return [
      {
        label: `${PANEL_ACTIONS.move.label} ${count} to ${options.targetTitle}`,
        icon: PANEL_ACTIONS.move.icon,
        command: () => void options.move(targets.value),
      },
    ];
  });

  const openMenu = (event: RowMenuEvent) => {
    const isSelected = options.selected.value.some(
      (item) => item.id === event.data.id,
    );
    targets.value = isSelected ? options.selected.value : [event.data];
    menu.value?.show(event.originalEvent);
  };

  return { menuItems, openMenu };
};
