import {
  type CompareItem,
  getOtherPanel,
  type ItemKind,
  type Panel,
  type Result,
} from "shared";
import { ref, type Ref } from "vue";

import { PANEL_TITLES } from "@/core/panels";
import { type Services } from "@/services";

export type PanelForm = {
  panel: Panel;
  title: string;
  items: Ref<CompareItem[]>;
  selected: Ref<CompareItem[]>;
  isBusy: Ref<boolean>;
  load: () => Promise<void>;
  select: (items: CompareItem[]) => void;
  pasteClipboard: () => Promise<void>;
  addFile: (file: File) => Promise<void>;
  removeSelected: () => Promise<void>;
  clear: () => Promise<void>;
  moveToOtherPanel: (items: CompareItem[]) => Promise<void>;
};

export const usePanel = (
  panel: Panel,
  services: Pick<Services, "items" | "notifications">,
): PanelForm => {
  const title = PANEL_TITLES[panel];
  const items = ref<CompareItem[]>([]);
  const selected = ref<CompareItem[]>([]);
  const isBusy = ref(false);

  const run = async <T>(
    action: string,
    operation: () => Promise<Result<T>>,
  ) => {
    isBusy.value = true;
    const result = await operation();
    isBusy.value = false;
    if (result.kind === "Error") {
      services.notifications.showError(`Unable to ${action}: ${result.error}`);
    }
    return result;
  };

  const load = async () => {
    const listed = await run(`load ${title}`, () =>
      services.items.listItems(panel),
    );
    if (listed.kind === "Error") return;

    const ids = new Set(listed.value.map((item) => item.id));
    items.value = listed.value;
    selected.value = selected.value.filter((item) => ids.has(item.id));
  };

  const addItem = async (kind: ItemKind, source: string, data: string) => {
    await run(`add to ${title}`, () =>
      services.items.addItem({ panel, kind, source, data }),
    );
  };

  const pasteClipboard = async () => {
    const text = await navigator.clipboard.readText().catch(() => undefined);
    if (text === undefined) {
      services.notifications.showError("Compare cannot read the clipboard.");
      return;
    }
    if (text.trim() === "") {
      services.notifications.showError("The clipboard is empty.");
      return;
    }
    await addItem("clipboard", "clipboard", text);
  };

  const addFile = async (file: File) => {
    await addItem("file", file.name, await file.text());
  };

  const removeSelected = async () => {
    const ids = selected.value.map((item) => item.id);
    await run(`remove from ${title}`, () =>
      services.items.removeItems({ panel, ids }),
    );
  };

  const clear = async () => {
    await run(`clear ${title}`, () => services.items.clearPanel(panel));
  };

  const moveToOtherPanel = async (moving: CompareItem[]) => {
    const target = PANEL_TITLES[getOtherPanel(panel)];
    const ids = moving.map((item) => item.id);
    await run(`move items to ${target}`, () =>
      services.items.moveItems({ panel, ids }),
    );
  };

  return {
    panel,
    title,
    items,
    selected,
    isBusy,
    load,
    select: (next) => {
      selected.value = next;
    },
    pasteClipboard,
    addFile,
    removeSelected,
    clear,
    moveToOtherPanel,
  };
};
